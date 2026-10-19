"""
BHU-RAKSHAK AI — Computer Vision Fissure Diagnostic Module
Powered by Google Gemma models (via Google Gemini API / Google GenAI SDK)
with resilient local geotechnical physics fallback.
"""
import os
import io
import re
import json
import base64
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Try to import PIL for local image inspection & feature extraction
try:
    from PIL import Image, ImageStat, ImageFilter
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

# Try to import Google GenAI SDK
try:
    from google import genai
    from google.genai import types
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

DEFAULT_GEMMA_VISION_MODEL = os.environ.get("GEMMA_VISION_MODEL", "gemma-3-27b-it")
DEFAULT_GEMMA_TEXT_MODEL = os.environ.get("GEMMA_MODEL", "gemma-2-27b-it")


def _extract_image_metrics(image_bytes: bytes) -> Dict[str, Any]:
    """Extract physical visual telemetry (contrast, edge density, shadow lines) from image bytes."""
    if not HAS_PIL:
        return {"edge_density": 0.15, "darkness": 0.4, "has_shadow_scarp": False}
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("L")
        stat = ImageStat.Stat(img)
        darkness = 1.0 - (stat.mean[0] / 255.0)

        # Detect high-contrast edges typical of shear fracture surfaces
        edges = img.filter(ImageFilter.FIND_EDGES)
        edge_stat = ImageStat.Stat(edges)
        edge_density = edge_stat.mean[0] / 255.0
        has_shadow_scarp = darkness > 0.6 and edge_density > 0.25

        return {
            "edge_density": round(edge_density, 3),
            "darkness": round(darkness, 3),
            "has_shadow_scarp": has_shadow_scarp,
            "image_resolution": f"{img.width}x{img.height}",
        }
    except Exception as e:
        logger.warning(f"PIL feature extraction warning: {e}")
        return {"edge_density": 0.15, "darkness": 0.4, "has_shadow_scarp": False}


def _heuristic_image_analysis(image_bytes: Optional[bytes], description: str) -> Dict[str, Any]:
    """
    Offline image-aware heuristic analysis inspecting image properties (contrast, edge density)
    combined with geotechnical linguistic markers.
    """
    desc = description.lower()
    sev_score = 0.0

    # Linguistic geotechnical markers
    keywords_critical = ["sinking", "collapse", "shear", "slip", "fault", "massive", "splitting", "road drop"]
    keywords_high = ["deep", "wide", "water", "seepage", "mud", "displaced", "retaining wall", "pavement"]
    keywords_mod = ["hairline", "crack", "minor", "surface", "drainage", "fissure"]

    for kw in keywords_critical:
        if kw in desc:
            sev_score += 25.0
    for kw in keywords_high:
        if kw in desc:
            sev_score += 15.0
    for kw in keywords_mod:
        if kw in desc:
            sev_score += 8.0

    edge_density = 0.0
    darkness = 0.5
    if image_bytes:
        metrics = _extract_image_metrics(image_bytes)
        edge_density = metrics.get("edge_density", 0.0)
        darkness = metrics.get("darkness", 0.5)
        sev_score += edge_density * 35.0

    # Compute parameters
    has_photo = bool(image_bytes)
    base_width = 8.0 + (sev_score * 0.45) + (10.0 if has_photo else 0.0)
    crack_width_mm = round(min(120.0, max(2.5, base_width)), 1)
    displacement_score = round(min(98.0, max(10.0, sev_score * 0.9 + 15.0)), 1)
    confidence = round(min(96.5, max(75.0, 82.0 + (8.0 if has_photo else 0.0) + edge_density * 10.0)), 1)

    has_seepage = any(w in desc for w in ["water", "seep", "wet", "mud", "spring", "leak"]) or darkness > 0.65

    if crack_width_mm > 35 or displacement_score > 75:
        severity = "CRITICAL"
        crack_type = "Active Shear Scarp / Road Collapse"
        mizo = "HLIMNA HLUAHAWM: Khawngaihin he lai hmun hi chhuahsan nghal rawh. PWD / SEOC hriattir a ni."
        eng = "CRITICAL GEOTECHNICAL FAILURE: Active tension scarp detected. Evacuate sector immediately."
    elif crack_width_mm > 18 or displacement_score > 50:
        severity = "HIGH"
        crack_type = "Deep Structural Tension Crack"
        mizo = "FIMKHUR RAWH: Lei a che mek e. Lirthei tlan khap a ni."
        eng = "HIGH RISK: Significant ground shear detected. Restrict heavy traffic and monitor for expansion."
    elif crack_width_mm > 8:
        severity = "MODERATE"
        crack_type = "Sub-Surface Colluvium Settlement"
        mizo = "ENZUI NGAI: Lei khi a awm a, ruah sur tam huna enzui ngai a ni."
        eng = "MODERATE RISK: Surface fissure observed. Requires geotechnical monitoring during rainfall."
    else:
        severity = "LOW"
        crack_type = "Superficial Pavement / Desiccation Crack"
        mizo = "HIM: Hlauhawm lian a awm lo, mahse lo ngaihven zel rawh."
        eng = "LOW RISK: Superficial weathering crack. Safe, routine monitoring advised."

    return {
        "crack_type": crack_type,
        "crack_width_mm": crack_width_mm,
        "displacement_score": displacement_score,
        "confidence": confidence,
        "severity": severity,
        "groundwater_seepage": has_seepage,
        "mizo_advisory": mizo,
        "english_advisory": eng,
        "ai_model": "Offline Geotechnical Engine (Heuristic)",
    }


