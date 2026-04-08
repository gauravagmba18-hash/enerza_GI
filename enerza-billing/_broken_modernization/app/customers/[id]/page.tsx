"use client";
import { useEffect, useState, use } from "react";
import { Zap, CreditCard, ClipboardList, Activity, User, MapPin, Phone, Mail, Award, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface CustomerData {
  customerId: string;
  fullName: string;
  customerType: string;
  status: string;
  mobile: string;
  email: string;
  segment: { segmentName: string; utilityType: string };
  accounts: any[];
}

export default function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetch(`/api/customers/${resolvedParams.id}`)
      .then(res => res.json())
      .then(data => {
        setCustomer(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [resolvedParams.id]);

  if (loading) return <div className="p-8 animate-pulse text-muted">Loading Customer 360...</div>;
  if (!customer) return <div className="p-8 text-red-500">Customer not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/data/customers">
          <button className="p-2 hover:bg-white/5 rounded-lg border border-white/10 text-muted">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{customer.fullName}</h1>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="px-2 py-0.5 bg-accent-glow text-accent rounded-full border border-accent/20">
              {customer.customerId}
            </span>
            <span>•</span>
            <span className="capitalize">{customer.customerType}</span>
            <span>•</span>
            <span className={customer.status === "ACTIVE" ? "text-green-400" : "text-yellow-400"}>
              {customer.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-6 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <div className="w-12 h-12 rounded-xl bg-accent-glow flex items-center justify-center text-accent">
                <User size={24} />
              </div>
              <div>
                <div className="text-sm font-semibold">Profile Details</div>
                <div className="text-xs text-muted">Core identification</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Phone size={14} className="text-muted" />
                <span>{customer.mobile}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail size={14} className="text-muted" />
                <span>{customer.email || "No email"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Award size={14} className="text-muted" />
                <span>{customer.segment.segmentName} ({customer.segment.utilityType})</span>
              </div>
            </div>
          </div>

          <div className="glass p-6 space-y-4">
            <div className="text-sm font-semibold pb-2 border-b border-white/5">Account Summary</div>
            <div className="space-y-4">
              {customer.accounts?.map((acc: any) => (
                <div key={acc.accountId} className="p-3 bg-white/5 rounded-lg border border-white/5 hover:border-accent/20 transition-all group">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-accent">{acc.accountId}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded uppercase text-muted">
                      {acc.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted truncate mb-3">{acc.premise.addressLine1}</div>
                  <div className="flex gap-2">
                    <button className="flex-1 text-[10px] py-1 bg-accent/10 border border-accent/20 text-accent rounded hover:bg-accent/20 transition-colors font-bold">
                      View Details
                    </button>
                    {acc.status === "ACTIVE" && (
                      <button className="flex-1 text-[10px] py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded hover:bg-red-500/20 transition-colors font-bold">
                        Move Out
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {customer.accounts?.length === 0 && (
                <div className="text-xs text-center text-muted py-4">No linked accounts.</div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Hub */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit">
            {[
              { id: "overview", label: "Financials", icon: CreditCard },
              { id: "service", label: "Field Service", icon: ClipboardList },
              { id: "usage", label: "Utility Connections", icon: Zap },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20" : "text-muted hover:bg-white/5"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="glass p-8 min-h-[400px]">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-xs text-muted mb-1">Outstanding Balance</div>
                    <div className="text-2xl font-bold text-red-400">₹ 14,250.00</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-xs text-muted mb-1">Last Payment</div>
                    <div className="text-xl font-bold">₹ 5,000.00</div>
                  </div>
                </div>
                
                <div className="text-sm font-semibold">Recent Bills</div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="pb-3 text-muted">Bill ID</th>
                          <th className="pb-3 text-muted">Date</th>
                          <th className="pb-3 text-muted text-right">Amount</th>
                          <th className="pb-3 text-muted text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 font-medium">BILL-2024-001</td>
                          <td className="py-3">Oct 12, 2024</td>
                          <td className="py-3 text-right font-bold">₹ 4,500.00</td>
                          <td className="py-3 text-center"><span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded">PAID</span></td>
                        </tr>
                        <tr className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 font-medium">BILL-2024-002</td>
                          <td className="py-3">Nov 12, 2024</td>
                          <td className="py-3 text-right font-bold">₹ 9,750.00</td>
                          <td className="py-3 text-center"><span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded">OVERDUE</span></td>
                        </tr>
                      </tbody>
                    </table>
                </div>
              </div>
            )}

            {activeTab === "service" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-semibold">Service Tickets & Work Orders</div>
                  <button className="text-xs py-1.5 px-3 bg-accent text-accent-foreground rounded-lg font-bold">New Ticket</button>
                </div>
                
                <div className="space-y-4">
                  {(customer.accounts || []).flatMap((acc: any) => acc.serviceTickets || []).map((t: any) => (
                    <div key={t.ticketId} className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{t.ticketId}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${t.status === 'OPEN' ? 'bg-accent-glow text-accent' : 'bg-green-500/10 text-green-500'}`}>
                            {t.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted">{new Date(t.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-sm font-medium">{t.category}</div>
                      <div className="text-xs text-muted">{t.description}</div>
                      {t.workOrders?.length > 0 && (
                        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[10px] text-muted">
                            <User size={10} />
                            <span>Assigned to: <strong>{t.workOrders[0].technician?.fullName || "Field Team"}</strong></span>
                          </div>
                          <button className="text-[10px] text-accent hover:underline">View Visit Details ➔</button>
                        </div>
                      )}
                    </div>
                  ))}
                  {(customer.accounts || []).every((acc: any) => (acc.serviceTickets || []).length === 0) && (
                    <div className="text-sm text-center text-muted py-10">No service tickets for this customer.</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "usage" && (
              <div className="space-y-6">
                <div className="text-sm font-semibold">Service Connections</div>
                {customer.accounts?.map((acc: any) => (
                  <div key={acc.accountId} className="space-y-4">
                     <div className="text-xs font-bold text-muted flex items-center gap-2">
                        <MapPin size={12} /> {acc.premise.addressLine1}
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {acc.serviceConnections?.map((conn: any) => (
                         <div key={conn.connectionId} className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Zap size={14} className="text-accent" />
                                <span className="text-sm font-bold truncate">{conn.podId || conn.connectionId}</span>
                              </div>
                              <span className="text-[10px] text-accent font-bold uppercase">{conn.utilityType}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-muted">Start Date:</span>
                              <span>{new Date(conn.startDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-muted">Meter Status:</span>
                              <span className="text-green-400">OPERATIONAL</span>
                            </div>
                         </div>
                       ))}
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
