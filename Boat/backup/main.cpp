#include <iot_board.h>
#include <ESPAsyncWebServer.h>
#include <WiFi.h>
#include <AsyncTCP.h>
#include <Preferences.h>
#include <DNSServer.h> 
#include <esp_wifi.h>
#include <ArduinoJson.h>
#include <HTTPClient.h> 
#include <WiFiClient.h>
#include <Wire.h>
#include "EloquentTinyML.h"
#include "model_z_pre.h"
#include <math.h>

#define LSM6DSO_ADDR 0x6B  // Indirizzo I2C del LSM6DSO (giroscopio + accelerometro)
#define LIS2MDL_ADDR 0x1E  // Indirizzo I2C del LIS2MDL (magnetometro)*
#define TF_NUM_INPUTS 5
#define TF_NUM_OUTPUTS 2
#define TF_NUM_OPS 1
#define TF_OP_FULLYCONNECTED

typedef enum{
  Allerta,
  Calma,
  Spento,
} t_stato;

// ------------------------------------------------------------------ VAR
t_stato volatile stato = Spento;
#define TENSOR_ARENA_SIZE 2 * 1024
Eloquent::TinyML::TfLite<TF_NUM_INPUTS,TF_NUM_OUTPUTS,TENSOR_ARENA_SIZE> ml;
int16_t volatile Mx, My;
int quiet_direction;
int count_sent = 0;
int livello = 0;
float input_g[5];
float input_s[5];
int counter_g = 0;
float volatile velocita_media = 1;
float campione;
int angleX, alert; 
int volatile pulse = 0;
int SensorPin = 9;
bool volatile flag_change = false; 
// --------------------------------------

void increase();
float velocita();
boolean runEvery(unsigned long interval);
int16_t readGiroData(byte reg);
int16_t readMagData(byte reg);
void onLoRaReceive (sBuffer *Data_Rx, bool isConfirmed, uint8_t fPort);
//For Lora
const char *devEui = ""; 
const char *appEui = "0000000000000000";
const char *appKey = "";
int responsecode;
char myStr[50];
char outStr[255];
String wifiOpt="";
byte recvStatus = 0;
bool configMode = false;
String targa = "";
String devui = "";
String ssid = "";
String password = "";
String suca;
Preferences preferences;
//end lora
int httpPort=5000;
const char* host = "mdz54ita.ddns.net";
const char* url = "/register/";
WiFiClient client;
void fetchDeviceData() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.setTimeout(20000); // Imposta un timeout di 10 secondi
    http.begin("http://138.197.187.41:5000/register");  // URL del server
    http.addHeader("Content-Type", "application/json");
    Serial.println("Inizio richiesta POST");
    // Creazione del JSON
    StaticJsonDocument<256> jsonDoc;
    preferences.begin("user_config",false);
    jsonDoc["username"] = preferences.getString("username", "");
    jsonDoc["deviceId"] = preferences.getString("deviceid", "");
    jsonDoc["targa"] = preferences.getString("targa", "");
    preferences.end();
    String requestBody;
    serializeJson(jsonDoc, requestBody);

    Serial.println(requestBody);
    int httpResponseCode = http.POST(requestBody);
    String response;
    if (httpResponseCode > 0) {
      response = http.getString();
      Serial.println(httpResponseCode);
      Serial.println(response);
      if (httpResponseCode == 201){
        http.end();
        StaticJsonDocument<512> responseDoc;
        DeserializationError error = deserializeJson(responseDoc, response);
        preferences.begin("user_config",false);
        preferences.putBool("setup",false);
        preferences.putString("AppKey", responseDoc["respons"]["AppKey"].as<String>());
        preferences.putString("DevEui", responseDoc["respons"]["DevEui"].as<String>());
        preferences.putString("DeviceId", responseDoc["respons"]["DeviceId"].as<String>());
        preferences.end();
        ESP.restart();
      }
    } else {
      Serial.print("Error on sending POST: ");
      Serial.println(httpResponseCode);
      display->clearDisplay();
      display->println(response);
      display->display();
    }
    http.end();
  } else {
    Serial.println("WiFi non connesso, impossibile inviare la richiesta.");
    display->clearDisplay();
    display->println("WiFi non connesso, impossibile inviare la richiesta.");
    display->display();
  }
}
bool connectToWiFi(const char* ssid, const char* password, int timeout = 2000) {
    Serial.print("Connessione a WiFi: ");
    Serial.println(ssid);

    WiFi.begin(ssid, password);  // Avvia la connessione

    unsigned long startAttemptTime = millis();

    // Attendi la connessione con un timeout
    while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < timeout) {
        Serial.print(".");
        delay(1000);
    }

    // Verifica se la connessione è riuscita
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWiFi Connesso!");
        Serial.print("IP Assegnato: ");
        Serial.println(WiFi.localIP());

    // Effettua la richiesta HTTP e processa la risposta
    
        return true;  // Connessione riuscita
    } else {
        Serial.println("\nErrore di connessione!");
        return false;  // Timeout o errore
    }
}