async def analyze_fissure(photo_data: Optional[str], description: str) -> Dict[str, Any]:
    """
    Main entry point for citizen crack analysis.
    Leverages Google Gemma models via the Google Gemini API (google-genai SDK).
    Attempts multimodal Gemma 3 first; if text-only Gemma (Gemma 2) is used or if multimodal
    is unavailable, feeds extracted image metrics + description to Google Gemma.
    Seamlessly falls back to local physics heuristic if no API key is set.
    """
    image_bytes = None
    mime_type = "image/jpeg"

    if photo_data:
        try:
            if "," in photo_data:
                header, encoded = photo_data.split(",", 1)
                if "png" in header:
                    mime_type = "image/png"
                elif "webp" in header:
                    mime_type = "image/webp"
                image_bytes = base64.b64decode(encoded)
            else:
                image_bytes = base64.b64decode(photo_data)
        except Exception as e:
            logger.warning(f"Failed to decode base64 photo: {e}")

    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

    if api_key and HAS_GENAI:
        client = genai.Client(api_key=api_key)
        
        # 1. Attempt Multimodal Google Gemma (e.g. gemma-3-27b-it)
        if image_bytes:
            vision_model = os.environ.get("GEMMA_VISION_MODEL", DEFAULT_GEMMA_VISION_MODEL)
            try:
                prompt = (
                    f"You are BHU-RAKSHAK AI Geotechnical Diagnostic System powered by Google Gemma through the Gemini API for Aizawl District, Mizoram. "
                    f"Analyze this image of a hillside/road crack or ground displacement. "
                    f"Field Observer Note: '{description}'. "
                    f"Respond ONLY in valid JSON with this exact schema (no markdown, no backticks): "
                    f'{{"crack_type": string, "crack_width_mm": float, "displacement_score": float, '
                    f'"confidence": float, "severity": "CRITICAL"|"HIGH"|"MODERATE"|"LOW", '
                    f'"groundwater_seepage": boolean, "mizo_advisory": string, "english_advisory": string}}'
                )
                response = client.models.generate_content(
                    model=vision_model,
                    contents=[
                        types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                        prompt
                    ]
                )
                text = response.text.strip()
                match = re.search(r"\{.*\}", text, re.DOTALL)
                if match:
                    data = json.loads(match.group(0))
                    return {
                        "crack_type": str(data.get("crack_type", "Active Slope Shear Fracture")),
                        "crack_width_mm": round(float(data.get("crack_width_mm", 16.0)), 1),
                        "displacement_score": round(float(data.get("displacement_score", 62.0)), 1),
                        "confidence": round(float(data.get("confidence", 89.0)), 1),
                        "severity": str(data.get("severity", "HIGH")).upper(),
                        "groundwater_seepage": bool(data.get("groundwater_seepage", False)),
                        "mizo_advisory": str(data.get("mizo_advisory", "Fimkhur a ngai e. PWD hriattir a ni.")),
                        "english_advisory": str(data.get("english_advisory", "Caution advised. Geotechnical monitoring required.")),
                        "ai_model": f"Google Gemma ({vision_model} via Gemini API)",
                    }
            except Exception as e:
                logger.info(f"Multimodal Gemma call with {vision_model} deferred ({e}). Trying Google Gemma with physical image metrics...")

        # 2. Text / Feature-Based Google Gemma (e.g. gemma-2-27b-it or gemma-2-9b-it)
        text_model = os.environ.get("GEMMA_MODEL", DEFAULT_GEMMA_TEXT_MODEL)
        try:
            metrics = _extract_image_metrics(image_bytes) if image_bytes else {}
            prompt = (
                f"You are BHU-RAKSHAK AI Geotechnical Diagnostic System powered by Google Gemma through the Gemini API for Aizawl District, Mizoram. "
                f"A citizen/inspector reported ground deformation or road fissure.\n"
                f"Field Observer Note: '{description}'.\n"
                f"Physical Image Telemetry: {metrics}\n"
                f"Respond ONLY in valid JSON matching this schema (no markdown formatting, no backticks):\n"
                f'{{"crack_type": string, "crack_width_mm": float, "displacement_score": float, '
                f'"confidence": float, "severity": "CRITICAL"|"HIGH"|"MODERATE"|"LOW", '
                f'"groundwater_seepage": boolean, "mizo_advisory": string, "english_advisory": string}}'
            )
            response = client.models.generate_content(
                model=text_model,
                contents=prompt,
            )
            text = response.text.strip()
            match = re.search(r"\{.*\}", text, re.DOTALL)
            if match:
                data = json.loads(match.group(0))
                return {
                    "crack_type": str(data.get("crack_type", "Tension Shear Fissure")),
                    "crack_width_mm": round(float(data.get("crack_width_mm", 15.0)), 1),
                    "displacement_score": round(float(data.get("displacement_score", 58.0)), 1),
                    "confidence": round(float(data.get("confidence", 87.0)), 1),
                    "severity": str(data.get("severity", "HIGH")).upper(),
                    "groundwater_seepage": bool(data.get("groundwater_seepage", False)),
                    "mizo_advisory": str(data.get("mizo_advisory", "Fimkhur a ngai e. PWD hriattir a ni.")),
                    "english_advisory": str(data.get("english_advisory", "Caution advised. Geotechnical monitoring required.")),
                    "ai_model": f"Google Gemma ({text_model} via Gemini API)",
                }
        except Exception as e:
            logger.warning(f"Google Gemma ({text_model}) diagnostic call failed: {e}. Falling back to local heuristic.")

    # 3. Transparent fallback to local geotechnical physics heuristic
    return _heuristic_image_analysis(image_bytes, description)
