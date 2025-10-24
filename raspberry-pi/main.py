import RPi.GPIO as GPIO
import time
import mysql.connector
from threading import Thread
from Freenove_DHT import DHT
import firebase_admin
from firebase_admin import credentials, db as firebase_db

DHTPin = 17
servoPin = 12
buzzerPin = 37
ledPin = 36

OFFSE_DUTY = 0.5
SERVO_MIN_DUTY = 2.5 + OFFSE_DUTY
SERVO_MAX_DUTY = 12.5 + OFFSE_DUTY

cred = credentials.Certificate("/home/pi/fireapp/Freenove_Ultimate_Starter_Kit_for_Raspberry_Pi/Code/Python_GPIOZero_Code/21.1.1_DHT11/firebase-key.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://tp2objet-54062-default-rtdb.firebaseio.com/'
})

p = None
buzzer_pwm = None
test_mode = False
trap_open = False
current_temp = 0
current_humidity = 0

db_conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="oracle",
    database="surveillance"
)
cursor = db_conn.cursor()

def map(value, fromLow, fromHigh, toLow, toHigh):
    return (toHigh - toLow) * (value - fromLow) / (fromHigh - fromLow) + toLow

def setup():
    global p, buzzer_pwm
    GPIO.setmode(GPIO.BOARD)
    GPIO.setup(servoPin, GPIO.OUT)
    GPIO.output(servoPin, GPIO.LOW)
    p = GPIO.PWM(servoPin, 50)
    p.start(0)

    GPIO.setup(buzzerPin, GPIO.OUT)
    GPIO.setup(ledPin, GPIO.OUT)
    buzzer_pwm = GPIO.PWM(buzzerPin, 1000)
    buzzer_pwm.start(0)

def log_mesure():
    print("[LOG] Écriture dans MySQL et Firebase...")

    try:
        sql = """
            INSERT INTO mesures (
                temperature, humidite, etat_trappe, mode_test, alerte_activee
            ) VALUES (%s, %s, %s, %s, %s)
        """
        values = (
            current_temp,
            current_humidity,
            int(trap_open),
            int(test_mode),
            int(current_temp >= 25)
        )

        cursor.execute(sql, values)
        db_conn.commit()
        print("[LOG] Insertion MySQL réussie.")

    except Exception as e:
        print(f"[ERREUR MySQL] {e}")

    try:
        firebase_db.reference("mesures").set({
            "temperature": current_temp,
            "humidite": current_humidity,
            "etat_trappe": trap_open,
            "mode_test": test_mode,
            "alerte_activee": current_temp >= 25,
            "horodatage": time.strftime('%Y-%m-%dT%H:%M:%S')
        })
        print("[LOG]  Mise à jour Firebase réussie.")

    except Exception as e:
        print(f"[ERREUR Firebase] {e}")

def servo_control(opening=True):
    global trap_open
    target_angle = -100 if opening else 0
    duty_cycle = map(target_angle + 100, 0, 180, SERVO_MIN_DUTY, SERVO_MAX_DUTY)

    p.ChangeDutyCycle(duty_cycle)
    time.sleep(0.5)
    p.ChangeDutyCycle(0)

    trap_open = opening
    print(f"[TRAP] {'Ouverte' if opening else 'Fermée'}")
    log_mesure()

def start_buzzer():
    GPIO.output(ledPin, GPIO.HIGH)
    buzzer_pwm.ChangeDutyCycle(50)
    print("[ALERTE] Buzzer activé")

def stop_buzzer():
    GPIO.output(ledPin, GPIO.LOW)
    buzzer_pwm.ChangeDutyCycle(0)
    print("[ALERTE] Buzzer désactivé")

def read_temperature():
    global current_temp, current_humidity
    if test_mode:
        return

    dht = DHT(DHTPin)
    chk = dht.readDHT11()

    if chk == 0:
        current_humidity = dht.getHumidity()
        current_temp = dht.getTemperature()

        print(f"[TEMP] Température actuelle: {current_temp:.2f}°C")
        print(f"[HUM] Humidité actuelle: {current_humidity:.2f}%")

        if current_temp >= 25:
            start_buzzer()
            if not trap_open:
                servo_control(True)
        else:
            stop_buzzer()
            if trap_open:
                servo_control(False)

        log_mesure()
    else:
        print("[ERREUR] Lecture DHT11 échouée.")

def modify_temp(delta):
    global current_temp
    if test_mode:
        current_temp += delta
        print(f"[TEST] Température simulée: {current_temp}°C")

        if current_temp >= 25:
            start_buzzer()
            if not trap_open:
                servo_control(True)
        else:
            stop_buzzer()
            if trap_open:
                servo_control(False)
        log_mesure()

def toggle_mode():
    global test_mode
    test_mode = not test_mode
    print(f"[MODE] Mode test {'activé' if test_mode else 'désactivé'}")

def monitor_temperature():
    global running
    running = True
    while running:
        if not test_mode:
            read_temperature()
        time.sleep(5)

def on_closing():
    print("[ARRÊT] Nettoyage des broches...")
    global running
    running = False
    buzzer_pwm.stop()
    time.sleep(1)
    GPIO.cleanup()

def poll_firebase_commands():
    global test_mode
    try:
        commandes_ref = firebase_db.reference('commandes')
        commandes = commandes_ref.get()

        if not commandes:
            return

        mode_cmd = commandes.get("mode")
        if mode_cmd and not mode_cmd.get("execute", True):
            test_mode = (mode_cmd["action"] == "test")
            print(f"[CLOUD] Mode test {'activé' if test_mode else 'désactivé'}")
            firebase_db.reference("commandes/mode/execute").set(True)
            log_mesure()

        trappe_cmd = commandes.get("trappe")
        if trappe_cmd and not trappe_cmd.get("execute", True):
            if trappe_cmd["action"] == "ouvrir":
                servo_control(True)
            elif trappe_cmd["action"] == "fermer":
                servo_control(False)
            firebase_db.reference("commandes/trappe/execute").set(True)
        alarme_cmd = commandes.get("alarme")
        
        if alarme_cmd and not alarme_cmd.get("execute", True):
            if alarme_cmd["action"] == "activer":
                start_buzzer()
            elif alarme_cmd["action"] == "desactiver":
                stop_buzzer()
            firebase_db.reference("commandes/alarme/execute").set(True)
            log_mesure()
            
        firebase_temp = firebase_db.reference("mesures/temperature").get()
        if firebase_temp is not None and test_mode:
            modify_temp(firebase_temp - current_temp)
            
    except Exception as e:
        print(f"[ERREUR Firebase] {e}")

try:
    setup()
    temp_thread = Thread(target=monitor_temperature, daemon=True)
    temp_thread.start()

    while True:
        poll_firebase_commands()
        time.sleep(1)

except KeyboardInterrupt:
    print("\n[INTERRUPT] Arrêt clavier.")
    on_closing()

except Exception as e:
    print(f"[ERREUR] {e}")
    on_closing()