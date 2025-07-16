
from flask import Flask, request, send_from_directory, jsonify
import serial
import serial.tools.list_ports
import re

app = Flask(__name__)

# === Detect serial port ===
def find_usb_serial_port():
    ports = serial.tools.list_ports.comports()
    for port in ports:
        if "USB" in port.description or "UART" in port.description or "Serial" in port.description:
            print(f"[INFO] Auto-detected serial port: {port.device}")
            return port.device
    return 'COM4'  # fallback

UART_PORT = find_usb_serial_port()
UART_BAUDRATE = 9600

# === Routes ===

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/style.css')
def style():
    return send_from_directory('.', 'style.css')

@app.route('/script.js')
def script():
    return send_from_directory('.', 'script.js')

@app.route('/set_delay')
def set_delay():
    delay = request.args.get('value')
    print(f"[SERVER LOG] Set delay to: {delay}")
    try:
        with serial.Serial(port=UART_PORT, baudrate=UART_BAUDRATE, timeout=1) as ser:
            message = f'setdelay {delay}\n'
            ser.write(message.encode())
            print(f"[UART] Sent: {message.strip()} to AURIX")
    except Exception as e:
        print(f"[ERROR] UART send failed: {e}")
    return 'OK'

@app.route('/set_switch')
def set_switch():
    switch = request.args.get('value')
    print(f"[SERVER LOG] Set switch to: {switch}")
    try:
        with serial.Serial(port=UART_PORT, baudrate=UART_BAUDRATE, timeout=1) as ser:
            message = f'switch {switch}\n'
            ser.write(message.encode())
            print(f"[UART] Sent: {message.strip()} to AURIX")
    except Exception as e:
        print(f"[ERROR] UART send failed: {e}")
    return 'OK'

@app.route('/get_status')
def get_status():
    delay_value = 0
    switch_value = 0

    try:
        with serial.Serial(port=UART_PORT, baudrate=UART_BAUDRATE, timeout=1) as ser:
            # === Read RPM ===
            ser.write(b'getdelay\n')
            delay_lines = [ser.readline().decode().strip() for _ in range(3)]
            print(f"[UART] getdelay response: {delay_lines}")
            for line in delay_lines:
                match = re.search(r'-?\d+', line)  # ✅ capture signed values
                if match:
                    delay_value = int(match.group())
                    break

            # === Read switch ===
            ser.write(b'getswitch\n')
            switch_lines = [ser.readline().decode().strip() for _ in range(3)]
            print(f"[UART] getswitch response: {switch_lines}")
            for line in switch_lines:
                match = re.search(r'\b[01]\b', line)
                if match:
                    switch_value = int(match.group())
                    break

    except Exception as e:
        print(f"[ERROR] UART read failed: {e}")

    return jsonify({'rpm': delay_value, 'switch': switch_value})


@app.route('/command')
def command():
    cmd = request.args.get('type')
    print(f"[SERVER LOG] Command received: {cmd}")
    return 'OK'

# === Run Flask App ===
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)



