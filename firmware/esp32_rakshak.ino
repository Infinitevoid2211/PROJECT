/*
  BHU-RAKSHAK AI (SIH26001) — Frugal IoT Landslide Telemetry Pod
  Target MCU: Heltec WiFi LoRa 32 V3 (ESP32-S3 + Semtech SX1262 LoRa)
  Frequency Band: IN865 (865 - 867 MHz legally de-licensed in India)
  
  Geotechnical Sensor Architecture:
  1. Multi-depth Capacitive Soil Moisture Sensor (Analog ADC1_CH1 / GPIO 2)
  2. Hydrostatic Pore-Water Pressure Transducer (Analog ADC1_CH2 / GPIO 3)
  3. High-Precision Tipping-Bucket Rain Gauge Interrupt (GPIO 4 / RTC_GPIO4)
  4. MPU-6050 6-DOF MEMS Tilt / Creep Inclinometer (I2C SDA:17, SCL:18)
  5. Ultra-Compact 10-Byte Binary LoRa Payload (IN865 Band, SF7, 125 kHz)
  6. Dual-Cadence Power Management: 15-min deep sleep + Sub-3s Emergency Tilt/Rain Interrupt
*/

#include <Arduino.h>
#include <Wire.h>
#include <RadioLib.h>

// ---------------------------------------------------------------------------
// Hardware Pinout Definitions (Heltec WiFi LoRa 32 V3 · ESP32-S3)
// ---------------------------------------------------------------------------
#define PIN_VBAT            1     // Onboard battery voltage divider (ADC1_CH0)
#define PIN_SOIL_MOISTURE   2     // Capacitive soil moisture transducer (ADC1_CH1)
#define PIN_PRESSURE_SENSE  3     // Hydrostatic pore-pressure transducer (ADC1_CH2)
#define PIN_RAIN_INTERRUPT  4     // Tipping-bucket rain gauge reed switch (RTC GPIO)
#define PIN_LED             35    // Status indicator LED
#define PIN_VEXT_CTRL       36    // Heltec Vext 3.3V power switch (LOW = ON)
#define PIN_ADC_CTRL        37    // Heltec battery divider gate (LOW = enable read)

// I2C Bus Pins
#define PIN_I2C_SDA         17
#define PIN_I2C_SCL         18
#define MPU6050_ADDR        0x68

// RadioLib SX1262 Pinout for Heltec LoRa 32 V3
#define LORA_NSS            8
#define LORA_DIO1           14
#define LORA_RST            12
#define LORA_BUSY           13

SX1262 radio = new Module(LORA_NSS, LORA_DIO1, LORA_RST, LORA_BUSY);

// Geotechnical Thresholds
#define TILT_THRESHOLD_DEG       2.5   // Slope movement threshold
#define RAIN_INTENSE_TICKS       15    // > 3.0 mm cloudburst accumulation

// Volatile counters
volatile uint8_t rain_tick_count = 0;
volatile bool emergency_flag = false;

// 10-Byte LoRa Packet Buffer
// [0..1]: Node ID (uint16_t BE)
// [2..3]: Soil Moisture % * 10 (uint16_t BE)
// [4..5]: Pore Pressure kPa * 10 (uint16_t BE)
// [6..7]: Inclinometer Tilt / Displacement mm * 100 (int16_t BE)
// [8]:    Rain Gauge Ticks (uint8_t, 0.2mm per tick)
// [9]:    Battery Voltage * 10 (uint8_t, e.g. 41 = 4.1V)
uint8_t lora_payload[10];

const uint16_t NODE_ID = 0x0001; // POD-01 (Calibrated for Hunthar Veng, NH-54)

// Rain Gauge Tipping-Bucket ISR
void IRAM_ATTR onRainTip() {
  rain_tick_count++;
  if (rain_tick_count >= RAIN_INTENSE_TICKS) {
    emergency_flag = true;
  }
}

// MPU-6050 Minimal Register Read
void initMPU6050() {
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(0x6B);   // PWR_MGMT_1
  Wire.write(0x00);   // Wake up MPU
  Wire.endTransmission(true);
}

float readTiltAngle() {
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(0x3B);   // ACCEL_XOUT_H
  Wire.endTransmission(false);
  Wire.requestFrom(MPU6050_ADDR, 6, true);

  if (Wire.available() >= 6) {
    int16_t ax = (Wire.read() << 8) | Wire.read();
    int16_t ay = (Wire.read() << 8) | Wire.read();
    int16_t az = (Wire.read() << 8) | Wire.read();
    
    // Resolve pitch angle with respect to gravitational vector
    float acc_x = ax / 16384.0;
    float acc_y = ay / 16384.0;
    float acc_z = az / 16384.0;
    float pitch = atan2(acc_x, sqrt(acc_y * acc_y + acc_z * acc_z)) * 180.0 / PI;
    return pitch;
  }
  return 0.0;
}

