"use client";
import { useEffect, useState } from "react";
import { Package, AlertTriangle, CheckCircle, BarChart3, Search } from "lucide-react";

export default function InventoryPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/field/inventory")
      .then(res => res.json())
      .then(d => {
        const arr = Array.isArray(d.data) ? d.data : [];
        setData(arr);
        setLoading(false);
      })
      .catch(() => {
        setData([]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter">Utility Inventory & Spares</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
             <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--accent)" }} />
             <p style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>{(Array.isArray(data) ? data.length : 0).toLocaleString()} REGISTERED ENTITIES</p>
          </div>
        </div>
        <div className="flex gap-3">
           <button className="px-5 py-2.5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/5 transition-all">
              Stock Audit
           </button>
           <button className="px-6 py-2.5 bg-accent text-accent-foreground rounded-xl text-sm font-extrabold shadow-xl shadow-accent/20 hover:scale-[1.02] transition-all">
              Procure Spares
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="glass p-5 space-y-2 border-l-4 border-l-accent">
            <div className="text-[10px] text-muted uppercase font-bold tracking-widest">Total SKU Stock</div>
            <div className="text-2xl font-bold">₹ 14,25,000</div>
            <div className="flex items-center gap-1 text-[10px] text-green-400">
               <CheckCircle size={10} /> Value stable
            </div>
         </div>
         <div className="glass p-5 space-y-2 border-l-4 border-l-red-500">
            <div className="text-[10px] text-muted uppercase font-bold tracking-widest">Critical Shortage</div>
            <div className="text-2xl font-bold">3 Items</div>
            <div className="flex items-center gap-1 text-[10px] text-red-400">
               <AlertTriangle size={10} /> Reorder immediately
            </div>
         </div>
         <div className="glass p-5 space-y-2 border-l-4 border-l-green-500">
            <div className="text-[10px] text-muted uppercase font-bold tracking-widest">Active Dispatch</div>
            <div className="text-2xl font-bold text-green-400">8 Units</div>
            <div className="flex items-center gap-1 text-[10px] text-muted">
               <BarChart3 size={10} /> On technician vehicles
            </div>
         </div>
      </div>

      <div className="glass overflow-hidden shadow-2xl shadow-black/40">
        <div className="p-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
           <div className="relative w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={14} />
              <input className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:border-accent transition-all" placeholder="Search inventory SKU..." />
           </div>
        </div>
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 uppercase text-[10px] tracking-[0.2em] text-muted font-black">
              <th className="p-6">Item & SKU</th>
              <th className="p-6">Category</th>
              <th className="p-6 text-right">Stock Qty</th>
              <th className="p-6">Unit Cost</th>
              <th className="p-6 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-10 text-center text-muted animate-pulse italic">Scanning warehouse assets...</td></tr>
            ) : data.map((item) => (
              <tr key={item.itemId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent-glow flex items-center justify-center text-accent">
                      <Package size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-sm tracking-tight">{item.itemName}</div>
                      <div className="text-[10px] text-muted">{item.itemId}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-full border border-white/5 font-bold uppercase">{item.category}</span>
                </td>
                <td className="p-4 text-right font-mono font-bold">{item.stockQty} <span className="text-[10px] text-muted">{item.uom}</span></td>
                <td className="p-4 text-xs font-bold">₹ {item.unitCost.toFixed(2)}</td>
                <td className="p-4 text-right">
                   <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.stockQty > 50 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500 animate-pulse"}`}>
                      {item.stockQty > 50 ? "IN STOCK" : "LOW STOCK"}
                   </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


