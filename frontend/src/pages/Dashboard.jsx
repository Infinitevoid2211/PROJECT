import { useState, useEffect, useCallback } from "react";
import { RadialGlowButton } from "../components/ui/radial-glow-button";
import TextAnimation from "../components/ui/staggerText";
import CheckinModal from "../components/CheckinModal";
import AIAssistant from "../components/AIAssistant";
import Header from "../components/Header";
import GisTab from "../components/tabs/GisTab";
import SensorTab from "../components/tabs/SensorTab";
import ReportTab from "../components/tabs/ReportTab";
import EvacuationTab from "../components/tabs/EvacuationTab";
import HistoryTab from "../components/tabs/HistoryTab";

import { api } from "../lib/api";
import { riskOf } from "../lib/constants";

import {
  Map,
  Activity,
  Camera,
  ShieldAlert,
  Database,
  Bot,
} from "lucide-react";

const TABS = [
  {
    id: "gis",
    label: "3D Live GIS & GPS",
    icon: Map,
    testid: "tab-3d-gis-map",
  },
  {
    id: "sensor",
    label: "Sensor & ML Warning",
    icon: Activity,
    testid: "tab-sensor-telemetry",
  },
  {
    id: "report",
    label: "Citizen Crack AI",
    icon: Camera,
    testid: "tab-citizen-report",
  },
  {
    id: "evac",
    label: "Evacuation & Check-In",
    icon: ShieldAlert,
    testid: "tab-evacuation-gps",
  },
  {
    id: "history",
    label: "History & ML Model",
    icon: Database,
    testid: "tab-history-archive",
  },
  {
    id: "ai",
    label: "AI Assistant",
    icon: Bot,
    testid: "tab-ai-assistant",
  },
];

const StatChip = ({ image, label, value, color }) => (
  <div className="flex items-center gap-2.5 px-3.5 py-2 bg-white border border-slate-200 rounded-lg shadow-sm">
    <div
      className="grid place-items-center h-10 w-10 rounded-lg overflow-hidden"
      style={{ background: `${color}18` }}
    >
      <img
        src={image}
        alt={label}
        className="h-8 w-8 object-contain"
      />
    </div>

    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">
        {label}
      </p>

      <p className="font-mono font-bold text-lg text-slate-800 leading-tight">
        {value}
      </p>
    </div>
  </div>
);

