"use client";
import { useEffect, useState } from "react";
import { Wrench, CheckCircle, Package, MapPin, Phone, AlertCircle, ArrowLeft, ClipboardList } from "lucide-react";
import Link from "next/link";

interface WorkOrder {
  workOrderId: string;
  ticketId: string;
  status: string;
  inspectionNotes: string;
  photos: string | null;
  ticket: {
    accountId: string;
    description: string;
    account: {
        customer: { fullName: string; mobile: string };
        premise: { addressLine1: string };
    }
  };
}

export default function TechnicianMobilePage() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/field/work-orders")
      .then(res => res.json())
      .then(d => {
        // Reverting to handle original structure { success: true, data: [] }
        const array = d.data;
        setOrders(Array.isArray(array) ? array : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);



  const handleComplete = async (workOrderId: string) => {
    setCompleting(workOrderId);
    try {
      // Simulate completion with spare consumption
      const res = await fetch(`/api/field/work-orders/${workOrderId}/complete`, { method: "POST" });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.workOrderId === workOrderId ? { ...o, status: "COMPLETED" } : o));
      }
    } finally {
      setCompleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/field">
          <button className="p-2 bg-white/5 rounded-full"><ArrowLeft size={18} /></button>
        </Link>
        <h1 className="text-lg font-bold">My Field Visits</h1>
      </div>

      <div className="space-y-4">
        {loading ? (
            <div className="text-center py-20 text-muted">Loading assignments...</div>
        ) : (
            orders.filter(o => o.status !== "COMPLETED").map(order => (
                <div key={order.workOrderId} className="glass p-5 space-y-4 border-l-4 border-l-accent">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-[10px] text-accent font-bold uppercase tracking-widest">{order.ticketId}</div>
                            <div className="text-sm font-bold">{order.ticket.account.customer.fullName}</div>
                        </div>
                        <div className="p-2 bg-accent/10 text-accent rounded-lg">
                            <Wrench size={18} />
                        </div>
                    </div>

                    <div className="space-y-2 text-xs text-muted">
                        <div className="flex items-center gap-2">
                           <MapPin size={12} /> {order.ticket.account.premise.addressLine1}
                        </div>
                        <div className="flex items-center gap-2">
                           <Phone size={12} /> {order.ticket.account.customer.mobile}
                        </div>
                    </div>

                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                        <div className="text-[10px] text-muted uppercase mb-1">Issue Description</div>
                        <div className="text-xs">{order.ticket.description}</div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                            <Package size={14} /> View Spares
                        </button>
                        <button 
                            disabled={completing === order.workOrderId}
                            onClick={() => handleComplete(order.workOrderId)}
                            className="flex-1 py-3 bg-green-500 text-black rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={14} /> {completing === order.workOrderId ? "Done..." : "Complete Visit"}
                        </button>
                    </div>
                </div>
            ))
        )}

        {orders.filter(o => o.status !== "COMPLETED").length === 0 && !loading && (
            <div className="text-center py-20">
                <CheckCircle size={48} className="mx-auto text-green-500/20 mb-4" />
                <div className="text-sm font-bold text-muted">No pending visits. Ready for dispatch!</div>
            </div>
        )}
      </div>

      {/* Quick Nav Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900 border-t border-white/5 flex justify-around items-center">
         <div className="flex flex-col items-center gap-1 text-accent">
            <ClipboardList size={20} />
            <span className="text-[10px] font-bold">Visits</span>
         </div>
         <div className="flex flex-col items-center gap-1 text-muted">
            <Package size={20} />
            <span className="text-[10px] font-bold">Inventory</span>
         </div>
         <div className="flex flex-col items-center gap-1 text-muted">
            <AlertCircle size={20} />
            <span className="text-[10px] font-bold">Alarms</span>
         </div>
      </div>
    </div>
  );
}
