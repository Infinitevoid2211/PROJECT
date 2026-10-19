# BHU-RAKSHAK AI (SIH26001)
## AI-Based Geotechnical Landslide Early Warning & Evacuation Dispatch System
**Pilot Focus**: Aizawl District, Mizoram  
**Designed for**: Ministry of Development of North Eastern Region (DoNER) / NDMA / Mizoram SEOC  
**AI Engine**: Google Gemma (Gemma 2 / Gemma 3 via Google Gemini API)

---

BHU-RAKSHAK AI is an intelligent geotechnical landslide early warning and disaster-protocol dispatch platform developed for the Smart India Hackathon (SIH26001). It fuses physics-based limit equilibrium modeling (Terzaghi pore water pressure and Infinite Slope Factor of Safety $F_s$) with real-time IoT ground sensors, Sentinel-1 InSAR satellite creep deformation, and **Google Gemma models served through the Google Gemini API** for autonomous bilingual disaster dispatch and crowdsourced fissure diagnostics.

---

## Google Gemma Model Integration (Verifiable via Gemini API)

This project exclusively utilizes **Google Gemma** models through the official Google Gemini API (`generativelanguage.googleapis.com`) via the modern `google-genai` SDK (v2.23+).

### 1. Models Deployed

| Module | Google Gemma Model | Access Route | Purpose |
|---|---|---|---|
| **AI Disaster Assistant** | `gemma-2-27b-it` *(fallback: `gemma-2-9b-it`)* | Google Gemini API (`client.models.generate_content_stream`) | Real-time SSE streaming geotechnical risk advisory, automated bilingual Mizo/English evacuation SMS dispatch, and NDRF rescue protocol generation. |
| **Citizen Crack AI** | `gemma-3-27b-it` *(or `gemma-2-27b-it` with physical telemetry)* | Google Gemini API (`client.models.generate_content`) | Multimodal fissure diagnostic estimating crack aperture (mm), displacement score, failure mode, and bilingual safety guidance. |
| **Model Verification** | `gemma-2-27b-it` | `/api/ai/model-info` & `test_gemma.py` | Dedicated programmatic verification endpoint for hackathon evaluators and jury testing. |

### 2. How Evaluators Can Verify Google Gemma Usage

The Gemma model integration can be verified in **three independent ways**:

#### A. Automated Standalone Test Script
Run the automated verification suite from the `backend/` directory:
```powershell
cd backend
python test_gemma.py
```
This tests:
1. `google-genai` SDK installation.
2. Direct streaming inference with Google Gemma via the Gemini API.
3. Live JSON schema validation from the `/api/ai/model-info` REST endpoint.

#### B. Direct REST API Inspection
Query the live model metadata endpoint:
```powershell
curl http://localhost:8000/api/ai/model-info
```
Response:
```json
{
  "status": "ready",
  "ai_family": "Google Gemma (Open Weights by Google DeepMind)",
  "api_provider": "Google Gemini API (generativelanguage.googleapis.com)",
  "active_chat_model": "gemma-2-27b-it",
  "active_vision_model": "gemma-3-27b-it",
  "sdk": "google-genai",
  "api_key_configured": true,
  "supported_gemma_models": [
    "gemma-2-27b-it",
    "gemma-2-9b-it",
    "gemma-2-2b-it",
    "gemma-3-27b-it",
    "gemma-4-31b-it"
  ]
}
```

#### C. Live Interactive Demo (Web UI)
1. Open the web console at `http://localhost:3000`.
2. Navigate to the **AI Assistant** tab: Notice the header badge indicating `Google Gemma · Gemini API Geotechnical Intelligence` and the active model identifier `gemma-2-27b-it`.
3. Ask: *"What is the safety protocol for Hunthar Veng?"* or *"Draft an evacuation SMS for Ramhlun North"*. The response streams token-by-token directly from Google Gemma.
4. Navigate to the **Citizen Crack AI** tab: Upload an image or enter a description. The analysis badge displays `Verified: Google Gemma (Gemini API)`.
5. Navigate to the **History & ML Model** tab: Review the 4-tier fusion architecture showcasing Tier 4 Google Gemma Dispatcher.

---

## System Architecture

BHU-RAKSHAK AI couples geotechnical physical laws with modern AI reasoning across four integrated tiers:

1. **Static Geomorphological Susceptibility (Tier 1)**: Digital Elevation Model (DEM) slope gradient, aspect, Topographic Wetness Index (TWI), and lithology based on GSI Bhukosh baseline maps.
2. **Dynamic Hydro-Meteorological Triggers (Tier 2)**: 24h cumulative rainfall thresholds and Soil Moisture Index (SMI) calibrated for Mizoram monsoons.
3. **In-Situ Geotechnical Physics (Tier 3)**:
   - **Terzaghi Pore Water Pressure**:
     $$u = \gamma_w \cdot h_w \cdot \cos^2(\beta)$$
   - **Infinite Slope Factor of Safety ($F_s$)**:
     $$F_s = \frac{c' + (\gamma z \cos^2\beta - u)\tan\phi'}{\gamma z \sin\beta \cos\beta}$$
     *(Limit equilibrium failure triggered when $F_s < 1.0$)*.
