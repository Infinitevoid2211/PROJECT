# BHU-RAKSHAK AI (SIH26001)
## AI-Based Landslide Early Warning System — Pilot: Aizawl District, Mizoram

BHU-RAKSHAK AI is an intelligent geotechnical landslide risk forecasting and disaster-protocol dispatch platform designed for the Smart India Hackathon (SIH26001) for the Ministry of Development of North Eastern Region (DoNER).

---

## System Architecture

The platform pairs a 3-tier geotechnical risk fusion pipeline with real-time IoT and citizen reporting:

1. **Static Geomorphological Susceptibility (Tier 1)**: Digital Elevation Model (DEM) slope gradient, aspect, Topographic Wetness Index (TWI), and lithology based on GSI Bhukosh baseline maps.
2. **Dynamic Hydro-Meteorological Triggers (Tier 2)**: 24h cumulative rainfall thresholds and Soil Moisture Index (SMI) calibrated for Mizoram rainfall conditions.
3. **In-Situ Sensor Telemetry (Tier 3)**: Piezometer pore water pressure and borehole inclinometer surface displacement rates.
4. **Interactive 3D GIS & GPS Telemetry**: Real-time simulated pedestrian and vehicular footfall telemetry visualized over a 3D terrain map (MapLibre GL + AWS Terrarium DEM).
5. **Citizen Crack AI**: Crowdsourced computer vision crack severity diagnostic module.
6. **Disaster Dispatch & Safety Register**: Multi-channel early warning trigger and GPS emergency check-in log.

---

## Directory Structure

```
PROJECT/
├── backend/
│   ├── .env                 # Environment variables (Mongo URL, CORS, LLM key)
│   ├── server.py            # FastAPI REST & streaming server
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── public/
│   │   └── index.html       # HTML entry point
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # Accessible UI component library
│   │   │   ├── tabs/        # Tab views (GisTab, SensorTab, ReportTab, EvacuationTab, HistoryTab)
│   │   │   ├── AIAssistant.jsx
│   │   │   ├── CheckinModal.jsx
│   │   │   ├── Header.jsx
│   │   │   └── Map3D.jsx
│   │   ├── lib/             # API client, constants, multilingual i18n, utils
│   │   ├── pages/
│   │   │   └── Dashboard.jsx
│   │   ├── App.css
│   │   ├── App.js
│   │   ├── index.css        # Tailwind & MapLibre styling
│   │   └── index.js         # React root
│   ├── .env                 # Frontend environment variables
│   ├── jsconfig.json        # Path alias resolution (@/*)
│   ├── package.json         # Node.js dependencies
│   ├── postcss.config.js
│   └── tailwind.config.js
├── backend.txt              # Original raw backend dump (preserved)
├── frontend.txt             # Original raw frontend dump (preserved)
└── README.md
```

---

## Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- MongoDB running on `localhost:27017` (or remote MongoDB connection in `backend/.env`)

### 1. Run Backend

```powershell
cd backend
python -m pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

The API will be live at `http://localhost:8000`. API docs available at `http://localhost:8000/docs`.

### 2. Run Frontend

```powershell
cd frontend
npm install
npm start
```

The web console will open at `http://localhost:3000`.

