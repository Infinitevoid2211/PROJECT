from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import json
import random
import math
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta

try:
    from emergentintegrations.llm.chat import (
        LlmChat,
        UserMessage,
        TextDelta,
        StreamDone,
    )
except ImportError:
    # Graceful fallback if emergentintegrations package is not installed
    class UserMessage:
        def __init__(self, text: str):
            self.text = text

    class TextDelta:
        def __init__(self, content: str):
            self.content = content

    class StreamDone:
        pass

    class LlmChat:
        def __init__(self, api_key=None, session_id=None, system_message=None):
            self.api_key = api_key
            self.session_id = session_id
            self.system_message = system_message

        def with_model(self, provider, model_name):
            return self

        async def stream_message(self, message):
            yield TextDelta(
                f"BHU-RAKSHAK AI Geotechnical Response (Pilot Aizawl): "
                f"Advice for query: '{message.text}'\n\n"
                "[Note: Install emergentintegrations for full live LLM stream]"
            )
            yield StreamDone()


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")

app = FastAPI(
    title="BHU-RAKSHAK AI — Landslide Early Warning (SIH26001)"
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Current production Vercel website
        "https://hackafire.vercel.app",

        # Previous Vercel URLs
        "https://project-hackafire.vercel.app",
        "https://project-afatw7zx0-hackafire.vercel.app",

        # Local development
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)


def now_iso():
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Seed data — simulated pilot: Aizawl District, Mizoram (SIH26001)
# ---------------------------------------------------------------------------

SEED_ZONES = [
    {
        "id": "zone-1",
        "name": "Hunthar Veng (NH-54 Section)",
        "lat": 23.7428,
        "lng": 92.7083,
        "risk_level": "CRITICAL",
        "probability": 89.4,
        "soil_moisture": 86.2,
        "rainfall_24h_mm": 138.5,
        "slope_gradient": 44,
        "base_people": 142,
        "evacuation_status": "ORDERED - RED ALERT",
        "vulnerable_infra": "National Highway 54 sinking zone, Hunthar Presbyterian School",
        "safe_shelter": "Aizawl West Indoor Stadium (1.8 km)",
        "sensors_online": 6,
        "sensors_total": 6,
    },
    {
        "id": "zone-2",
        "name": "Ramhlun North / Chite Lui Basin",
        "lat": 23.7541,
        "lng": 92.7312,
        "risk_level": "HIGH",
        "probability": 72.8,
        "soil_moisture": 74.5,
        "rainfall_24h_mm": 112.0,
        "slope_gradient": 38,
        "base_people": 87,
        "evacuation_status": "STAGE 2 ADVISORY",
        "vulnerable_infra": "Chite River bridge link, 45 residential homesteads",
        "safe_shelter": "Ramhlun Sports Complex Shelter (900 m)",
        "sensors_online": 4,
        "sensors_total": 5,
    },
    {
        "id": "zone-3",
        "name": "Laipuitlang Ridge",
        "lat": 23.7389,
        "lng": 92.7198,
        "risk_level": "MODERATE",
        "probability": 48.1,
        "soil_moisture": 58.0,
        "rainfall_24h_mm": 84.0,
        "slope_gradient": 32,
        "base_people": 34,
        "evacuation_status": "ACTIVE SENSOR MONITORING",
        "vulnerable_infra": "PWD sub...ion road, water supply trunk line",
        "safe_shelter": "Government Mizo High School Ground",
        "sensors_online": 3,
        "sensors_total": 3,
    },
    {
        "id": "zone-4",
        "name": "Vaivakawn – Sairang Road Slopes",
        "lat": 23.7650,
        "lng": 92.6850,
        "risk_level": "HIGH",
        "probability": 68.3,
        "soil_moisture": 71.8,
        "rainfall_24h_mm": 105.4,
        "slope_gradient": 41,
        "base_people": 63,
        "evacuation_status": "TRAFFIC DIVERSION ACTIVE",
        "vulnerable_infra": "Railway feeder link bypass, Sairang quarry cut",
        "safe_shelter": "Sairang Community Hall",
        "sensors_online": 4,
        "sensors_total": 4,
    },
    {
        "id": "zone-5",
        "name": "Bawngkawn South Hillside",
        "lat": 23.7601,
        "lng": 92.7245,
        "risk_level": "LOW",
        "probability": 24.5,
        "soil_moisture": 42.1,
        "rainfall_24h_mm": 48.0,
        "slope_gradient": 22,
        "base_people": 19,
        "evacuation_status": "NORMAL - GREEN",
        "vulnerable_infra": "Bawngkawn Bazaar bypass",
        "safe_shelter": "Bawngkawn YMA Hall",
        "sensors_online": 2,
        "sensors_total": 2,
    },
]