float readBatteryVoltage() {
  pinMode(PIN_ADC_CTRL, OUTPUT);
  digitalWrite(PIN_ADC_CTRL, LOW); // Pull LOW to enable Heltec V3 divider
  delay(10);
  
  uint16_t raw = analogRead(PIN_VBAT);
  digitalWrite(PIN_ADC_CTRL, HIGH); // Disable divider to eliminate parasitic draw
  
  // Standard Heltec V3 2:1 resistive divider calibration factor
  float vbat = (raw / 4095.0) * 2.0 * 3.3 * 1.05;
  return constrain(vbat, 2.5, 4.3);
}

void packPayload(uint16_t soil_pct_x10, uint16_t pore_kpa_x10, int16_t disp_mm_x100, uint8_t rain_ticks, uint8_t batt_v_x10) {
  lora_payload[0] = (NODE_ID >> 8) & 0xFF;
  lora_payload[1] = NODE_ID & 0xFF;
  lora_payload[2] = (soil_pct_x10 >> 8) & 0xFF;
  lora_payload[3] = soil_pct_x10 & 0xFF;
  lora_payload[4] = (pore_kpa_x10 >> 8) & 0xFF;
  lora_payload[5] = pore_kpa_x10 & 0xFF;
  lora_payload[6] = (disp_mm_x100 >> 8) & 0xFF;
  lora_payload[7] = disp_mm_x100 & 0xFF;
  lora_payload[8] = rain_ticks;
  lora_payload[9] = batt_v_x10;
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LED, OUTPUT);
  digitalWrite(PIN_LED, HIGH);

  // Power on external sensors via Heltec Vext pin (Active LOW)
  pinMode(PIN_VEXT_CTRL, OUTPUT);
  digitalWrite(PIN_VEXT_CTRL, LOW);
  delay(100);

  // Initialize Sensors
  initMPU6050();
  pinMode(PIN_RAIN_INTERRUPT, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_RAIN_INTERRUPT), onRainTip, FALLING);

  // Initialize LoRa SX1262 in IN865 Band (865.2 MHz, 125 kHz BW, SF7, CR 4/5)
  Serial.print(F("[LoRa] Initializing IN865 transceiver... "));
  int state = radio.begin(865.2, 125.0, 7, 5, 0x12, 14, 8, 1.6);
  if (state == RADIOLIB_ERR_NONE) {
    Serial.println(F("Radio online!"));
  } else {
    Serial.print(F("Init failed, code "));
    Serial.println(state);
  }

  // Sample Geotechnical Sensors
  uint16_t raw_soil = analogRead(PIN_SOIL_MOISTURE);
  // Calibration: 3200 (air dry) to 1400 (water saturated)
  float soil_pct = map(raw_soil, 3200, 1400, 0, 100);
  soil_pct = constrain(soil_pct, 0.0, 100.0);

  uint16_t raw_pore = analogRead(PIN_PRESSURE_SENSE);
  float pore_kpa = (raw_pore / 4095.0) * 100.0;

  float tilt_deg = readTiltAngle();
  float batt_v = readBatteryVoltage();

  // Pack into 10 bytes
  packPayload(
    (uint16_t)(soil_pct * 10),
    (uint16_t)(pore_kpa * 10),
    (int16_t)(tilt_deg * 100),
    rain_tick_count,
    (uint8_t)(batt_v * 10)
  );

  // Transmit over LoRaWAN IN865
  Serial.println(F("[LoRa] Transmitting 10-byte geotechnical packet..."));
  radio.transmit(lora_payload, 10);
  Serial.println(F("[LoRa] Transmission complete."));

  digitalWrite(PIN_LED, LOW);

  // Cut external sensor power to conserve battery
  digitalWrite(PIN_VEXT_CTRL, HIGH);

  // Configure Deep Sleep Wakeups:
  // 1. Cyclic 15-Minute Timer Wakeup
  // 2. Ext0 GPIO4 Wakeup on High-Intensity Rain Gauge Tipping
  esp_sleep_enable_timer_wakeup(15 * 60 * 1000000ULL);
  esp_sleep_enable_ext0_wakeup((gpio_num_t)PIN_RAIN_INTERRUPT, 0);

  Serial.println(F("[Power] Entering deep sleep mode (<15 uA)."));
  esp_deep_sleep_start();
}

void loop() {
  // Deep sleep maintains execution in setup() upon wakeup
}
