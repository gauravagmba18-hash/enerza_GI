"use client";
import { useEffect, useState } from "react";
import { Users, Phone, MapPin, Mail, Search } from "lucide-react";

export default function TechniciansPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/field/technicians")
      .then(res => res.json())
      .then(d => {
        // Correctly handling { success: true, data: [] } structure
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
          <h1 className="text-3xl font-extrabold tracking-tighter">Utility Field Technicians</h1>
          <div className="flex items-center gap-2 mt-2">
             <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
             <p className="text-[10px] text-muted tracking-[0.2em] uppercase font-bold">Field Operations Registry</p>
          </div>
        </div>
        <button className="px-6 py-2.5 bg-accent text-accent-foreground rounded-xl text-sm font-extrabold shadow-xl shadow-accent/20 hover:scale-[1.02] transition-all">
          Onboard Technician
        </button>
      </div>

      <div className="glass overflow-hidden shadow-2xl shadow-black/40">
        <div className="p-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
           <div className="relative w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={14} />
              <input className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:border-accent transition-all" placeholder="Filter technician registry..." />
           </div>
        </div>
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 uppercase text-[10px] tracking-[0.2em] text-muted font-black">
              <th className="p-6">Name & ID</th>
              <th className="p-6">Contact</th>
              <th className="p-6">Scope (Pincodes)</th>
              <th className="p-6">Status</th>
              <th className="p-6 text-right">Controls</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-10 text-center text-muted animate-pulse italic">Retrieving technician registry...</td></tr>
            ) : data.map((t) => (
              <tr key={t.technicianId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
                      <Users size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-sm">{t.fullName}</div>
                      <div className="text-[10px] text-muted">{t.technicianId}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1 text-xs">
                    <div className="flex items-center gap-2"><Phone size={10} /> {t.mobile}</div>
                    <div className="flex items-center gap-2 text-muted"><Mail size={10} /> tech@{t.technicianId.toLowerCase()}.en</div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-xs">
                    <MapPin size={12} className="text-accent" />
                    <span>{t.pincodeScope}</span>
                  </div>
                </td>
                <td className="p-4">
                   <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded text-[10px] font-bold">AVAILABLE</span>
                </td>
                <td className="p-4 text-right">
                  <button className="text-xs text-accent hover:underline font-bold">Schedule ➔</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


