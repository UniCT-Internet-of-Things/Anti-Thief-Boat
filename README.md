# AntiTheftBoat
## Projct for iot subject of L-31


# How to use:
The project is meant to run in localhost and uses TTN as stack for the LoRaWAN devices.
you will need to create an env file on the backend folder containing the following:

```
cd BoatManager/backend
touch .env
```

* APIKEY  = "YOUR_TTN_API_KEY"
* MQTT_APIKEY = "YOUR_TTN_MQTT_API_KEY"
* APPLICATION_ID = "YOUR_APPLICATION_ID"
* MQTT_TENANT = "TTN_MQTT_TENANT"
* MQTT_BROKER = "TTN_MQTT_BROKER"
* MQTT_PORT = MQTT_PORT 


## Install the dependecies for the ReactApp 

```
cd BoatManager/front-end

npm install

```

## install python dependencies

```
cd BoatManager

pip install -r requirements.txt

```

## Run the main.py script

```
cd BoatManager/backend
python3 main.py

```

## Run the app 

```
cd BoatManager/front-end
npm run dev 

```
## Flash the Iot Board  
You can open the project itself with the platformio extension on vscode.

be sure to change line 78 of the main.cpp file of the porject 

```
http.begin("http://IP_OF_YOUR_BACKEND/register");  // URL del server
```

flash the device through terminal after modifing the platformio.ini with vscode extension or your Text editor of choice

```
cd Boat/Barca
pio run -t upload

```



"# Anti-Thief-Boat" 
