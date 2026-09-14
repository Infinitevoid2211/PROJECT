import { useState, useEffect, useRef } from "react";
import Map3D from "@/components/Map3D";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { riskOf } from "@/lib/constants";
import { t } from "@/lib/i18n";
import { Users, TrendingUp, TrendingDown, Car, Gauge, Flame, MapPin, Send } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current, to = value, start = performance.now(), dur = 600;
    let raf;
    const step = (now) => {
      const p = Math.min(1, (now - start) / dur);
      setDisplay(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    prev.current = value;
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{display.toLocaleString("en-IN")}</>;
}

export default function GisTab({ zones, footfall, lang, refresh }) {
  const [heatmap, setHeatmap] = useState(true);
  const [focus, setFocus] = useState(null);
  const [sending, setSending] = useState(false);

  const dispatch = async (z) => {
    setSending(true);
    try {
      const a = await api.triggerAlert({ zone_id: z.id, channel: "ALL", language: lang });
      toast.success(`Early warning dispatched to ${a.people_notified} people in ${z.name}`);
      refresh && refresh();
    } catch (e) { toast.error("Dispatch failed"); } finally { setSending(false); }
  };

  const fz = footfall?.zones || [];

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="relative bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm">
          <div className="h-[420px] sm:h-[520px]">
            <Map3D zones={zones} footfall={footfall} showHeatmap={heatmap} focusZone={focus}
              onSelectZone={(id) => setFocus(zones.find((z) => z.id === id))} />
          </div>
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <div className="glass px-3 py-2 rounded-lg bg-white/90 backdrop-blur-md border border-slate-200 shadow-md flex items-center gap-2">
              <Flame size={15} className="text-rose-500" />
              <span className="text-xs font-semibold text-slate-700">Footfall Heatmap</span>
              <Switch data-testid="gps-zone-heatmap-toggle" checked={heatmap} onCheckedChange={setHeatmap} />
            </div>
          </div>
          <div className="absolute bottom-4 left-4 glass px-3 py-2 rounded-lg bg-white/90 backdrop-blur-md border border-slate-200 shadow-md">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Risk Level</p>
            <div className="flex gap-3">
              {["CRITICAL", "HIGH", "MODERATE", "LOW"].map((r) => (
                <div key={r} className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: riskOf(r).color }} />
                  <span className="text-[10px] font-mono text-slate-600">{riskOf(r).label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div data-testid="gps-footfall-live-counter" className="bg-[#0B3B60] text-white rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200/90 flex items-center gap-1.5"><Users size={13} /> {t("peopleAtRisk", lang)}</p>
          <p className="font-mono font-bold text-5xl mt-2 tracking-tight"><AnimatedNumber value={footfall?.total_people_at_risk || 0} /></p>
          <div className="flex gap-4 mt-3 text-xs font-mono text-cyan-100/80">
            <span>{footfall?.total_checkins || 0} check-ins</span>
            <span className="text-red-300">{footfall?.need_evacuation || 0} need evac</span>
          </div>
          <p className="text-[10px] text-white/50 mt-2 font-mono">Simulated GPS telemetry · updates every 4s</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="font-head font-bold text-sm text-slate-800 flex items-center gap-2"><MapPin size={15} className="text-[#065F46]" /> Live Zone Footfall</p>
          </div>
          <div className="divide-y divide-slate-100 max-h-[440px] overflow-y-auto thin-scroll">
            {fz.map((z) => {
              const rk = riskOf(z.risk_level);
              return (
                <div key={z.zone_id} data-testid={`footfall-zone-${z.zone_id}`} className="p-3.5 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setFocus(zones.find((x) => x.id === z.zone_id))}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: rk.color }} />
                        <p className="text-sm font-semibold text-slate-800 truncate">{z.name}</p>
                      </div>
                      <span className="text-[10px] font-bold font-mono uppercase px-1.5 py-0.5 rounded mt-1 inline-block" style={{ background: rk.bg, color: rk.color }}>{z.risk_level}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-lg text-slate-900">{z.people_in_zone}</p>
                      <p className={`text-[11px] font-mono flex items-center gap-0.5 justify-end ${z.delta >= 0 ? "text-red-500" : "text-emerald-600"}`}>
                        {z.delta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {z.delta >= 0 ? "+" : ""}{z.delta}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-slate-500">
                    <span className="flex items-center gap-1"><Car size={11} /> {z.vehicles}</span>
                    <span className="flex items-center gap-1"><Gauge size={11} /> {z.avg_velocity_kmph} km/h</span>
                    {(z.risk_level === "CRITICAL" || z.risk_level === "HIGH") && (
                      <Button size="sm" variant="ghost" disabled={sending} data-testid={`btn-dispatch-${z.zone_id}`}
                        onClick={(e) => { e.stopPropagation(); dispatch(zones.find((x) => x.id === z.zone_id)); }}
                        className="ml-auto h-6 px-2 text-[11px] text-red-600 hover:bg-red-50 gap-1"><Send size={11} /> Warn</Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}