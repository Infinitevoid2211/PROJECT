import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { riskOf } from "@/lib/constants";
import { Camera, CheckCircle2, Upload, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function ReportTab({ zones }) {
  const [reports, setReports] = useState([]);
  const [reporter, setReporter] = useState("");
  const [zoneId, setZoneId] = useState(zones[0]?.id || "");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const loadReports = () => {
    api.reports().then(setReports).catch(() => setReports([]));
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setPhoto(reader.result);
      setPhotoPreview(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reporter.trim() || !zoneId || !description.trim()) {
      toast.error("Please fill in reporter name, zone, and description");
      return;
    }

    setSubmitting(true);

    let coords = {};

    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, {
          timeout: 3000,
        })
      );

      coords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };
    } catch {
      const z = zones.find((item) => item.id === zoneId);

      coords = {
        lat: z?.lat,
        lng: z?.lng,
      };
    }

    try {
      const rep = await api.createReport({
        reporter: reporter.trim(),
        zone_id: zoneId,
        description: description.trim(),
        photo: photo || null,
        ...coords,
      });

      setLastResult(rep);

      toast.success(
        `Crack analysed: ${rep.severity} severity (${rep.crack_width_mm}mm)`
      );

      setDescription("");
      setPhoto(null);
      setPhotoPreview(null);

      loadReports();
    } catch {
      toast.error("Failed to submit citizen report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-5">
      {/* Submission Form (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-[#7C3AED]/10 text-[#7C3AED]">
              <Camera size={18} />
            </div>

            <div>
              <h2 className="font-head font-bold text-slate-800 text-base">
                Submit Slope Fissure Report
              </h2>

              <p className="text-xs text-slate-500 font-mono">
                Simulated Computer Vision Crack Severity
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <Label className="text-xs font-semibold">
                Observer / Reporter Name
              </Label>

              <Input
                value={reporter}
                onChange={(e) => setReporter(e.target.value)}
                placeholder="e.g. Inspector Lalmuanpuia"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">
                Location / Zone
              </Label>

              <Select value={zoneId} onValueChange={setZoneId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>

                <SelectContent>
                  {zones.map((z) => (
                    <SelectItem key={z.id} value={z.id}>
                      {z.name} ({z.risk_level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold">
                Observation Description
              </Label>

              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe crack length, depth, water seepage, road displacement, or foundation movement…"
                className="mt-1 resize-none"
                rows={3}
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">
                Attach Photograph (Optional)
              </Label>

              <div className="mt-1 flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors">
                  <Upload size={14} />

                  <span>Choose file…</span>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                {photoPreview && (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="h-10 w-10 object-cover rounded-lg border border-slate-200"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setPhoto(null);
                        setPhotoPreview(null);
                      }}
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#7C3AED] hover:bg-purple-800 text-white font-semibold gap-2 shadow-sm"
            >
              <Sparkles size={16} />

              {submitting
                ? "Analyzing Surface Geometrics…"
                : "Submit & Run AI Analysis"}
            </Button>
          </form>
        </div>

        {/* Latest Analysis Card */}
        {lastResult && (
          <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 fade-up">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-purple-600" />
              AI Diagnostic Result
            </p>

            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div className="bg-white rounded-lg p-2 border border-purple-100 shadow-sm">
                <p className="text-[10px] uppercase text-slate-400 font-semibold">
                  Severity
                </p>

                <p
                  className="font-mono font-bold text-sm"
                  style={{
                    color: riskOf(lastResult.severity).color,
                  }}
                >
                  {lastResult.severity}
                </p>
              </div>

              <div className="bg-white rounded-lg p-2 border border-purple-100 shadow-sm">
                <p className="text-[10px] uppercase text-slate-400 font-semibold">
                  Crack Width
                </p>

                <p className="font-mono font-bold text-sm text-slate-800">
                  {lastResult.crack_width_mm} mm
                </p>
              </div>

              <div className="bg-white rounded-lg p-2 border border-purple-100 shadow-sm">
                <p className="text-[10px] uppercase text-slate-400 font-semibold">
                  Confidence
                </p>

                <p className="font-mono font-bold text-sm text-emerald-700">
                  {lastResult.confidence}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reports Feed (7 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-head font-bold text-slate-800 text-base">
                Verified Field Reports ({reports.length})
              </h3>

              <p className="text-xs text-slate-500 font-mono">
                Geotagged crowdsourced landslide precursor telemetry
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadReports}
              className="text-xs"
            >
              Refresh
            </Button>
          </div>

          <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto thin-scroll">
            {reports.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm font-mono">
                No citizen reports logged yet. Submit the first observation
                above!
              </div>
            ) : (
              reports.map((r) => {
                const zone = zones.find((z) => z.id === r.zone_id);
                const sevRisk = riskOf(r.severity);

                return (
                  <div
                    key={r.id}
                    className="p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-slate-900">
                            {r.reporter}
                          </p>

                          <span
                            className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded"
                            style={{
                              background: sevRisk.bg,
                              color: sevRisk.color,
                            }}
                          >
                            {r.severity}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin
                            size={12}
                            className="text-slate-400"
                          />

                          <span>{zone?.name || r.zone_id}</span>

                          <span className="font-mono text-[11px] text-slate-400 ml-1">
                            ·{" "}
                            {new Date(r.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono text-xs font-semibold text-slate-700">
                          {r.crack_width_mm} mm
                        </span>

                        <p className="text-[10px] font-mono text-slate-400">
                          {r.confidence}% conf.
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {r.description}
                    </p>

                    {r.photo && (
                      <div className="mt-2">
                        <img
                          src={r.photo}
                          alt="Report"
                          className="h-20 w-32 object-cover rounded-lg border border-slate-200"
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}