"use client";
import { useEffect, useState } from "react";
import { ClipboardList, User, Package, Wrench, AlertTriangle, CheckCircle, Clock, MoreHorizontal, Filter, Search, X } from "lucide-react";

interface ServiceTicket {
  ticketId: string;
  accountId: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  createdAt: string;
  workOrders: any[];
}

interface Tech {
  technicianId: string;
  fullName: string;
}

export default function FieldServiceDispatchPage() {
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [techs, setTechs] = useState<Tech[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const [selectedTech, setSelectedTech] = useState("");
  const [dispatching, setDispatching] = useState(false);

  const loadData = () => {
    setLoading(true);
    const p1 = fetch("/api/field/tickets").then(res => res.json());
    const p2 = fetch("/api/field/technicians").then(res => res.json());
    Promise.all([p1, p2]).then(([tRes, techRes]) => {
      // Reverting to handle original structure { success: true, data: [] }
      const ticketsArr = Array.isArray(tRes.data) ? tRes.data : [];
      const techsArr = Array.isArray(techRes.data) ? techRes.data : [];
      setTickets(ticketsArr);
      setTechs(techsArr);
      setLoading(false);
    }).catch(() => {
      setTickets([]);
      setTechs([]);
      setLoading(false);
    });
  };



  useEffect(() => {
    loadData();
  }, []);

  const handleDispatch = async () => {
    if (!selectedTicket || !selectedTech) return;
    setDispatching(true);
    try {
      const res = await fetch("/api/field/work-orders", {
        method: "POST",
        body: JSON.stringify({
          ticketId: selectedTicket.ticketId,
          technicianId: selectedTech,
          scheduledDate: new Date().toISOString(),
          notes: "Dispatched from dashboard"
        })
      });
      if (res.ok) {
        setSelectedTicket(null);
        setSelectedTech("");
        loadData();
      }
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Dispatch Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass max-w-md w-full p-6 space-y-6 shadow-2xl relative border-accent/20">
            <button onClick={() => setSelectedTicket(null)} className="absolute top-4 right-4 text-muted hover:text-white">
              <X size={20} />
            </button>
            <div className="space-y-2">
              <h2 className="text-lg font-bold">Dispatch Work Order</h2>
              <p className="text-xs text-muted">Assigning technician for <strong>{selectedTicket.ticketId}</strong></p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted uppercase">Select Technician</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent"
                  value={selectedTech}
                  onChange={(e) => setSelectedTech(e.target.value)}
                >
                  <option value="" className="bg-slate-900">Choose Technician...</option>
                  {techs.map(t => (
                    <option key={t.technicianId} value={t.technicianId} className="bg-slate-900">{t.fullName}</option>
                  ))}
                </select>
              </div>

              <button 
                disabled={!selectedTech || dispatching}
                onClick={handleDispatch}
                className="w-full py-3 bg-accent text-accent-foreground rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-accent/20 disabled:opacity-50"
              >
                {dispatching ? "Creating Order..." : "Confirm Dispatch"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Industrial Field Service Dispatch</h1>
          <p className="text-xs text-muted">Manage service tickets, technicians, and inventory.</p>
        </div>
        <div className="flex gap-4">
           <div className="text-center px-4 border-r border-white/10">
              <div className="text-lg font-bold text-accent">{tickets.filter(t => t.status === "OPEN").length}</div>
              <div className="text-[10px] text-muted">PENDING</div>
           </div>
           <div className="text-center px-4 border-r border-white/10">
              <div className="text-lg font-bold text-yellow-400">{tickets.filter(t => t.status === "ASSIGNED").length}</div>
              <div className="text-[10px] text-muted">ON VISIT</div>
           </div>
           <div className="text-center px-4">
              <div className="text-lg font-bold text-green-400">{tickets.filter(t => t.status === "RESOLVED").length}</div>
              <div className="text-[10px] text-muted">RESOLVED</div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-4">
           <div className="glass p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold border-b border-white/5 pb-2">
                 <Filter size={14} /> Quick Filters
              </div>
              <div className="space-y-2">
                 {["High Priority", "Unassigned", "Delayed", "Inventory Lack"].map((f) => (
                   <button key={f} className="w-full text-left text-xs p-2 hover:bg-white/5 rounded-lg border border-white/5">
                      {f}
                   </button>
                 ))}
              </div>
           </div>

           <div className="glass p-4 space-y-4 bg-accent/5 border-accent/20">
              <div className="flex items-center gap-2 text-sm font-semibold text-accent border-b border-white/5 pb-2">
                 <Package size={14} /> Critical Spares
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between items-center text-[10px]">
                    <span className="text-muted">Electric Meter (M6)</span>
                    <span className="font-bold text-red-400">Low Stock</span>
                 </div>
                 <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <div className="bg-red-400 h-full w-[10%]"></div>
                 </div>
              </div>
           </div>
        </div>

        {/* Tickets Hub */}
        <div className="lg:col-span-3 space-y-4">
           <div className="flex gap-2 items-center mb-2">
              <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
                 <input className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-accent/50" placeholder="Search by Ticket ID or Account" />
              </div>
              <button className="px-4 py-2 bg-accent text-accent-foreground rounded-xl text-sm font-bold shadow-lg shadow-accent/20">
                 Create Quick Ticket
              </button>
           </div>

           <div className="space-y-4">
              {loading ? (
                <div className="p-8 text-center text-muted text-sm animate-pulse">Syncing Field Database...</div>
              ) : (
                tickets.length === 0 ? (
                  <div className="p-8 glass text-center text-muted text-sm">No active tickets found.</div>
                ) : (
                  tickets.map((t) => (
                    <div key={t.ticketId} className="glass p-5 hover:border-accent/30 transition-all group relative overflow-hidden">
                      <div className="flex justify-between items-start mb-3 relative z-10">
                        <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-lg ${t.priority === "HIGH" ? "bg-red-500/10 text-red-500" : "bg-accent/10 text-accent"}`}>
                              <AlertTriangle size={18} />
                           </div>
                           <div>
                              <div className="text-sm font-extrabold group-hover:text-accent transition-colors">{t.ticketId}</div>
                              <div className="text-[10px] text-muted uppercase font-bold tracking-widest">{t.category} • ACCT: {t.accountId}</div>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${t.status === "OPEN" ? "bg-accent-glow text-accent" : (t.status === "ASSIGNED" ? "bg-yellow-400/10 text-yellow-400" : "bg-green-500/10 text-green-400")}`}>
                              {t.status}
                           </span>
                           <button className="text-muted hover:text-white transition-colors">
                              <MoreHorizontal size={16} />
                           </button>
                        </div>
                      </div>

                      <div className="text-xs text-muted mb-4 line-clamp-2 relative z-10">{t.description}</div>

                      <div className="pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
                         <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-[10px] text-muted bg-white/5 px-2 py-1 rounded">
                               <Clock size={12} /> {new Date(t.createdAt).toLocaleDateString()}
                            </div>
                            {t.workOrders?.length > 0 ? (
                               <div className="flex items-center gap-2 text-[10px] text-green-400 font-bold">
                                  <User size={12} /> {t.workOrders[0].technician?.fullName || "Assigned"}
                               </div>
                            ) : (
                               <div className="flex items-center gap-2 text-[10px] text-yellow-400 font-extrabold animate-pulse">
                                  <Wrench size={12} /> UNASSIGNED
                               </div>
                            )}
                         </div>
                         <div className="flex gap-2">
                            <button className="text-[10px] py-1.5 px-3 border border-white/10 rounded-lg hover:bg-white/5 transition-colors font-bold uppercase">
                               Track
                            </button>
                            {t.status === "OPEN" && (
                              <button 
                                onClick={() => setSelectedTicket(t)}
                                className="text-[10px] py-1.5 px-3 bg-accent text-accent-foreground rounded-lg font-bold uppercase shadow-lg shadow-accent/10"
                              >
                                Dispatch
                              </button>
                            )}
                         </div>
                      </div>
                      
                      {/* Decorative Accent for High Priority */}
                      {t.priority === "HIGH" && (
                         <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-3xl -z-0"></div>
                      )}
                    </div>
                  ))
                )
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