unsigned long pressStartTime = 0;
bool isPressed = false;
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
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Form di Registrazione</title>
    <style>
        body {
            font-family: sans-serif;
            background-color: #f4f4f4;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
        }

        .form-container {
            width: 400px;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            text-align: center;
        }

        h2 {
            color: #333;
            margin-bottom: 20px;
        }

        label {
            display: block;
            margin-bottom: 5px;
            color: #555;
            text-align: left;
        }

        input[type="text"], input[type="password"], select {
            width: 100%;
            padding: 10px;
            margin-bottom: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        }

        input[type="submit"] {
            background-color: #007bff;
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            width: 100%;
            margin-top: 10px;
        }

        input[type="submit"]:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>
    <div class="form-container">
        <h2>Registrazione Dispositivo</h2>
        <form action="/save" method="post">
            <label for="ssid">SSID della rete Wi-Fi:</label>
            <select id="ssid" name="ssid" required>
                %WIFI_OPTIONS%
            </select>

            <label for="password">Password Wi-Fi:</label>
            <input type="password" id="password" name="password" required>

            <label for="username">Username:</label>
            <input type="text" id="username" name="username" required>
            <label for="deviceid">Device id:</label>
            <input type="text" id="deviceid" name="deviceid" required>
            <label for="targa">Targa:</label>
            <input type="text" id="targa" name="targa" required>

            <input type="submit" value="Invia">
        </form>
    </div>
</body>
</html>

)rawliteral";
String scanWiFiNetworks() {
  int j=0,n=0;
  while(j<10 && n==0){
    n = WiFi.scanNetworks();
    j++;
    delay(1000);
  } 
  Serial.println("Ho fatto"+String(j)+"cicli, ho trovato "+String(n)+" reti");
  String wifiOptions = "";
  if (n == 0) {
    wifiOptions = "<option value=\"\">No networks found</option>";
  } else {
    for (int i = 0; i < n; ++i) {
      wifiOptions += "<option value=\"" + WiFi.SSID(i) + "\">" + WiFi.SSID(i) + "</option>";
    }
  }
  return wifiOptions;
}
AsyncWebServer server(80);
DNSServer dnsServer; 
bool wificonnesso=false;


  const IPAddress localIP(1,1,1,1);		   // the IP address the web server, Samsung requires the IP to be in public space
  const IPAddress gatewayIP(1,1,1,1);		   // IP address of the network should be the same as the local IP for captive portals
  const IPAddress subnetMask(255, 255, 255, 0);  // no need to change: https://avinetworks.com/glossary/subnet-mask/
  const String localIPURL = "http://1.1.1.1";
  String wifiOptions="";
  void setUpDNSServer(DNSServer &dnsServer, const IPAddress &localIP) {
    #define DNS_INTERVAL 30
      dnsServer.setTTL(3600);
      dnsServer.start(53, "*", localIP);
    }
