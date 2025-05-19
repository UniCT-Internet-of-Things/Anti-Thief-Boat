#include <iot_board.h>
#include <ESPAsyncWebServer.h>
#include <WiFi.h>
#include <AsyncTCP.h>
#include <Preferences.h>
#include <DNSServer.h> 
#include <esp_wifi.h>

//For Lora
const char *devEui = ""; 
const char *appEui = "0000000000000000";
const char *appKey = "";
char myStr[50];
char outStr[255];

byte recvStatus = 0;
int count_sent = 0;
boolean runEvery(unsigned long interval)
{
 static unsigned long previousMillis = 0;
 unsigned long currentMillis = millis();
 if (currentMillis - previousMillis >= interval)
 {
   previousMillis = currentMillis;
   return true;
 }
 return false;
}
void onLoRaReceive (sBuffer *Data_Rx, bool isConfirmed, uint8_t fPort){
  String s = String((char *) Data_Rx->Data, HEX);
  Serial.println(s);
}
//end lora 

unsigned long pressStartTime = 0;
bool isPressed = false;
Preferences preferences;
void IRAM_ATTR onBtnReleased();
void startConfigMode();
void IRAM_ATTR onBtnPressed() {
  if (!isPressed) {  
      pressStartTime = millis();  // Salva il tempo di inizio pressione
      isPressed = true;
      detachInterrupt(BTN_1);
      attachInterrupt(BTN_1, onBtnReleased, RISING);
  }
}

void IRAM_ATTR onBtnReleased() {
  if (isPressed) { // Only process if a press was registered
    unsigned long pressDuration = millis() - pressStartTime;
    isPressed = false;
    Serial.println("fino a qua si");
    if (pressDuration >= 5000) {
      //se sono qui, ho tenuto il mio bottone premuto per 5 fucking secondi.
      //startConfigMode();
      preferences.begin("user_config", false);
      preferences.putBool("setup",true);
      preferences.end();
      delay(3000);
      Serial.println("riavvio per fare la configurazione");
      ESP.restart();
    }
    detachInterrupt(BTN_1);
    attachInterrupt(BTN_1, onBtnPressed, FALLING);
  }
}


const char configPage[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <title>Configurazione Utente</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <h2>Inserisci i tuoi dati</h2>
  <form action="/save" method="POST">
    Nome: <input type="text" name="nome"><br>
    Cognome: <input type="text" name="cognome"><br>
    <input type="submit" value="Salva">
  </form>
</body>
</html>
)rawliteral";
AsyncWebServer server(80);
bool configMode = false;
String nome = "";
String cognome = "";
DNSServer dnsServer; 


  const IPAddress localIP(1,1,1,1);		   // the IP address the web server, Samsung requires the IP to be in public space
  const IPAddress gatewayIP(1,1,1,1);		   // IP address of the network should be the same as the local IP for captive portals
  const IPAddress subnetMask(255, 255, 255, 0);  // no need to change: https://avinetworks.com/glossary/subnet-mask/
  const String localIPURL = "http://1.1.1.1";
  void setUpDNSServer(DNSServer &dnsServer, const IPAddress &localIP) {
    #define DNS_INTERVAL 30
      dnsServer.setTTL(3600);
      dnsServer.start(53, "*", localIP);
    }
void startConfigMode() {
	WiFi.mode(WIFI_MODE_AP);
	const IPAddress subnetMask(255, 255, 255, 0);
	WiFi.softAPConfig(localIP, gatewayIP, subnetMask);
	WiFi.softAP("ESP32_Config");
  esp_wifi_stop();
	esp_wifi_deinit();
	wifi_init_config_t my_config = WIFI_INIT_CONFIG_DEFAULT();
	my_config.ampdu_rx_enable = false;
	esp_wifi_init(&my_config);
  vTaskDelay(100 / portTICK_PERIOD_MS); 
	esp_wifi_start();
  Serial.println("Access Point Creato: ESP32_Config");
  IPAddress myIP = WiFi.softAPIP();
  
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send_P(200, "text/html", configPage);
  });

  server.on("/save", HTTP_POST, [](AsyncWebServerRequest *request) {
    if (request->hasParam("nome", true) && request->hasParam("cognome", true)) {
      nome = request->getParam("nome", true)->value();
      cognome = request->getParam("cognome", true)->value();

      preferences.begin("user_config", false);
      preferences.putString("nome", nome);
      preferences.putString("cognome", cognome);
      preferences.putBool("setup",false);
      preferences.end();

      Serial.println(nome);
      Serial.println(cognome);
      request->send(200, "text/html", "Dati salvati. Riavvia il dispositivo.");

      delay(3000);
      ESP.restart();
    } else {
      request->send(400, "text/plain", "Dati non validi.");
    }
  }); 
	server.onNotFound([](AsyncWebServerRequest *request) {
		if (request->url() != "/") {  // Se non è già nella homepage
      request->redirect(localIPURL);
  } else {
      request->send(200, "text/html", configPage);
  }
	});

  setUpDNSServer(dnsServer, localIP);
  server.begin();
}


void setup() {
  IoTBoard::init_buttons();
  IoTBoard::init_serial();
  pinMode(BTN_1, INPUT_PULLUP);
  attachInterrupt(BTN_1, onBtnPressed, FALLING);  
  preferences.begin("user_config", false);
  nome = preferences.getString("nome", "");
  cognome = preferences.getString("cognome", "");
  configMode=preferences.getBool("setup",true);
  preferences.end();
  Serial.println("Modalità Configurazione");
  if(configMode){
    startConfigMode();
  } 
  else{
    Serial.println("Modalità Operativa");
    //no config needed , setting up Lora
    if (IoTBoard::init_lorawan()) {
      lorawan->setDeviceClass(CLASS_A);
      lorawan->setDataRate(SF9BW125);
      // set channel to random
      lorawan->setChannel(MULTI);
      lorawan->setDevEUI(devEui);
      lorawan->setAppEUI(appEui);
      lorawan->setAppKey(appKey);
      lorawan->onMessage(&onLoRaReceive);
      // Join procedure
      bool isJoined;
      do {
        Serial.println("Joining...");
        isJoined = lorawan->join();
  
        // wait for 10s to try again
        delay(10000);
      } while (!isJoined);
      Serial.println("Joined to network");
  
    } else {
      Serial.println("Error");
    }
  }
}

void loop() {
  if(configMode){
    dnsServer.processNextRequest();
    delay(DNS_INTERVAL);  // Mantieni attivo il DNS fittizio
  }else{
    
    if (runEvery(10000)) {
      //Send data with Lora
      /*sprintf(myStr, "Hello-%d", count_sent);
      lorawan->sendUplink(myStr, strlen(myStr), 1, 2);
      count_sent++;*/
    }
    lorawan->readData(outStr);
    // Check Lora RX
    lorawan->update();
  }
  
  
}

