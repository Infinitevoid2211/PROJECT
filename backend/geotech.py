"""
BHU-RAKSHAK AI — Geotechnical Physics & Telemetry Engine
Calibrated for Aizawl District, Mizoram (Flysch Sandstone-Shale Sequence)
"""
import math
from typing import Dict, Any, Tuple, Optional


def compute_pore_pressure(
    soil_moisture_pct: float,
    rainfall_24h_mm: float,
    slope_deg: float,
    depth_m: float = 3.5,
    gamma_w: float = 9.81,
) -> float:
    """
    Computes underground pore-water pressure (u in kPa) using Terzaghi's hydrological model:
    u = gamma_w * h_w * cos^2(beta)
    where h_w is the effective perched water table head developed above the shear plane.
    """
    beta = math.radians(max(5.0, min(80.0, slope_deg)))
    saturation_ratio = max(0.0, min(1.0, soil_moisture_pct / 100.0))
    # Effective water head based on saturation and antecedent infiltration
    h_w = depth_m * (saturation_ratio ** 1.8) * (1.0 + min(2.0, rainfall_24h_mm / 100.0))
    u = gamma_w * h_w * (math.cos(beta) ** 2)
    return round(float(u), 2)


def compute_factor_of_safety(
    slope_deg: float,
    soil_moisture_pct: float,
    rainfall_24h_mm: float,
    pore_pressure_kpa: Optional[float] = None,
    cohesion_kpa: float = 12.5,     # Effective cohesion c' (typical Aizawl colluvium/shale)
    phi_deg: float = 28.0,           # Internal friction angle phi'
    depth_m: float = 3.5,            # Shear plane depth
    gamma_kn: float = 18.5,          # Saturated soil unit weight kN/m^3
) -> Tuple[float, float, str, float]:
    """
    Computes the Infinite Slope Factor of Safety (Fs):
    Fs = [ c' + (gamma * z * cos^2(beta) - u) * tan(phi') ] / [ gamma * z * sin(beta) * cos(beta) ]
    
    Returns:
    (Fs, pore_pressure_kpa, risk_level, failure_probability_pct)
    """
    beta = math.radians(max(5.0, min(80.0, slope_deg)))
    phi = math.radians(phi_deg)

    if pore_pressure_kpa is None:
        u = compute_pore_pressure(soil_moisture_pct, rainfall_24h_mm, slope_deg, depth_m)
    else:
        u = max(0.0, pore_pressure_kpa)

    normal_stress = gamma_kn * depth_m * (math.cos(beta) ** 2)
    effective_normal = max(0.0, normal_stress - u)
    
    shear_strength = cohesion_kpa + effective_normal * math.tan(phi)
    shear_stress = gamma_kn * depth_m * math.sin(beta) * math.cos(beta)
    
    fs = shear_strength / max(0.01, shear_stress)
    fs_clamped = round(float(max(0.1, min(5.0, fs))), 2)

    # Map Fs to Failure Probability and Risk Level
    # Fs < 1.0 indicates limit equilibrium failure
    if fs_clamped < 1.0:
        risk = "CRITICAL"
        # 80% to 98%
        prob = 80.0 + (1.0 - fs_clamped) * 30.0
    elif fs_clamped < 1.25:
        risk = "HIGH"
        # 60% to 80%
        prob = 60.0 + (1.25 - fs_clamped) * 80.0
    elif fs_clamped < 1.55:
        risk = "MODERATE"
        # 35% to 60%
        prob = 35.0 + (1.55 - fs_clamped) * 83.3
    else:
        risk = "LOW"
        # 5% to 35%
        prob = max(5.0, 35.0 - (fs_clamped - 1.55) * 20.0)

    prob_clamped = round(float(min(98.5, max(5.0, prob))), 1)
    return fs_clamped, u, risk, prob_clamped


def decode_lora_payload(payload_bytes: bytes) -> Dict[str, Any]:
    """
    Decodes the 10-byte binary packet transmitted by the ESP32-S3 LoRaWAN Pod.
    Format:
    [0..1]: Node ID (uint16 BE)
    [2..3]: Soil Moisture % * 10 (uint16 BE)
    [4..5]: Pore Pressure kPa * 10 (uint16 BE)
    [6..7]: Surface Displacement / Tilt mm * 100 (int16 BE)
    [8]:    Rain Gauge Tick Counter (uint8, 0.2mm per tick)
    [9]:    Battery Voltage * 10 (uint8, e.g. 41 = 4.1V)
    """
    if len(payload_bytes) < 10:
        raise ValueError(f"Payload too short: expected 10 bytes, got {len(payload_bytes)}")

    node_id = int.from_bytes(payload_bytes[0:2], byteorder="big")
    soil_raw = int.from_bytes(payload_bytes[2:4], byteorder="big")
    pore_raw = int.from_bytes(payload_bytes[4:6], byteorder="big")
    disp_raw = int.from_bytes(payload_bytes[6:8], byteorder="big", signed=True)
    rain_ticks = payload_bytes[8]
    batt_raw = payload_bytes[9]

    return {
        "node_id": f"POD-{node_id:02d}",
        "soil_moisture": round(soil_raw / 10.0, 1),
        "pore_pressure": round(pore_raw / 10.0, 1),
        "displacement_mm": round(disp_raw / 100.0, 2),
        "rain_recent_mm": round(rain_ticks * 0.2, 1),
        "battery_voltage": round(batt_raw / 10.0, 1),
    }