4. **Sentinel-1 InSAR Satellite Creep Layer**: European Space Agency (ESA) radar interferometry measuring millimeter-scale slope subsidence ($-5$ to $-30\text{ mm/year}$) before surface rupture.
5. **Interactive 3D GIS & GPS Telemetry**: Real-time simulated pedestrian and vehicular footfall telemetry visualized over a 3D terrain map (MapLibre GL + AWS Terrarium DEM).
6. **A* Dynamic Road Evacuation Routing**: Graph routing that dynamically severs sinking highway sections (e.g. NH-54 at Hunthar Veng) and recalculates safe bypass corridors to designated relief shelters.
7. **Tier 4 Google Gemma Disaster Protocol & Crack AI**: Reasoning and multilingual dispatch engine powered by Google Gemma through the Gemini API.
8. **National Disaster Management Protocol (NDMA Sachet & CAP v1.2)**: Automated export of standardized ITU-T X.1303 Common Alerting Protocol XML feeds (`/api/alerts/{id}/cap.xml`).

---

## Directory Structure

```
PROJECT/
├── backend/
│   ├── .env                 # Environment variables (Mongo URL, CORS, Gemini API key, Gemma models)
│   ├── server.py            # FastAPI REST & SSE streaming server with Google Gemma endpoints
│   ├── geotech.py           # Terzaghi pore pressure & Infinite Slope Fs physics engine
│   ├── vision_diagnostic.py # Google Gemma multimodal image crack diagnostic
│   ├── test_gemma.py        # Standalone verification suite for hackathon judges
│   └── requirements.txt     # Python dependencies (fastapi, google-genai, motor, pillow)
├── firmware/
│   └── esp32_rakshak.ino    # Complete C++ firmware for Heltec LoRa 32 V3 (IN865 Band)
├── frontend/
│   ├── public/
│   │   ├── images/          # Metric chips and status indicators
│   │   ├── favicon.ico      # Application favicon
│   │   └── index.html       # HTML entry point
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # Accessible UI component library
│   │   │   ├── tabs/        # GisTab, SensorTab, ReportTab, EvacuationTab, HistoryTab
│   │   │   ├── AIAssistant.jsx  # Streaming Google Gemma disaster-protocol assistant
│   │   │   ├── CheckinModal.jsx # GPS citizen check-in modal
│   │   │   ├── Header.jsx       # Operational header with audio siren, clock & i18n
│   │   │   └── Map3D.jsx        # MapLibre 3D terrain + InSAR satellite layer
│   │   ├── lib/
│   │   │   ├── aizawlRoads.js   # GeoJSON road network & A* evacuation solver
│   │   │   ├── api.js           # REST & telemetry API client
│   │   │   ├── constants.js     # Risk levels & styling definitions
│   │   │   └── i18n.js          # Multilingual dictionary (English, Mizo, Hindi, Bengali)
│   │   ├── pages/
│   │   │   └── Dashboard.jsx    # Master command center dashboard
│   │   ├── App.css
│   │   ├── App.js
│   │   ├── index.css        # Tailwind & MapLibre styling
│   │   └── index.js         # React root
│   ├── .env                 # Frontend environment variables
│   ├── jsconfig.json        # Path alias resolution (@/*)
│   ├── package.json         # Node.js dependencies
│   ├── postcss.config.js
│   └── tailwind.config.js
├── COST_REPORT.md           # Tier 2 Industrial Infrastructure Financial Report
├── NEW_INNOVATIONS_AND_HACKATHON_DEFENSE.md # Tier 1 Frugal Hardware & Defense Guide
└── README.md
```

---

## Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- *(Optional)* MongoDB (If MongoDB is not running, the backend automatically uses an internal resilient in-memory datastore with zero configuration)
- Gemini API Key (for live Google Gemma inference)

### 1. Configure API Key
Open `backend/.env` and add your Gemini API key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMMA_MODEL=gemma-2-27b-it
GEMMA_VISION_MODEL=gemma-3-27b-it
```
> **Security Note**: Never share or paste your secret API key into chat prompts or commit it to version control. The backend automatically loads it from `backend/.env`.

### 2. Run Backend

```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn server:app --reload --port 8000
```

The API will be live at `http://localhost:8000`:
- Interactive Docs: `http://localhost:8000/docs`
- Google Gemma Model Info: `http://localhost:8000/api/ai/model-info`
- CAP v1.2 XML Feed: `http://localhost:8000/api/alerts/sample/cap.xml`
- InSAR Satellite Creep: `http://localhost:8000/api/insar/displacement`

### 3. Verify Google Gemma Integration

```powershell
cd backend
python test_gemma.py
```

### 4. Run Frontend

```powershell
cd frontend
npm install
npm start
```

The web console will open at `http://localhost:3000`.

---

## Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/ai/model-info` | Returns active Google Gemma model configuration & verification metadata. |
| `POST` | `/api/ai/chat` | Streaming geotechnical disaster-protocol assistant powered by Google Gemma (`gemma-2-27b-it`). |
| `POST` | `/api/reports` | Multimodal Vision crack analysis powered by Google Gemma (`gemma-3-27b-it`). |
| `GET` | `/api/zones` | Returns 5 monitored pilot zones with dynamic $F_s$ Factor of Safety. |
| `GET` | `/api/sensors/{zone_id}` | Returns 24h rolling time-series, pore pressure, and displacement. |
| `POST` | `/api/telemetry/ingest` | Ingests LoRa 10-byte binary hex or JSON payloads, updates zone $F_s$. |
| `POST` | `/api/chirpstack/webhook` | Direct ChirpStack v4 uplink integration. |
| `GET` | `/api/alerts/{id}/cap.xml` | Standardized NDMA Sachet CAP v1.2 XML alert feed. |
| `GET` | `/api/insar/displacement` | Sentinel-1 SAR millimeter-scale line-of-sight velocity points. |
