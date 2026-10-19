import { useState, useEffect } from "react";
import { ShieldAlert, Radio, Clock, Volume2, Languages, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LANGS, t } from "@/lib/i18n";

export default function Header({ lang, setLang, onCheckin, criticalCount }) {
  const [clock, setClock] = useState("");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(d.toLocaleTimeString("en-IN", { hour12: false, timeZone: "Asia/Kolkata" }) + " IST");
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const siren = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sawtooth"; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.1);
      o.frequency.setValueAtTime(620, ctx.currentTime);
      o.frequency.linearRampToValueAtTime(950, ctx.currentTime + 0.6);
      o.frequency.linearRampToValueAtTime(620, ctx.currentTime + 1.2);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.6);
      o.stop(ctx.currentTime + 1.7);
    } catch (e) {}
  };

  return (
    <header data-testid="app-header"
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative grid place-items-center h-10 w-10 rounded-xl bg-[#0B3B60] text-white shrink-0">
          <ShieldAlert size={20} />
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
        </div>
        <div className="min-w-0">
          <h1 className="font-head font-extrabold text-slate-900 text-base sm:text-lg leading-tight tracking-tight truncate">{t("appName", lang)}</h1>
          <p className="text-[11px] sm:text-xs text-slate-500 font-mono truncate">{t("subtitle", lang)}</p>
        </div>
        <span className="hidden md:inline-flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold font-mono uppercase tracking-wider">
          <Radio size={12} className="animate-pulse" /> Live
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {criticalCount > 0 && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-xs font-bold font-mono">
            <span className="relative flex h-2 w-2">
              <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
            </span>
            {criticalCount} CRITICAL
          </span>
        )}
        <span className="hidden lg:inline-flex items-center gap-1.5 text-xs font-mono text-slate-500"><Clock size={14} /> {clock}</span>
        <Button data-testid="btn-siren-test" variant="outline" size="icon" onClick={siren} title="Test siren"
          className="border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200"><Siren size={16} /></Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button data-testid="language-selector" variant="outline" size="sm" className="border-slate-200 text-slate-600 gap-1.5">
              <Languages size={15} />
              <span className="hidden sm:inline text-xs font-semibold">{LANGS.find((l) => l.code === lang)?.label}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {LANGS.map((l) => (
              <DropdownMenuItem key={l.code} data-testid={`lang-${l.code}`} onClick={() => setLang(l.code)}>
                <span className="font-medium">{l.label}</span>
                <span className="ml-2 text-xs text-slate-400">{l.native}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button data-testid="btn-emergency-checkin" onClick={onCheckin} className="bg-[#DC2626] hover:bg-red-700 text-white font-semibold gap-1.5 shadow-sm">
          <Volume2 size={16} />
          <span className="hidden sm:inline">{t("checkin", lang)}</span>
          <span className="sm:hidden">SOS</span>
        </Button>
      </div>
    </header>
  );
}
