#!/usr/bin/env python3
"""
AgriPortal Diurnal Node Simulator

Simulates real ESP32 edge telemetry nodes transmitting data to the backend:
- Diurnal cycle (sinusoidal ambient temperature & humidity inversely related)
- Solar radiation tracking daytime curves
- Soil moisture drying trends between simulated rain events
- Canopy temperature depression for CWSI calculations
- NPK nutrient levels
"""

import os
import sys
import time
import math
import random
import datetime
import urllib.request
import json

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:4000/api/v1/telemetry")
DEVICE_TOKEN = os.getenv("DEVICE_TOKEN", "mock-device-token-12345")
INTERVAL_SECONDS = float(os.getenv("INTERVAL_SECONDS", "3.0"))

def simulate_reading(tick: int):
    # Simulated diurnal cycle: 24 hour cycle represented over 120 ticks
    hour_of_day = (tick % 120) / 120.0 * 24.0
    rad = (hour_of_day / 24.0) * 2 * math.pi

    # Temperature peaks at ~14:00 (rad = 3.66)
    temp_base = 22.0
    temp_swing = 10.0 * math.sin(rad - math.pi / 2)
    temp = round(temp_base + temp_swing + random.uniform(-0.5, 0.5), 2)

    # Humidity is inversely related to temperature
    rh_base = 65.0
    rh_swing = -25.0 * math.sin(rad - math.pi / 2)
    humidity = round(max(20.0, min(95.0, rh_base + rh_swing + random.uniform(-1.0, 1.0))), 2)

    # Solar radiation: 0 at night, peaks at midday
    is_day = 6.0 <= hour_of_day <= 18.0
    solar_radiation = round(max(0.0, 850.0 * math.sin((hour_of_day - 6.0) / 12.0 * math.pi) + random.uniform(-10, 10)), 1) if is_day else 0.0

    # Soil moisture: dries gradually with random noise
    topsoil_moisture = round(32.0 - ((tick % 60) * 0.1) + random.uniform(-0.2, 0.2), 2)
    deep_soil_moisture = round(38.0 - ((tick % 60) * 0.05) + random.uniform(-0.1, 0.1), 2)

    # Canopy temperature: slightly cooler than ambient during well-watered daytime transpiration
    canopy_depression = -2.2 if topsoil_moisture > 28.0 else 1.5
    canopy_temp = round(temp + canopy_depression + random.uniform(-0.3, 0.3), 2)

    payload = {
        "temp": temp,
        "humidity": humidity,
        "canopyTemp": canopy_temp,
        "topsoilMoisture": topsoil_moisture,
        "deepSoilMoisture": deep_soil_moisture,
        "solarRadiation": solar_radiation,
        "leafWetness": 1.0 if humidity > 85.0 else 0.0,
        "npkN": 142 + random.randint(-2, 2),
        "npkP": 48 + random.randint(-1, 1),
        "npkK": 195 + random.randint(-3, 3),
        "batteryLevel": round(max(10.0, 100.0 - (tick * 0.01)), 1),
    }

    return {
        "recordedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "payload": payload,
    }

def main():
    print("=" * 60)
    print(" AgriPortal IoT Telemetry Simulator")
    print(f" Target: {BACKEND_URL}")
    print(f" Interval: {INTERVAL_SECONDS}s")
    print("=" * 60)

    tick = 0
    while True:
        tick += 1
        data = simulate_reading(tick)
        body = json.dumps(data).encode("utf-8")

        req = urllib.request.Request(
            BACKEND_URL,
            data=body,
            headers={
                "Content-Type": "application/json",
                "x-device-token": DEVICE_TOKEN,
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                status = response.getcode()
                res_body = response.read().decode("utf-8")
                print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] HTTP {status} -> {res_body}")
        except urllib.error.HTTPError as e:
            print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] HTTP {e.code} Error: {e.read().decode('utf-8')}")
        except Exception as e:
            print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Transmission error: {e}")

        time.sleep(INTERVAL_SECONDS)

if __name__ == "__main__":
    main()
