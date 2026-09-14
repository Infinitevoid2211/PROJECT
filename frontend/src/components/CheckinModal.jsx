import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, AlertOctagon } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { t } from "@/lib/i18n";

export default function CheckinModal({ open, onOpenChange, zones, lang, onDone }) {
  const [name, setName] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (status) => {
    if (!name.trim() || !zoneId) { toast.error("Enter your name and select your zone"); return; }
    setBusy(true);
    let coords = {};
    try {
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 }));
      coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch (e) { coords = {}; }
    try {
      await api.createCheckin({ name: name.trim(), zone_id: zoneId, status, note, ...coords });
      toast.success(status === "SAFE" ? "Check-in recorded: marked SAFE" : "Evacuation request sent to SDRF");
      setName(""); setNote(""); setZoneId(""); onOpenChange(false); onDone && onDone();
    } catch (e) { toast.error("Failed to submit check-in"); } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="checkin-modal" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-head text-xl">{t("checkin", lang)}</DialogTitle>
          <DialogDescription>Your GPS location is logged to the district safety register. Responders see your status live.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs font-semibold">Full name</Label>
            <Input data-testid="checkin-name-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lalremruata" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Your zone</Label>
            <Select value={zoneId} onValueChange={setZoneId}>
              <SelectTrigger data-testid="checkin-zone-select" className="mt-1"><SelectValue placeholder="Select zone" /></SelectTrigger>
              <SelectContent>{zones.map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold">Note (optional)</Label>
            <Textarea data-testid="checkin-note-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. trapped near NH-54 with 3 others" className="mt-1 resize-none" rows={2} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button data-testid="checkin-safe-btn" disabled={busy} onClick={() => submit("SAFE")} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <ShieldCheck size={18} /> {t("imSafe", lang)}
          </Button>
          <Button data-testid="checkin-evac-btn" disabled={busy} onClick={() => submit("NEED_EVACUATION")} className="bg-[#DC2626] hover:bg-red-700 text-white gap-2">
            <AlertOctagon size={18} /> {t("needEvac", lang)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