export default function Dashboard() {
  // Language state
  const [lang, setLang] = useState("en");

  const [tab, setTab] = useState("gis");
  const [zones, setZones] = useState([]);
  const [footfall, setFootfall] = useState(null);
  const [stats, setStats] = useState(null);
  const [checkinOpen, setCheckinOpen] = useState(false);

  const loadCore = useCallback(() => {
    api.zones().then(setZones);
    api.stats().then(setStats);
  }, []);

  useEffect(() => {
    loadCore();
  }, [loadCore]);

  useEffect(() => {
    const tick = () => {
      api.footfall().then(setFootfall);
    };

    tick();

    const id = setInterval(tick, 4000);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* HEADER / LANGUAGE SELECTOR */}
      <Header
        lang={lang}
        setLang={setLang}
        onCheckin={() => setCheckinOpen(true)}
        criticalCount={stats?.critical_zones ?? 0}
      />

      {/* HERO / TITLE */}
      <section className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="px-6 sm:px-8 py-8">
          <div className="max-w-4xl">

            <div className="text-2xl sm:text-4xl font-bold tracking-tight">
              <TextAnimation divideBy="word" delay={0.08}>
                Bhu-Rakshak Emergency Response
              </TextAnimation>
            </div>

            <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-400 leading-relaxed">
              Real-time disaster monitoring, geospatial intelligence and
              emergency response for Aizawl District.
            </p>

          </div>
        </div>
      </section>

      {/* LIVE RISK TICKER */}
      <div className="bg-slate-900/90 border-b border-white/5 text-slate-100 overflow-hidden whitespace-nowrap">
        <div className="tick-marquee inline-flex gap-8 py-2 text-xs font-mono">
          {[...zones, ...zones].map((z, i) => (
            <span
              key={`${z.name}-${i}`}
              className="inline-flex items-center gap-1.5"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: riskOf(z.risk_level).color,
                }}
              />

              <span>{z.name}:</span>

              <b
                style={{
                  color: riskOf(z.risk_level).color,
                }}
              >
                {z.risk_level}
              </b>

              <span>
                · {z.probability}% · {z.rainfall_24h_mm}mm/24h
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* STATS */}
      <section className="px-4 sm:px-6 pt-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">

          {/* ZONES */}
          <StatChip
            image="/images/location.jpeg"
            label="Zones"
            value={stats?.monitored_zones ?? "—"}
            color="#0B3B60"
          />

          {/* CRITICAL */}
          <StatChip
            image="/images/critical.jpeg"
            label="Critical"
            value={stats?.critical_zones ?? "—"}
            color="#DC2626"
          />

          {/* SENSORS */}
          <StatChip
            image="/images/sensors.jpeg"
            label="Sensors"
            value={
              stats
                ? `${stats.sensors_online}/${stats.sensors_total}`
                : "—"
            }
            color="#34D399"
          />

          {/* ALERTS */}
          <StatChip
            image="/images/alerts.jpeg"
            label="Alerts"
            value={stats?.active_alerts ?? "—"}
            color="#EA580C"
          />

          {/* REPORTS */}
          <StatChip
            image="/images/reports.jpeg"
            label="Reports"
            value={stats?.citizen_reports ?? "—"}
            color="#7C3AED"
          />

        </div>
      </section>

      {/* TABS */}
      <section className="px-4 sm:px-6 pt-5">
        <div className="flex gap-2 overflow-x-auto thin-scroll pb-1">

          {TABS.map((tb) => {
            const Icon = tb.icon;
            const active = tab === tb.id;

            return (
              <button
                key={tb.id}
                data-testid={tb.testid}
                onClick={() => setTab(tb.id)}
                className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 border ${
                  active
                    ? "bg-cyan-400/10 text-cyan-300 border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.12)]"
                    : "text-slate-400 border-white/5 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={16} />
                {tb.label}
              </button>
            );
          })}

        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="flex-1 px-4 sm:px-6 py-6">

        {zones.length === 0 ? (

          <div className="grid place-items-center h-96">
            <div className="text-center">

              <div className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />

              <p className="text-sm text-slate-400">
                Loading pilot data…
              </p>

            </div>
          </div>

        ) : (

          <div key={tab} className="fade-up">

            {/* GIS */}
            {tab === "gis" && (
              <GisTab
                zones={zones}
                footfall={footfall}
                lang={lang}
                refresh={loadCore}
              />
            )}

            {/* SENSOR */}
            {tab === "sensor" && (
              <SensorTab zones={zones} />
            )}

            {/* REPORT */}
            {tab === "report" && (
              <ReportTab zones={zones} />
            )}

            {/* EVACUATION */}
            {tab === "evac" && (
              <EvacuationTab
                zones={zones}
                footfall={footfall}
                lang={lang}
                onCheckin={() => setCheckinOpen(true)}
                refresh={loadCore}
              />
            )}

            {/* HISTORY */}
            {tab === "history" && (
              <HistoryTab stats={stats} />
            )}

            {/* AI ASSISTANT */}
            {tab === "ai" && (
              <div className="max-w-3xl mx-auto h-[600px]">
                <AIAssistant />
              </div>
            )}

          </div>

        )}

      </main>

      {/* FOOTER */}
      <footer className="px-6 py-4 border-t border-white/10 bg-slate-950 text-center">
        <p className="text-xs text-slate-500 font-mono">
          BHU-RAKSHAK AI · SIH26001 · Ministry of DoNER · Pilot: Aizawl
          District, Mizoram · Simulated demo data
        </p>
      </footer>

      {/* CHECK-IN MODAL */}
      <CheckinModal
        open={checkinOpen}
        onOpenChange={setCheckinOpen}
        zones={zones}
        lang={lang}
        onDone={loadCore}
      />

    </div>
  );
}