void startConfigMode() {
  delay(5000);
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
  wifiOpt=scanWiFiNetworks();
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    
    String html = FPSTR(configPage);
        String htmlCopy = String(html); // Make a copy in RAM
    html.replace("%WIFI_OPTIONS%", wifiOpt);

    request->send(200, "text/html", html);
  });

  server.on("/save", HTTP_POST, [](AsyncWebServerRequest *request) {
    if (request->hasParam("ssid", true) && request->hasParam("password", true) &&
        request->hasParam("username", true) &&
        request->hasParam("deviceid", true) &&
        request->hasParam("targa", true)) {
      
      String ssid = request->getParam("ssid", true)->value();
      String password = request->getParam("password", true)->value();
      String username = request->getParam("username", true)->value();
      String deviceid = request->getParam("deviceid", true)->value();
      String targa = request->getParam("targa", true)->value();
      preferences.begin("user_config", false);
      preferences.putString("ssid", ssid);
      preferences.putString("password", password);
      preferences.putString("username", username);
      preferences.putString("deviceid", deviceid);
      preferences.putString("targa", targa);
      preferences.putBool("setup", false); // Configurazione completata
      preferences.end();
      wificonnesso=connectToWiFi(ssid.c_str(), password.c_str());
      if(wificonnesso){
        request->send(200, "text/html", "wifi connesso, tentativo di registrazione.");
      }else{
        request->send(400, "text/html", "Errore di connessione al wifi.");
      }
      
      
    } else {
      request->send(400, "text/plain", "Dati non validi.");
    }
  });
	server.onNotFound([](AsyncWebServerRequest *request) {
		if (request->url() != "/") {  
      request->redirect(localIPURL);
  } else {
      request->send(200, "text/html", configPage);
  }
	});

  setUpDNSServer(dnsServer, localIP);
  server.begin();
}


void setup() { 
  IoTBoard::init_display();
  // ---
  IoTBoard::init_serial(115200);
  IoTBoard::init_buttons();
  Wire.begin();
  if (!ml.begin(anomaly_model)){ Serial.println("Errore del modello.");}
  // Accendere il giroscopio (ODR = 104Hz, ±2000 dps)
  Wire.beginTransmission(LSM6DSO_ADDR);
  Wire.write(0x11);  // Registro CTRL2_G
  Wire.write(0x40);  // Imposta ODR = 104Hz, range = ±2000 dps
  Wire.endTransmission();
  // Accendere il magnetometro (ODR = 100Hz, Continuous Mode)
  Wire.beginTransmission(LIS2MDL_ADDR);
  Wire.write(0x60);  // Registro CFG_REG_A
  Wire.write(0x8C);  // Imposta ODR = 100Hz, Continuous Mode
  Wire.endTransmission();
  //flussometro
  pinMode(SensorPin, INPUT);
  attachInterrupt(digitalPinToInterrupt(SensorPin),increase, RISING);
  for(int i = 0; i<5; i++) 
    input_g[i] = input_s[i] = 0; 
  
  // inserire l'interrupt del bottone 1
  // ---

  pinMode(BTN_1, INPUT_PULLUP);
  attachInterrupt(BTN_1, onBtnPressed, FALLING);  
  preferences.begin("user_config", false);
  configMode=preferences.getBool("setup",true);
  String s1,s2;
  s1 =preferences.getString("DevEui","");
  s2 = preferences.getString("AppKey","");
  devEui= s1.c_str();
  appKey= s2.c_str();
  devui=preferences.getString("devui","");
  preferences.end();
  Serial.println("Modalità Configurazione");
  if(configMode){
    display->println("Modalità Configurazione");
    display->display();
    startConfigMode();
  } 
  else{
    Wire.begin();
  if (!ml.begin(anomaly_model)){ Serial.println("Errore del modello.");}
  
  IoTBoard::init_spi();
  Serial.println("Modalità Operativa");
    display->clearDisplay();
    display->println("Modalità operativa");
    display->display();
    delay(1000);
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
        display->clearDisplay();
        display->println("Joining...");
        display->display();
        isJoined = lorawan->join(); 
        // wait for 10s to try again
        delay(10000);
      } while (!isJoined);
      display->clearDisplay();
      display->println("Joined to network");
      display->display(); 
  
    } else {
      Serial.println("Error");
    }
  }
}

