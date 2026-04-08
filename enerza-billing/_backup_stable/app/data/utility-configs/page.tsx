"use client";
import { useEffect, useState } from "react";
import { Settings, Save, AlertCircle, CheckCircle, RefreshCcw } from "lucide-react";

export default function UtilityConfigsPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/field/utility-configs")
      .then(res => res.json())
      .then(d => {
        setConfig(Array.isArray(d) ? d[0] : d);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/field/utility-configs", {
        method: "POST",
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setMessage("Configuration updated successfully!");
        setTimeout(() => setMessage(""), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse italic text-muted">Synchronizing with system core...</div>;

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Industrial Utility Configuration</h1>
          <p className="text-sm text-muted">Global settings for billing thresholds, proration logic, and commercial rules.</p>
        </div>
        <button 
           onClick={handleSave} 
           disabled={saving}
           className="flex items-center gap-2 px-6 py-2.5 bg-accent text-accent-foreground rounded-xl text-sm font-bold shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all disabled:opacity-50"
        >
          {saving ? <RefreshCcw className="animate-spin" size={16} /> : <Save size={16} />} 
          {saving ? "Saving..." : "Apply Changes"}
        </button>
      </div>

      {message && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-2">
           <CheckCircle size={18} /> {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Billing Controls */}
        <div className="glass p-6 space-y-6 border-t-4 border-t-accent">
           <div className="flex items-center gap-2 text-sm font-extrabold text-accent border-b border-white/5 pb-2">
              <Settings size={16} /> Advanced Billing Rules
           </div>
           
           <div className="space-y-4">
              <div className="space-y-2">
                 <label className="text-xs font-bold text-muted uppercase tracking-wider">Minimum Monthly Billing (₹)</label>
                 <input 
                    type="number"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-accent"
                    value={config?.minBillAmount || 0}
                    onChange={(e) => setConfig({ ...config, minBillAmount: parseFloat(e.target.value) })}
                 />
                 <p className="text-[10px] text-muted leading-relaxed">System will automatically inject a MIN_ADJUST charge if totals fall below this floor.</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                 <div>
                    <div className="text-xs font-bold">Prorate Fixed Charges</div>
                    <div className="text-[10px] text-muted">Scale fixed components for short billing cycles.</div>
                 </div>
                 <button 
                    onClick={() => setConfig({...config, prorateFixed: !config.prorateFixed})}
                    className={`w-12 h-6 rounded-full transition-all relative ${config?.prorateFixed ? "bg-accent" : "bg-white/10"}`}
                 >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config?.prorateFixed ? "left-7 shadow-lg" : "left-1"}`} />
                 </button>
              </div>
           </div>
        </div>

        {/* Commercial Lifecycle */}
        <div className="glass p-6 space-y-6 border-t-4 border-t-cyan-400">
           <div className="flex items-center gap-2 text-sm font-extrabold text-cyan-400 border-b border-white/5 pb-2">
              <AlertCircle size={16} /> Commercial Operations
           </div>

           <div className="space-y-4">
              <div className="space-y-2">
                 <label className="text-xs font-bold text-muted uppercase tracking-wider">Move-Out Billing Mode</label>
                 <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400"
                    value={config?.moveOutBilling || "IMMEDIATE"}
                    onChange={(e) => setConfig({ ...config, moveOutBilling: e.target.value })}
                 >
                    <option value="IMMEDIATE" className="bg-slate-900">IMMEDIATE (Prorated Bill on Close)</option>
                    <option value="CYCLE" className="bg-slate-900">CYCLE (Include in Next Routine Bill)</option>
                 </select>
              </div>

              <div className="p-4 bg-cyan-400/5 rounded-xl border border-cyan-400/10 text-[10px] text-cyan-400 font-medium">
                 Changes to commercial rules affect all new industrial contracts and move-out workflows immediately.
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
