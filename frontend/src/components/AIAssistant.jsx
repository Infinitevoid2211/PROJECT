import { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API } from "@/lib/api";

const SESSION = "sih-" + Math.random().toString(36).slice(2, 10);
const PROMPTS = [
  "What is the current safety protocol for Hunthar Veng?",
  "Draft an evacuation SMS for Ramhlun North",
  "Explain the rainfall threshold curve",
  "Which zone needs immediate NDRF deployment?",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Namaste. I'm BHU-RAKSHAK AI — your geotechnical risk & disaster-protocol assistant for Aizawl. Ask me about any zone, or tap a prompt below." },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || streaming) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }, { role: "assistant", content: "" }]);
    setStreaming(true);
    try {
      const res = await fetch(`${API}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: SESSION, message: q }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop();
        for (const p of parts) {
          const line = p.replace(/^data:\s*/, "").trim();
          if (!line) continue;
          try {
            const j = JSON.parse(line);
            if (j.delta) {
              setMessages((m) => {
                const c = [...m];
                c[c.length - 1] = { role: "assistant", content: c[c.length - 1].content + j.delta };
                return c;
              });
            }
          } catch (e) {}
        }
      }
    } catch (e) {
      setMessages((m) => {
        const c = [...m];
        c[c.length - 1] = { role: "assistant", content: "Connection error. Please try again." };
        return c;
      });
    } finally { setStreaming(false); }
  };

  return (
    <div data-testid="ai-assistant" className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="grid place-items-center h-8 w-8 rounded-lg bg-[#065F46] text-white"><Bot size={17} /></div>
        <div>
          <p className="font-head font-bold text-sm text-slate-800">AI Risk & Protocol Assistant</p>
          <p className="text-[11px] text-slate-500 font-mono">Claude · Sonnet 4.6</p>
        </div>
        <Sparkles size={15} className="ml-auto text-emerald-500" />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto thin-scroll p-4 space-y-3 min-h-[240px]">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`grid place-items-center h-7 w-7 rounded-lg shrink-0 ${m.role === "user" ? "bg-[#0B3B60] text-white" : "bg-emerald-100 text-emerald-700"}`}>
              {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-[#0B3B60] text-white rounded-tr-sm" : "bg-slate-100 text-slate-800 rounded-tl-sm"}`}>
              {m.content || <span className="inline-flex gap-1"><Dot /><Dot d={0.2} /><Dot d={0.4} /></span>}
            </div>
          </div>
        ))}
      </div>

      <div className="px-3 pt-2 flex gap-2 flex-wrap border-t border-slate-100">
        {PROMPTS.map((p, i) => (
          <button key={i} data-testid={`ai-prompt-${i}`} onClick={() => send(p)} disabled={streaming}
            className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors disabled:opacity-50">
            {p}
          </button>
        ))}
      </div>

      <div className="p-3 flex gap-2">
        <Input data-testid="ai-chat-input" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask about any risk zone or protocol…"
          className="border-slate-200" disabled={streaming} />
        <Button data-testid="ai-chat-send-btn" onClick={() => send()} disabled={streaming} className="bg-[#065F46] hover:bg-emerald-800 text-white px-3">
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}

const Dot = ({ d = 0 }) => (
  <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${d}s` }} />
);