void loop() {
  if(wificonnesso){
    fetchDeviceData();
    wificonnesso=false;
  }
  if(configMode){
    dnsServer.processNextRequest();
    delay(DNS_INTERVAL);
  }else{
    delay(200);
    

    switch(stato){
      case Allerta:
        display->clearDisplay();
        display->setCursor(0,0);
        display->println("Allerta");
        display->display(); 
        //Serial.println("Allerta");
        angleX = atan2(readMagData(0x6A), readMagData(0x68)) * (180.0 / 3.14159);
        if(angleX < 0) angleX += 360;

        if(runEvery(1000)){
          sprintf(myStr, "%d;%f", angleX, velocita());        
          lorawan->sendUplink(myStr, strlen(myStr), 0, 1);
        }
        break;
      case Calma: 
        //Serial.println("Calma");
        
        display->clearDisplay();
        display->setCursor(0,0);
        display->println("Calma");
        display->display(); 
        alert = 0;

        //magnetometro
        angleX = atan2(readMagData(0x6A), readMagData(0x68)) * (180.0 / 3.14159); 
        if(angleX < 0) angleX+=360;
        if(!(angleX > (quiet_direction-50)%360 && angleX < (quiet_direction+50)%360)) alert = 1;
        
        //giroscopio
        input_g[counter_g%5] = readGiroData(0x26) / 131.0;
        if(counter_g%5==0)
          if(ml.predictClass(input_g)) alert = 1;
        //flussometro
        campione = velocita();
        if((campione - velocita_media > 10) || (campione - velocita_media < -10)) alert = 1;
    
        // Aggiornamento media mobile
        velocita_media = (0.80)*velocita_media + (0.20)*campione;
        if(velocita_media < 1) velocita_media = 1;

        //Serial.printf("AngelX %f\ncampione %f\n", angleX, campione);
        //Serial.printf("input_g [%f,%f,%f,%f,%f]\n", input_g[0], input_g[1], input_g[2], input_g[3], input_g[4]);

        if(alert) 
          stato = Allerta;
        
        counter_g+=1;
        break; 
      case Spento:
        //Serial.println("Spento"); 
        display->clearDisplay();
        display->setCursor(0,0);
        display->println("Spento");
        display->display();  
        lorawan->sendUplink("Tutto Ok", strlen("Tutto Ok"), 0, 1);
      break;
    }
    if(flag_change && stato != Spento){
      flag_change = false;
      stato = Spento;
    }
    else if(flag_change){
      flag_change = false;
      stato = Calma;
      if(runEvery(10000)){
        quiet_direction = atan2(readMagData(0x6A), readMagData(0x68)) * (180.0 / 3.14159);
      }
      if(quiet_direction < 0) quiet_direction+=360; 
      velocita_media = 1;
    }
      
      

  recvStatus = lorawan->readData(outStr);
  lorawan->update();
  //Serial.printf("Quiet direction: [%d]\nVelocita' media: [%f]\n", quiet_direction, velocita_media);
  } 
  
}

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

// Funzione per leggere i dati del giroscopio
int16_t readGiroData(byte reg) {
    Wire.beginTransmission(LSM6DSO_ADDR);
    Wire.write(reg);  // Indirizzo del registro
    Wire.endTransmission();
    
    Wire.requestFrom(LSM6DSO_ADDR, 2);  // Leggi 2 byte (byte basso e alto)
    byte lowByte = Wire.read();
    byte highByte = Wire.read();
    
    int16_t data = (highByte << 8) | lowByte;  // Combina i 2 byte in un valore 16-bit
    return data;
}

// Funzione per leggere i dati del magnetometro
int16_t readMagData(byte reg) {
    Wire.beginTransmission(LIS2MDL_ADDR);
    Wire.write(reg);  // Indirizzo del registro
    Wire.endTransmission();
    Wire.requestFrom(LIS2MDL_ADDR, 2);  // Leggi 2 byte (byte basso e alto)
    byte lowByte = Wire.read();
    byte highByte = Wire.read();
    int16_t data = (highByte << 8) | lowByte;  // Combina i 2 byte in un valore 16-bit
    return data;
}


void onLoRaReceive (sBuffer *Data_Rx, bool isConfirmed, uint8_t fPort){
  suca = String((char *) Data_Rx->Data, HEX);
  flag_change = true;
} 

void increase(){
  pulse++;
  static int lastTime = 0; 
  if(millis() - lastTime > 1000){
    pulse = 0;
    lastTime = millis(); 
  }
}
float velocita(){
  float volume = pulse*2.6; 
  return (volume/11.3)*1.94;
}