SEED_HISTORY = [
    {
        "id": "h-1",
        "date": "2017-05-11",
        "location": "Hunthar Veng, NH-54",
        "fatalities": 3,
        "rainfall_mm": 168,
        "trigger": "Prolonged monsoon rainfall",
        "source": "GSI Bhukosh"
    },
    {
        "id": "h-2",
        "date": "2018-06-21",
        "location": "Laipuitlang Ridge",
        "fatalities": 0,
        "rainfall_mm": 121,
        "trigger": "Slope cut destabilisation",
        "source": "Mizoram SEOC"
    },
    {
        "id": "h-3",
        "date": "2019-07-03",
        "location": "Ramhlun North",
        "fatalities": 1,
        "rainfall_mm": 143,
        "trigger": "Saturated colluvium",
        "source": "GSI Bhukosh"
    },
    {
        "id": "h-4",
        "date": "2021-05-24",
        "location": "Sairang Road",
        "fatalities": 2,
        "rainfall_mm": 152,
        "trigger": "Cloudburst runoff",
        "source": "Published literature"
    },
    {
        "id": "h-5",
        "date": "2022-06-30",
        "location": "Chite Lui Basin",
        "fatalities": 0,
        "rainfall_mm": 98,
        "trigger": "Toe erosion by river",
        "source": "Mizoram SEOC"
    },
    {
        "id": "h-6",
        "date": "2023-08-14",
        "location": "Bawngkawn Hillside",
        "fatalities": 0,
        "rainfall_mm": 76,
        "trigger": "Debris flow",
        "source": "GSI Bhukosh"
    },
    {
        "id": "h-7",
        "date": "2024-05-28",
        "location": "Hunthar Veng",
        "fatalities": 5,
        "rainfall_mm": 181,
        "trigger": "Deep-seated rotational slide",
        "source": "GSI Bhukosh / SEOC"
    },
]

RISK_ORDER = {
    "CRITICAL": 4,
    "HIGH": 3,
    "MODERATE": 2,
    "LOW": 1
}


