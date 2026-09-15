import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Cpu,
  Layers,
  GitBranch,
  Calendar,
  ShieldCheck,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";

export default function HistoryTab({ stats }) {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .history()
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = history.filter(
    (h) =>
      h.location.toLowerCase().includes(search.toLowerCase()) ||
      h.trigger.toLowerCase().includes(search.toLowerCase()) ||
      h.source.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5">
      {/* ML Model Overview Card */}
      <div className="bg-gradient-to-br from-[#0B3B60] to-[#041d33] text-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 uppercase tracking-wider mb-1">
              <Cpu size={15} /> Landslide Susceptibility & Trigger Engine
            </div>

            <h2 className="font-head font-extrabold text-2xl tracking-tight">
              {stats?.model_version || "v3.2 · XGBoost Geotechnical Fusion"}
            </h2>

            <p className="text-xs text-slate-300 mt-1 max-w-2xl font-mono">
              Hybrid early-warning architecture coupling static GIS
              geomorphological terrain susceptibility with real-time dynamic
              hydrometeorological trigger thresholds.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 text-center min-w-[100px]">
              <p className="text-[10px] uppercase font-mono text-cyan-200">
                Accuracy
              </p>

              <p className="font-mono font-extrabold text-2xl text-emerald-400">
                {stats?.model_accuracy || 91.4}%
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 text-center min-w-[100px]">
              <p className="text-[10px] uppercase font-mono text-cyan-200">
                Retrained
              </p>

              <p className="font-mono font-bold text-sm text-slate-200 mt-1">
                {stats?.last_retrained || "2026-06-09"}
              </p>
            </div>
          </div>
        </div>

        {/* 3-Tier Fusion Pipeline Explanation */}
        <div className="grid md:grid-cols-3 gap-4 pt-5">
          <div className="bg-white/5 rounded-lg p-3.5 border border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-200 mb-1">
              <Layers size={14} /> Tier 1: Static Terrain
            </div>

            <p className="text-[11px] text-slate-300">
              High-res DEM slope gradient, aspect, curvature, Topographic
              Wetness Index (TWI), lithology, and fault distance based on GSI
              Bhukosh baseline maps.
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-3.5 border border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-200 mb-1">
              <GitBranch size={14} /> Tier 2: Dynamic Meteorology
            </div>

            <p className="text-[11px] text-slate-300">
              Caine-style empirical rainfall intensity-duration threshold
              curves (I-D) combined with Antecedent Soil Moisture Index (SMI)
              calibrated for Mizoram monsoons.
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-3.5 border border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-200 mb-1">
              <ShieldCheck size={14} /> Tier 3: In-Situ IoT Validation
            </div>

            <p className="text-[11px] text-slate-300">
              Ground vibrating-wire piezometer pore pressure and borehole
              inclinometer surface displacement rates providing critical
              hours-scale warning before catastrophic failure.
            </p>
          </div>
        </div>
      </div>

      {/* Historical Landslide Archive */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-head font-bold text-slate-800 text-base">
              Historical Landslide Inventory (Aizawl District)
            </h3>

            <p className="text-xs text-slate-500 font-mono">
              Benchmark training records compiled from GSI Bhukosh & Mizoram
              SEOC
            </p>
          </div>

          <div className="w-full sm:w-64 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />

            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by location or cause…"
              className="pl-9 text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-mono text-[11px] uppercase">
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Location</th>
                <th className="py-3 px-4 font-semibold">
                  Trigger / Mechanism
                </th>
                <th className="py-3 px-4 font-semibold text-right">
                  Rainfall (24h)
                </th>
                <th className="py-3 px-4 font-semibold text-center">
                  Fatalities
                </th>
                <th className="py-3 px-4 font-semibold">Data Source</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="py-8 text-center text-slate-400 font-mono"
                  >
                    Loading historical archive…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="py-8 text-center text-slate-400 font-mono"
                  >
                    No matching historical events found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-slate-700 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Calendar
                          size={13}
                          className="text-slate-400"
                        />
                        {item.date}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {item.location}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {item.trigger}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-700 text-right">
                      {item.rainfall_mm} mm
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                          item.fatalities > 0
                            ? "bg-red-100 text-red-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.fatalities}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {item.source}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}