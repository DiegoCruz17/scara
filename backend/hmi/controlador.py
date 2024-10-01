import numpy as np
import serial
import math
import websocket
import json
import threading
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


# Función que se ejecuta cuando se recibe un mensaje
def on_message(ws, message):
    print(f"Mensaje crudo recibido: {message}")
    try:
        # Parseamos el mensaje JSON y lo mostramos
        data = json.loads(message)
        print(f"X: {data['X']}, Y: {data['Y']}, Z: {data['Z']}, G: {data['G']}, O: {data['O']}")
    except json.JSONDecodeError:
        print("Error al decodificar el mensaje recibido")

# Función que se ejecuta cuando ocurre un error
def on_error(ws, error):
    print(f"Error: {error}")

# Función que se ejecuta cuando la conexión se cierra
def on_close(ws, close_status_code, close_msg):
    print("Conexión cerrada")

# Función que se ejecuta cuando la conexión se abre
def on_open(ws):
    print("Conexión establecida con el servidor WebSocket")

class Controlador:
    def __init__(self) -> None:
        #Inicio
        print("Inicializando Controlador...")
        self.channel_layer = get_channel_layer()
        #Reviso conexión con serial
        self.serial = self.inicializar_serial()
        self.is_listening = False
        self.listener_thread = None
        self.modos = ["geometrico","algebraico","mth","newton","gradiente"]
        self.inicializar_control_inalambrico()

    
    def calcular_Z(self,z_obj):
        return z_obj+24.3-12.7
    def procesar_cinematica_inversa_geom(self,x, y, L3=228, L5=164):
        c2 = (x**2+y**2-L3**2-L5**2)/(2*L3*L5)
        s2a =  np.sqrt(1-c2**2)
        s2b = -np.sqrt(1-c2**2)
        # Solución 1:
        q2a = (np.arctan2(s2a, c2))*180/np.pi
        q1a = (np.arctan2(y,x) - np.arctan2(L5*s2a, L3+L5*c2))*180/np.pi
        # Solución 2:
        q2b = (np.arctan2(s2b, c2))*180/np.pi
        q1b = (np.arctan2(y,x) - np.arctan2(L5*s2b, L3+L5*c2))*180/np.pi
        # Retornar ambas soluciones
        return q1a, q2a

    def  procesar_cinematica_inversa_alg(self,x, y, L3 = 228, L5 = 164):
        c2 = (x**2+y**2-L3**2-L5**2)/(2*L3*L5)
        s2a =  np.sqrt(1-c2**2)
        s2b = -np.sqrt(1-c2**2)
        # Solución 1 
        q2a = (np.arctan2(s2a, c2))*180/np.pi
        A = np.array([[L3+L5*c2,  -L5*s2a],
                    [  L5*s2a, L3+L5*c2]])
        v = np.dot( np.linalg.inv(A), np.array([x,y]) )
        c1 = v[0]; s1 = v[1]
        q1a = (np.arctan2(s1, c1))*180/np.pi
        # Solución 2 
        q2b = (np.arctan2(s2b, c2))*180/np.pi
        A = np.array([[L3+L5*c2,  -L5*s2b],
                    [  L5*s2b, L3+L5*c2]])
        v = np.dot( np.linalg.inv(A), np.array([x,y]) )
        c1 = v[0]; s1 = v[1]
        q1b = (np.arctan2(s1, c1))*180/np.pi
        return q1a,q2a

    def procesar_cinematica_directa(self,base,z,segmento1,segmento2):
        mth0_1 = np.array([[math.cos(base*math.pi/180),-math.sin(base*math.pi/180),0,0],
                            [math.sin(base*math.pi/180),math.cos(base*math.pi/180),0,0],
                            [0,0,1,0],
                            [0,0,0,1]])@np.array([[1,0,0,0],
                                                    [0,1,0,0],
                                                    [0,0,1,104],
                                                    [0,0,0,1]])
        mth1_2 = np.array([[1,0,0,0],
                        [0,1,0,0],
                        [0,0,1,z],
                        [0,0,0,1]])@np.array([[1,0,0,228],
                                            [0,1,0,0],
                                            [0,0,1,0],
                                            [0,0,0,1]])
        mth2_3 = np.array([[math.cos(segmento1*math.pi/180),-math.sin(segmento1*math.pi/180),0,0],
                        [math.sin(segmento1*math.pi/180),math.cos(segmento1*math.pi/180),0,0],
                        [0,0,1,0],
                        [0,0,0,1]])@np.array([[1,0,0,0],
                                            [0,1,0,0],
                                            [0,0,1,-24],
                                            [0,0,0,1]])@np.array([[1,0,0,164],
                                                                [0,1,0,0],
                                                                [0,0,1,0],
                                                                [0,0,0,1]])
        mth3_4 = np.array([[math.cos(segmento2*math.pi/180),-math.sin(segmento2*math.pi/180),0,0],
                        [math.sin(segmento2*math.pi/180),math.cos(segmento2*math.pi/180),0,0],
                        [0,0,1,0],
                        [0,0,0,1]])@np.array([[1,0,0,0],
                                            [0,1,0,0],
                                            [0,0,1,-33.5],
                                            [0,0,0,1]])
        mth = mth0_1@mth1_2@mth2_3@mth3_4
        mth = np.round(mth,2)
        mth0_1 = np.round(mth0_1,2)
        mth1_2 = np.round(mth1_2,2)
        mth2_3 = np.round(mth2_3,2)
        mth3_4 = np.round(mth3_4,2)

        return mth,mth0_1,mth1_2,mth2_3,mth3_4


    def inicializar_control_inalambrico(self):
        websocket_url = "ws://192.168.43.72:81/"

        # Crear el WebSocket y asignar los callbacks
        ws = websocket.WebSocketApp(websocket_url,
                                    on_message=on_message,
                                    on_error=on_error,
                                    on_close=on_close)

        # Asignar la función que se ejecutará cuando se establezca la conexión
        ws.on_open = on_open

        # Iniciar la conexión
        ws.run_forever()

    def inicializar_serial(self, port="COM7"):
        try:
            ser = serial.Serial(port='COM7', baudrate=9600)
            print(f"Conexión establecida en el puerto {port}")
            return ser
        except:
            print("No se ha podido establecer una conexión serial")
            return None

    def start_serial_listener(self):
        if self.serial and not self.is_listening:
            self.is_listening = True
            self.listener_thread = threading.Thread(target=self._serial_listener)
            self.listener_thread.daemon = True
            self.listener_thread.start()

    def _serial_listener(self):
        while self.is_listening:
            if self.serial.in_waiting:
                try:
                    data = self.serial.readline().decode('utf-8').strip()
                    self.handle_serial_data(data)
                except Exception as e:
                    print(f"Error reading serial data: {str(e)}")

    def handle_serial_data(self, data):
        try:
            # Assuming the data is JSON-formatted
            parsed_data = json.loads(data)
            self.send_scara_update(parsed_data)
        except json.JSONDecodeError:
            print(f"Received non-JSON data: {data}")

    def send_scara_update(self, data):
        async_to_sync(self.channel_layer.group_send)(
            "scara_updates",
            {
                "type": "scara_update",
                "data": data
            }
        )

    def stop_serial_listener(self):
        self.is_listening = False
        if self.listener_thread:
            self.listener_thread.join()