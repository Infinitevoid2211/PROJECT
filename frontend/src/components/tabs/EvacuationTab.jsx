import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { riskOf } from "@/lib/constants";
import {
  ShieldCheck,
  AlertOctagon,
  MapPin,
  Building2,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EvacuationTab({
  zones,
  footfall,
  lang,
  onCheckin,
  refresh,
}) {
  const [checkins, setCheckins] = useState([]);

  const loadCheckins = () => {
    api
      .checkins()
      .then(setCheckins)
      .catch(() => setCheckins([]));
  };

  useEffect(() => {
    loadCheckins();
  }, []);

  const safeCount = checkins.filter(
    (c) => c.status === "SAFE"
  ).length;

  const evacCount = checkins.filter(
    (c) => c.status === "NEED_EVACUATION"
  ).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Top Banner & Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#0B3B60] text-white rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-200">
            Total In Risk Sectors
          </p>

          <p className="font-mono font-bold text-3xl mt-1">
            {footfall?.total_people_at_risk || 0}
          </p>

          <p className="text-[11px] text-cyan-100/70 mt-1">
            Estimated by GPS density
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Check-Ins
          </p>

          <p className="font-mono font-bold text-3xl text-slate-800 mt-1">
            {checkins.length}
          </p>

          <p className="text-[11px] text-slate-500 mt-1">
            Logged to district SEOC
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
            <ShieldCheck size={14} />
            Marked Safe
          </p>

          <p className="font-mono font-bold text-3xl text-emerald-800 mt-1">
            {safeCount}
          </p>

          <p className="text-[11px] text-emerald-600 mt-1">
            Cleared out of danger
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
              <AlertOctagon size={14} />
              Need Evacuation
            </p>

            <Button
              size="sm"
              onClick={onCheckin}
              className="h-7 px-2.5 text-xs bg-red-600 hover:bg-red-700 text-white gap-1"
            >
              <Plus size={12} />
              Check-In
            </Button>
          </div>

          <p className="font-mono font-bold text-3xl text-red-700 mt-1">
            {evacCount}
          </p>

          <p className="text-[11px] text-red-600 mt-1">
            Prioritized for NDRF/SDRF
          </p>
        </div>
      </div>

      {/* Zone Evacuation Plans */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="font-head font-bold text-slate-800 text-base">
            District Evacuation Protocols & Shelters
          </h3>

          <p className="text-xs text-slate-500 font-mono">
            Assigned safe relief complexes and hazard corridors
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {zones.map((z) => {
            const rk = riskOf(z.risk_level);

            return (
              <div
                key={z.id}
                className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-all"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ background: rk.color }}
                    />

                    <p className="font-bold text-sm text-slate-900 truncate">
                      {z.name}
                    </p>
                  </div>

                  <span
                    className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded shrink-0"
                    style={{
                      background: rk.bg,
                      color: rk.color,
                    }}
                  >
                    {z.risk_level}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Status
                    </span>

                    <span className="font-semibold text-slate-700 font-mono text-[11px]">
                      {z.evacuation_status}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                      <Building2 size={12} />
                      Designated Safe Shelter
                    </span>

                    <span className="text-slate-800 font-medium">
                      {z.safe_shelter}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      Avoid Infrastructure
                    </span>

                    <span className="text-slate-600">
                      {z.vulnerable_infra}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Check-In Register */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-head font-bold text-slate-800 text-base">
              GPS Safety & Evacuation Register
            </h3>

            <p className="text-xs text-slate-500 font-mono">
              Live citizen roll-call status with location telemetry
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadCheckins}
            className="text-xs"
          >
            Refresh
          </Button>
        </div>

        <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto thin-scroll">
          {checkins.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm font-mono">
              No citizen check-ins recorded yet.
            </div>
          ) : (
            checkins.map((c) => {
              const zone = zones.find(
                (z) => z.id === c.zone_id
              );

              const isSafe = c.status === "SAFE";

              return (
                <div
                  key={c.id}
                  className="p-4 flex items-start justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-slate-900">
                        {c.name}
                      </p>

                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isSafe
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-700 animate-pulse"
                        }`}
                      >
                        {isSafe ? (
                          <ShieldCheck size={11} />
                        ) : (
                          <AlertOctagon size={11} />
                        )}

                        {isSafe
                          ? "SAFE"
                          : "NEED EVACUATION"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin
                        size={12}
                        className="text-slate-400"
                      />

                      <span>
                        {zone?.name || c.zone_id}
                      </span>

                      <span className="font-mono text-[11px] text-slate-400 ml-1">
                        ({c.lat?.toFixed(4)},{" "}
                        {c.lng?.toFixed(4)})
                      </span>
                    </p>

                    {c.note && (
                      <p className="text-xs text-slate-600 mt-1.5 italic bg-slate-50 p-1.5 rounded border border-slate-100">
                        "{c.note}"
                      </p>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {new Date(
                      c.timestamp
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

