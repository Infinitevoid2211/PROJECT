import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { riskOf } from "@/lib/constants";
import { Activity, Droplets, CloudRain, Gauge, MoveUpRight, Radio, ShieldAlert } from "lucide-react";

export default function SensorTab({ zones }) {
  const [selectedZoneId, setSelectedZoneId] = useState(zones[0]?.id || "");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedZoneId && zones.length > 0) {
      setSelectedZoneId(zones[0].id);
    }
  }, [zones, selectedZoneId]);

  useEffect(() => {
    if (!selectedZoneId) return;
    setLoading(true);
    api.sensors(selectedZoneId)
      .then((res) => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [selectedZoneId]);

  const activeZone = zones.find((z) => z.id === selectedZoneId) || zones[0];
  const rk = activeZone ? riskOf(activeZone.risk_level) : riskOf("LOW");
  const series = data?.series || [];

  return (
    <div className="flex flex-col gap-5">
      {/* Zone selection bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 thin-scroll">
        {zones.map((z) => {
          const zRisk = riskOf(z.risk_level);
          const active = z.id === selectedZoneId;
          return (
            <button
              key={z.id}
              onClick={() => setSelectedZoneId(z.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                active
                  ? "bg-[#0B3B60] text-white border-[#0B3B60] shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: zRisk.color }} />
              <span>{z.name}</span>
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase"
                style={{
                  background: active ? "rgba(255,255,255,0.2)" : zRisk.bg,
                  color: active ? "#ffffff" : zRisk.color,
                }}
              >
                {z.risk_level}
              </span>
            </button>
          );
        })}
      </div>

      {loading && !data ? (
        <div className="grid place-items-center h-64 bg-white rounded-xl border border-slate-200 text-slate-400 font-mono text-sm">
          Loading sensor telemetry…
        </div>
      ) : activeZone ? (
        <>
          {/* Key Metrics Row */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Susceptibility Index</span>
                <Activity size={16} className="text-[#0B3B60]" />
              </div>
              <p className="font-mono font-bold text-2xl text-slate-900">
                {data?.susceptibility_index ? (data.susceptibility_index * 100).toFixed(1) + "%" : `${activeZone.probability}%`}
              </p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, activeZone.probability)}%`,
                    background: rk.color,
                  }}
                />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Soil Moisture</span>
                <Droplets size={16} className="text-blue-500" />
              </div>
              <p className="font-mono font-bold text-2xl text-slate-900">
                {activeZone.soil_moisture}%
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Threshold: 80% saturation</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">24h Rainfall</span>
                <CloudRain size={16} className="text-cyan-600" />
              </div>
              <p className="font-mono font-bold text-2xl text-slate-900">
                {activeZone.rainfall_24h_mm} mm
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Mizoram SEOC rain gauge</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Slope Gradient</span>
                <MoveUpRight size={16} className="text-amber-600" />
              </div>
              <p className="font-mono font-bold text-2xl text-slate-900">
                {activeZone.slope_gradient}°
              </p>
              <p className="text-[11px] text-slate-500 mt-1">AWS Terrarium DEM</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">IoT Sensors</span>
                <Radio size={16} className="text-emerald-600" />
              </div>
              <p className="font-mono font-bold text-2xl text-emerald-700">
                {activeZone.sensors_online}/{activeZone.sensors_total}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Piezo + Inclinometer nodes</p>
            </div>
          </div>

          {/* Telemetry Charts */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Soil Moisture & Pore Pressure */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-head font-bold text-slate-800 text-sm">Soil Moisture & Pore Water Pressure</h3>
                  <p className="text-xs text-slate-500 font-mono">Last 24 hours · hourly intervals</p>
                </div>
                <div className="flex gap-3 text-[11px] font-mono">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Moisture</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Pore Press.</span>
                </div>
              </div>

              {/* Responsive SVG Chart */}
              <div className="h-52 w-full pt-2">
                <svg className="w-full h-full" viewBox="0 0 500 180" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="moistGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  {[0, 45, 90, 135].map((y) => (
                    <line key={y} x1="0" y1={y} x2="500" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                  ))}
                  {/* Critical Threshold line at 80% (y = 180 - (80/100)*160 = 52) */}
                  <line x1="0" y1="52" x2="500" y2="52" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
                  <text x="4" y="48" fill="#ef4444" fontSize="9" fontFamily="monospace">80% Critical Threshold</text>

                  {/* Polyline for soil moisture */}
                  {series.length > 1 && (
                    <>
                      <polygon
                        fill="url(#moistGrad)"
                        points={`0,180 ${series.map((p, i) => `${(i / (series.length - 1)) * 500},${180 - (p.soil_moisture / 100) * 160}`).join(" ")} 500,180`}
                      />
                      <polyline
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="2.5"
                        points={series.map((p, i) => `${(i / (series.length - 1)) * 500},${180 - (p.soil_moisture / 100) * 160}`).join(" ")}
                      />
                      <polyline
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="2"
                        strokeDasharray="3 3"
                        points={series.map((p, i) => `${(i / (series.length - 1)) * 500},${180 - (p.pore_pressure / 100) * 160}`).join(" ")}
                      />
                    </>
                  )}
                </svg>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-2">
                <span>{series[0]?.time || "24h ago"}</span>
                <span>{series[12]?.time || "12h ago"}</span>
                <span>{series[series.length - 1]?.time || "Now"}</span>
              </div>
            </div>

            {/* Displacement & Rainfall */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-head font-bold text-slate-800 text-sm">Slope Creep & Rainfall Distribution</h3>
                  <p className="text-xs text-slate-500 font-mono">Displacement (mm) vs Precipitation (mm/h)</p>
                </div>
                <div className="flex gap-3 text-[11px] font-mono">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /> Displacement</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan-500" /> Rain Rate</span>
                </div>
              </div>

              <div className="h-52 w-full pt-2">
                <svg className="w-full h-full" viewBox="0 0 500 180" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="dispGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {[0, 45, 90, 135].map((y) => (
                    <line key={y} x1="0" y1={y} x2="500" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                  ))}

                  {/* Rain bars */}
                  {series.map((p, i) => {
                    const barW = 500 / series.length - 3;
                    const x = (i / series.length) * 500 + 1.5;
                    const h = Math.min(150, p.rainfall_mm * 12);
                    return (
                      <rect
                        key={i}
                        x={x}
                        y={180 - h}
                        width={barW}
                        height={h}
                        fill="#06B6D4"
                        opacity="0.5"
                        rx="1"
                      />
                    );
                  })}

                  {/* Displacement line */}
                  {series.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#DC2626"
                      strokeWidth="2.5"
                      points={series.map((p, i) => {
                        const x = (i / (series.length - 1)) * 500;
                        const maxDisp = 5.0;
                        const y = 180 - Math.min(170, (p.displacement_mm / maxDisp) * 160);
                        return `${x},${y}`;
                      }).join(" ")}
                    />
                  )}
                </svg>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-2">
                <span>{series[0]?.time || "24h ago"}</span>
                <span>{series[12]?.time || "12h ago"}</span>
                <span>{series[series.length - 1]?.time || "Now"}</span>
              </div>
            </div>
          </div>

          {/* Action Protocol Card */}
          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-red-500/20 text-red-400 shrink-0">
                <ShieldAlert size={22} />
              </div>
              <div>
                <p className="font-head font-bold text-sm text-slate-100">
                  Current Protocol: {activeZone.evacuation_status}
                </p>
                <p className="text-xs text-slate-300 mt-0.5">
                  Vulnerable infrastructure: <span className="text-amber-300">{activeZone.vulnerable_infra}</span> · Safe shelter: <span className="text-emerald-300">{activeZone.safe_shelter}</span>
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-white/10 text-cyan-200">
                Lat: {activeZone.lat}°, Lng: {activeZone.lng}°
              </span>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