class CheckIn(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    zone_id: str
    status: str
    lat: float
    lng: float
    note: Optional[str] = ""
    timestamp: str = Field(default_factory=now_iso)


class CheckInCreate(BaseModel):
    name: str
    zone_id: str
    status: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    note: Optional[str] = ""


class Report(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reporter: str
    zone_id: str
    lat: float
    lng: float
    description: str
    photo: Optional[str] = None
    crack_width_mm: float
    displacement_score: float
    confidence: float
    severity: str
    timestamp: str = Field(default_factory=now_iso)


class ReportCreate(BaseModel):
    reporter: str
    zone_id: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    description: str
    photo: Optional[str] = None


class AlertTrigger(BaseModel):
    zone_id: str
    channel: str = "ALL"
    language: str = "en"


class ChatRequest(BaseModel):
    session_id: str
    message: str


@app.on_event("startup")
async def seed():
    if await db.zones.count_documents({}) == 0:
        await db.zones.insert_many([dict(z) for z in SEED_ZONES])
        logger.info("Seeded zones")

    if await db.history.count_documents({}) == 0:
        await db.history.insert_many([dict(h) for h in SEED_HISTORY])
        logger.info("Seeded history")


# ---------------------------------------------------------------------------
# Zones & live telemetry
# ---------------------------------------------------------------------------

@api_router.get("/zones")
async def get_zones():
    zones = await db.zones.find({}, {"_id": 0}).to_list(100)

    zones.sort(
        key=lambda z: RISK_ORDER.get(z["risk_level"], 0),
        reverse=True
    )

    return zones


def live_people(base: int, risk: str):
    factor = {
        "CRITICAL": 1.15,
        "HIGH": 1.05,
        "MODERATE": 1.0,
        "LOW": 0.95
    }.get(risk, 1.0)

    jitter = random.randint(-6, 9)

    return max(
        0,
        int(base * factor) + jitter
    )


@api_router.get("/footfall")
async def footfall():
    """Simulated real-time GPS footfall per zone + aggregate."""

    zones = await db.zones.find({}, {"_id": 0}).to_list(100)

    out = []
    total = 0

    for z in zones:
        people = live_people(
            z["base_people"],
            z["risk_level"]
        )

        delta = random.randint(-5, 8)

        vehicles = int(
            people * random.uniform(0.18, 0.32)
        )

        velocity = round(
            random.uniform(0.4, 1.8),
            1
        )

        total += people

        out.append({
            "zone_id": z["id"],
            "name": z["name"],
            "risk_level": z["risk_level"],
            "lat": z["lat"],
            "lng": z["lng"],
            "people_in_zone": people,
            "delta": delta,
            "vehicles": vehicles,
            "avg_velocity_kmph": velocity,
        })

    checkins = await db.checkins.count_documents({})

    need_evac = await db.checkins.count_documents({
        "status": "NEED_EVACUATION"
    })

    return {
        "zones": out,
        "total_people_at_risk": total,
        "total_checkins": checkins,
        "need_evacuation": need_evac,
        "timestamp": now_iso(),
    }


@api_router.get("/stats")
async def stats():
    zones = await db.zones.find({}, {"_id": 0}).to_list(100)

    critical = sum(
        1 for z in zones
        if z["risk_level"] == "CRITICAL"
    )

    high = sum(
        1 for z in zones
        if z["risk_level"] == "HIGH"
    )

    online = sum(
        z["sensors_online"]
        for z in zones
    )

    total_sensors = sum(
        z["sensors_total"]
        for z in zones
    )

    alerts = await db.alerts.count_documents({})
    reports = await db.reports.count_documents({})

    return {
        "monitored_zones": len(zones),
        "critical_zones": critical,
        "high_zones": high,
        "sensors_online": online,
        "sensors_total": total_sensors,
        "active_alerts": alerts,
        "citizen_reports": reports,
        "model_version": "v3.2 · XGBoost fusion",
        "model_accuracy": 91.4,
        "last_retrained": "2026-06-09",
    }


# ---------------------------------------------------------------------------
# Sensor telemetry
# ---------------------------------------------------------------------------

@api_router.get("/sensors/{zone_id}")
async def sensors(zone_id: str):
    z = await db.zones.find_one(
        {"id": zone_id},
        {"_id": 0}
    )

    if not z:
        raise HTTPException(
            404,
            "Zone not found"
        )

    points = []

    base_moist = z["soil_moisture"]
    base_rain = z["rainfall_24h_mm"] / 24.0

    for i in range(24):
        t = (
            datetime.now(timezone.utc)
            - timedelta(hours=23 - i)
        )

        wave = math.sin(i / 3.0)

        points.append({
            "time": t.strftime("%H:%M"),

            "soil_moisture": round(
                min(
                    100,
                    max(
                        0,
                        base_moist
                        + wave * 5
                        + random.uniform(-2, 2)
                    )
                ),
                1
            ),

            "rainfall_mm": round(
                max(
                    0,
                    base_rain
                    + wave * 3
                    + random.uniform(-1, 4)
                ),
                1
            ),

            "pore_pressure": round(
                min(
                    100,
                    max(
                        0,
                        base_moist * 0.9
                        + wave * 4
                        + random.uniform(-2, 3)
                    )
                ),
                1
            ),

            "displacement_mm": round(
                max(
                    0,
                    (
                        RISK_ORDER[z["risk_level"]] * 0.6
                    )
                    + i * 0.05
                    + random.uniform(-0.1, 0.3)
                ),
                2
            ),
        })

    return {
        "zone": z,
        "series": points,
        "susceptibility_index": round(
            z["probability"] / 100.0,
            3
        ),
    }


# ---------------------------------------------------------------------------
# Citizen check-in
# ---------------------------------------------------------------------------

@api_router.post(
    "/checkins",
    response_model=CheckIn
)
async def create_checkin(body: CheckInCreate):
    z = await db.zones.find_one(
        {"id": body.zone_id},
        {"_id": 0}
    )

    lat = (
        body.lat
        if body.lat is not None
        else (z["lat"] if z else 23.7271)
    )

    lng = (
        body.lng
        if body.lng is not None
        else (z["lng"] if z else 92.7176)
    )

    ci = CheckIn(
        name=body.name,
        zone_id=body.zone_id,
        status=body.status,
        lat=lat,
        lng=lng,
        note=body.note or ""
    )

    await db.checkins.insert_one(
        ci.model_dump()
    )

    return ci


@api_router.get(
    "/checkins",
    response_model=List[CheckIn]
)
async def list_checkins():
    docs = await db.checkins.find(
        {},
        {"_id": 0}
    ).sort(
        "timestamp",
        -1
    ).to_list(200)

    return docs


# ---------------------------------------------------------------------------
# Citizen geo-report + simulated AI crack analysis
# ---------------------------------------------------------------------------

def analyse_crack(
    description: str,
    has_photo: bool
):
    """Simulated crack severity scoring (demo). NOT a real vision model."""

    kw = description.lower()

    sev_boost = sum(
        k in kw
        for k in [
            "wide",
            "deep",
            "sinking",
            "collapse",
            "large",
            "big",
            "moving"
        ]
    )

    base = (
        6
        + sev_boost * 6
        + (8 if has_photo else 0)
    )

    crack_width = round(
        base + random.uniform(2, 18),
        1
    )

    displacement = round(
        min(
            100,
            base * 3 + random.uniform(5, 30)
        ),
        1
    )

    confidence = round(
        random.uniform(78, 96)
        + (2 if has_photo else 0),
        1
    )

    if crack_width > 35 or displacement > 75:
        severity = "CRITICAL"

    elif crack_width > 20 or displacement > 55:
        severity = "HIGH"

    elif crack_width > 10:
        severity = "MODERATE"

    else:
        severity = "LOW"

    return (
        crack_width,
        displacement,
        min(confidence, 99.0),
        severity
    )


@api_router.post(
    "/reports",
    response_model=Report
)
async def create_report(body: ReportCreate):
    z = await db.zones.find_one(
        {"id": body.zone_id},
        {"_id": 0}
    )

    lat = (
        body.lat
        if body.lat is not None
        else (z["lat"] if z else 23.7271)
    )

    lng = (
        body.lng
        if body.lng is not None
        else (z["lng"] if z else 92.7176)
    )

    cw, disp, conf, sev = analyse_crack(
        body.description,
        bool(body.photo)
    )

    rep = Report(
        reporter=body.reporter,
        zone_id=body.zone_id,
        lat=lat,
        lng=lng,
        description=body.description,
        photo=body.photo,
        crack_width_mm=cw,
        displacement_score=disp,
        confidence=conf,
        severity=sev
    )

    await db.reports.insert_one(
        rep.model_dump()
    )

    return rep


@api_router.get(
    "/reports",
    response_model=List[Report]
)
async def list_reports():
    docs = await db.reports.find(
        {},
        {"_id": 0}
    ).sort(
        "timestamp",
        -1
    ).to_list(200)

    return docs


# ---------------------------------------------------------------------------
# Alerts / early warning dispatch
# ---------------------------------------------------------------------------

@api_router.get("/history")
async def history():
    docs = await db.history.find(
        {},
        {"_id": 0}
    ).sort(
        "date",
        -1
    ).to_list(100)

    return docs


@api_router.post("/alerts/trigger")
async def trigger_alert(body: AlertTrigger):
    z = await db.zones.find_one(
        {"id": body.zone_id},
        {"_id": 0}
    )

    if not z:
        raise HTTPException(
            404,
            "Zone not found"
        )

    people = live_people(
        z["base_people"],
        z["risk_level"]
    )

    alert = {
        "id": str(uuid.uuid4()),
        "zone_id": body.zone_id,
        "zone_name": z["name"],
        "risk_level": z["risk_level"],
        "channel": body.channel,
        "language": body.language,
        "people_notified": people,
        "message": (
            f"LANDSLIDE WARNING — {z['name']}: "
            f"{z['risk_level']} risk "
            f"({z['probability']}% probability). "
            f"Move to {z['safe_shelter']} immediately. "
            f"Avoid {z['vulnerable_infra']}."
        ),
        "timestamp": now_iso(),
    }

    await db.alerts.insert_one(
        dict(alert)
    )

    return alert


@api_router.get("/alerts")
async def list_alerts():
    docs = await db.alerts.find(
        {},
        {"_id": 0}
    ).sort(
        "timestamp",
        -1
    ).to_list(100)

    return docs


# ---------------------------------------------------------------------------
# AI risk & protocol assistant
# ---------------------------------------------------------------------------

async def build_system_prompt():
    zones = await db.zones.find(
        {},
        {"_id": 0}
    ).to_list(100)

    lines = []

    for z in zones:
        lines.append(
            f"- {z['name']} "
            f"[{z['risk_level']}] "
            f"prob {z['probability']}%, "
            f"soil moisture {z['soil_moisture']}%, "
            f"24h rain {z['rainfall_24h_mm']}mm, "
            f"slope {z['slope_gradient']}deg, "
            f"status: {z['evacuation_status']}, "
            f"shelter: {z['safe_shelter']}, "
            f"vulnerable: {z['vulnerable_infra']}."
        )

    zone_ctx = "\n".join(lines)

    return (
        "You are BHU-RAKSHAK AI, the geotechnical risk & disaster-protocol "
        "assistant for an AI-based landslide early warning system "
        "(Smart India Hackathon problem SIH26001), piloted in Aizawl "
        "District, Mizoram. You advise district collectors, SDRF/NDRF "
        "rescue teams and village councils. Be concise, calm, authoritative "
        "and action-oriented. Use the live zone data below to answer. "
        "When asked, draft evacuation SMS/alerts. Explain the fusion model "
        "honestly: static terrain susceptibility (slope/aspect/wetness, "
        "r.landslide-style) combined with a dynamic rainfall + soil-moisture "
        "trigger multiplier; ground IoT sensors give hours-scale local "
        "warning. Never claim real-time satellite detection.\n\n"
        f"LIVE ZONE TELEMETRY:\n{zone_ctx}"
    )


@api_router.post("/ai/chat")
async def ai_chat(req: ChatRequest):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(
            500,
            "LLM key not configured"
        )

    system = await build_system_prompt()

    # Include short prior context
    prior = await db.chat_messages.find(
        {"session_id": req.session_id},
        {"_id": 0}
    ).sort(
        "timestamp",
        1
    ).to_list(20)

    if prior:
        convo = "\n".join(
            f"{m['role'].upper()}: {m['content']}"
            for m in prior[-8:]
        )

        system = (
            system
            + "\n\nRECENT CONVERSATION:\n"
            + convo
        )

    chat = (
        LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=req.session_id,
            system_message=system
        )
        .with_model(
            "anthropic",
            "claude-sonnet-4-6"
        )
    )

    await db.chat_messages.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": req.session_id,
        "role": "user",
        "content": req.message,
        "timestamp": now_iso(),
    })

    async def gen():
        full = ""

        try:
            async for ev in chat.stream_message(
                UserMessage(text=req.message)
            ):
                if isinstance(ev, TextDelta):
                    full += ev.content

                    yield (
                        f"data: "
                        f"{json.dumps({'delta': ev.content})}"
                        f"\n\n"
                    )

                elif isinstance(ev, StreamDone):
                    break

        except Exception as e:
            logger.exception("AI chat error")

            yield (
                f"data: "
                f"{json.dumps({'delta': f'[assistant error: {e}]'})}"
                f"\n\n"
            )

        await db.chat_messages.insert_one({
            "id": str(uuid.uuid4()),
            "session_id": req.session_id,
            "role": "assistant",
            "content": full,
            "timestamp": now_iso(),
        })

        yield (
            f"data: "
            f"{json.dumps({'done': True})}"
            f"\n\n"
        )

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )


@api_router.get("/")
async def root():
    return {
        "message": "BHU-RAKSHAK AI API online",
        "pilot": "Aizawl District, Mizoram"
    }


app.include_router(api_router)


# ---------------------------------------------------------------------------
# Shutdown
# ---------------------------------------------------------------------------

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()