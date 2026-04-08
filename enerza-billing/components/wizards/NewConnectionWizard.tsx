"use client";
import React, { useState } from 'react';
import { Check, ChevronRight, User, MapPin, Zap, Settings, Gauge, Flame, Droplets as Droplet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ElectricityTechForm } from './onboarding/ElectricityTechForm';
import { GasTechForm } from './onboarding/GasTechForm';
import { WaterTechForm } from './onboarding/WaterTechForm';

const STEPS = [
  { id: 1, title: "Applicant KYC", icon: User },
  { id: 2, title: "Premise", icon: MapPin },
  { id: 3, title: "Service Selection", icon: Zap },
  { id: 4, title: "Technical Specs", icon: Settings },
  { id: 5, title: "Meter Commissioning", icon: Gauge },
];

export function NewConnectionWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customer: { fullName: "", mobile: "", email: "", customerType: "INDIVIDUAL", segmentId: "cl_dom_01" },
    premise: { addressLine1: "", areaId: "area_hq_01", buildingType: "RESIDENTIAL" },
    service: { utilityType: "ELECTRICITY", cycleId: "monthly_01", segmentId: "cl_dom_01" },
    technical: { 
      loadKw: 5, contractDemandKva: 6, supplyVoltage: "230V", phaseType: "SINGLE", isNetMetered: false,
      serviceType: "DOMESTIC", pressureBandId: "cl_pb_01", pipeSizeMm: 15, meterType: "SMART"
    },
    meter: { serialNo: "", meterType: "SMART", make: "LandisGyr" }
  });

  const updateForm = (section: keyof typeof formData, field: string, value: any) => {
    setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length + 1));
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const submitOnboarding = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to onboard customer");
      
      setCurrentStep(6); // Success screen
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto glass rounded-xl overflow-hidden flex flex-col md:flex-row text-[var(--foreground)]">
      
      {/* Sidebar Progress Tracker */}
      <div className="border-r border-[var(--card-border)] bg-[rgba(255,255,255,0.02)] w-full md:w-64 p-6 shrink-0 hidden md:block">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] mb-6">Onboarding Steps</h3>
        <div className="space-y-4 relative">
            <div className="absolute left-[15px] top-[14px] bottom-10 border-l-2 border-gray-200 z-0"/>
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const complete = currentStep > step.id;
            const active = currentStep === step.id;
            return (
              <div key={step.id} className="flex flex-col relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 bg-[var(--card)] transition-colors
                    ${complete ? "border-[var(--success)] text-[var(--success)]" : active ? "border-[var(--accent)] text-[var(--accent)] shadow-[0_0_12px_var(--accent-glow)]" : "border-[var(--card-border)] text-[var(--muted)]"}`}>
                    {complete ? <Check className="h-4 w-4" strokeWidth={3} /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={`text-sm font-medium ${complete || active ? "text-[var(--foreground)]" : "text-[var(--muted)]"}`}>
                    {step.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-transparent">
        {error && (
            <div className="m-6 mb-0 p-4 bg-[rgba(239,68,68,0.1)] text-[var(--danger)] rounded-md border border-[var(--danger)] text-sm">
                <strong>Error: </strong>{error}
            </div>
        )}

        <div className="p-8 flex-1">
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
               <h2 className="text-2xl font-bold text-[var(--foreground)] border-b border-[var(--card-border)] pb-2">Applicant KYC</h2>
               <div className="grid grid-cols-2 gap-4 mt-6">
                 <div>
                   <label className="block text-sm font-medium text-[var(--muted)] mb-1">Full Name</label>
                   <input type="text" className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--card-border)] text-[var(--foreground)] rounded-md px-3 py-2 outline-none focus:border-[var(--accent)]" value={formData.customer.fullName} onChange={e => updateForm('customer', 'fullName', e.target.value)} placeholder="e.g. Acme Corp" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-[var(--muted)] mb-1">Customer Type</label>
                   <select className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--card-border)] text-[var(--foreground)] rounded-md px-3 py-2 outline-none focus:border-[var(--accent)]" value={formData.customer.customerType} onChange={e => updateForm('customer', 'customerType', e.target.value)}>
                     <option value="INDIVIDUAL">Individual</option>
                     <option value="COMMERCIAL">Commercial / Retail</option>
                     <option value="INDUSTRIAL">Industrial</option>
                     <option value="GOVERNMENT">Government</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-[var(--muted)] mb-1">Mobile</label>
                   <input type="text" className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--card-border)] text-[var(--foreground)] rounded-md px-3 py-2 outline-none focus:border-[var(--accent)]" value={formData.customer.mobile} onChange={e => updateForm('customer', 'mobile', e.target.value)} />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-[var(--muted)] mb-1">Email</label>
                   <input type="email" className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--card-border)] text-[var(--foreground)] rounded-md px-3 py-2 outline-none focus:border-[var(--accent)]" value={formData.customer.email} onChange={e => updateForm('customer', 'email', e.target.value)} />
                 </div>
               </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
               <h2 className="text-2xl font-bold text-[var(--foreground)] border-b border-[var(--card-border)] pb-2">Premise Location</h2>
               <div className="grid grid-cols-1 gap-4 mt-6">
                 <div>
                   <label className="block text-sm font-medium text-[var(--muted)] mb-1">Address Line 1</label>
                   <input type="text" className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--card-border)] text-[var(--foreground)] rounded-md px-3 py-2 outline-none focus:border-[var(--accent)]" value={formData.premise.addressLine1} onChange={e => updateForm('premise', 'addressLine1', e.target.value)} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-[var(--muted)] mb-1">Building Type</label>
                       <select className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--card-border)] text-[var(--foreground)] rounded-md px-3 py-2 outline-none focus:border-[var(--accent)]" value={formData.premise.buildingType} onChange={e => updateForm('premise', 'buildingType', e.target.value)}>
                         <option value="RESIDENTIAL">Multi-Story Residential</option>
                         <option value="COMMERCIAL_MALL">Commercial / Mall</option>
                         <option value="FACTORY">Factory / Plant</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-[var(--muted)] mb-1">Operating Area (CGD/DISCOM Zone)</label>
                       <select className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--card-border)] text-[var(--foreground)] rounded-md px-3 py-2 outline-none focus:border-[var(--accent)]" value={formData.premise.areaId} onChange={e => updateForm('premise', 'areaId', e.target.value)}>
                         <option value="area_hq_01">Central City Zone 1</option>
                         <option value="area_hq_02">North Industrial Hub</option>
                         <option value="area_hq_03">South Suburbs</option>
                       </select>
                     </div>
                 </div>
               </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
               <h2 className="text-2xl font-bold text-[var(--foreground)] border-b border-[var(--card-border)] pb-2">Service Selection</h2>
               <div className="mt-6 flex gap-4">
                   <button className={`flex-1 p-4 rounded-xl border-2 transition ${formData.service.utilityType === "ELECTRICITY" ? "border-[var(--warning)] bg-[rgba(245,158,11,0.05)]" : "border-[var(--card-border)] bg-[rgba(255,255,255,0.02)]"}`} onClick={() => updateForm('service', 'utilityType', "ELECTRICITY")}>
                       <Zap className={`h-8 w-8 mx-auto mb-2 ${formData.service.utilityType === "ELECTRICITY" ? "text-[var(--warning)]" : "text-[var(--muted)]"}`} />
                       <p className={`font-semibold ${formData.service.utilityType === "ELECTRICITY" ? "text-[var(--warning)]" : "text-[var(--muted)]"}`}>Electricity</p>
                   </button>
                   <button className={`flex-1 p-4 rounded-xl border-2 transition ${formData.service.utilityType === "GAS_PNG" ? "border-[var(--accent)] bg-[rgba(6,182,212,0.05)]" : "border-[var(--card-border)] bg-[rgba(255,255,255,0.02)]"}`} onClick={() => updateForm('service', 'utilityType', "GAS_PNG")}>
                       <Flame className={`h-8 w-8 mx-auto mb-2 ${formData.service.utilityType === "GAS_PNG" ? "text-[var(--accent)]" : "text-[var(--muted)]"}`} />
                       <p className={`font-semibold ${formData.service.utilityType === "GAS_PNG" ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>PNG Gas</p>
                   </button>
                   <button className={`flex-1 p-4 rounded-xl border-2 transition ${formData.service.utilityType === "WATER" ? "border-[var(--success)] bg-[rgba(16,185,129,0.05)]" : "border-[var(--card-border)] bg-[rgba(255,255,255,0.02)]"}`} onClick={() => updateForm('service', 'utilityType', "WATER")}>
                       <Droplet className={`h-8 w-8 mx-auto mb-2 ${formData.service.utilityType === "WATER" ? "text-[var(--success)]" : "text-[var(--muted)]"}`} />
                       <p className={`font-semibold ${formData.service.utilityType === "WATER" ? "text-[var(--success)]" : "text-[var(--muted)]"}`}>Water</p>
                   </button>
               </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
               <h2 className="text-2xl font-bold text-[var(--foreground)] border-b border-[var(--card-border)] pb-2 pr-6">
                 Technical Specification: {formData.service.utilityType}
               </h2>
               
               {formData.service.utilityType === "ELECTRICITY" && (
                 <ElectricityTechForm data={formData.technical} updateForm={updateForm} />
               )}
               
               {formData.service.utilityType === "GAS_PNG" && (
                 <GasTechForm data={formData.technical} updateForm={updateForm} />
               )}

               {formData.service.utilityType === "WATER" && (
                 <WaterTechForm data={formData.technical} updateForm={updateForm} />
               )}
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
               <h2 className="text-2xl font-bold text-[var(--foreground)] border-b border-[var(--card-border)] pb-2">Meter Commissioning</h2>
               <div className="grid grid-cols-2 gap-4 mt-6">
                 <div>
                   <label className="block text-sm font-medium text-[var(--muted)] mb-1">Meter Serial Number</label>
                   <input type="text" className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--card-border)] text-[var(--foreground)] rounded-md px-3 py-2 outline-none focus:border-[var(--accent)]" value={formData.meter.serialNo} onChange={e => updateForm('meter', 'serialNo', e.target.value)} placeholder="SRL-9382103" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-[var(--muted)] mb-1">Meter Make</label>
                   <input type="text" className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--card-border)] text-[var(--foreground)] rounded-md px-3 py-2 outline-none focus:border-[var(--accent)]" value={formData.meter.make} onChange={e => updateForm('meter', 'make', e.target.value)} placeholder="LandisGyr" />
                 </div>
               </div>
               <div className="mt-6 p-4 bg-[rgba(6,182,212,0.1)] text-[var(--accent)] rounded-md border border-[rgba(6,182,212,0.2)] flex gap-3 text-sm">
                   <div className="mt-0.5"><Gauge className="h-4 w-4"/></div>
                   <p>A <strong>Meter Reading</strong> record will automatically be initialized at 0 kWh/SCM to establish the commissioning baseline for future billing cyles.</p>
               </div>
            </div>
          )}

          {currentStep === 6 && (
              <div className="py-12 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
                 <div className="h-20 w-20 bg-[rgba(16,185,129,0.1)] rounded-full flex items-center justify-center text-[var(--success)] mb-6">
                     <Check className="h-10 w-10" strokeWidth={3} />
                 </div>
                 <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Connection Active!</h2>
                 <p className="text-[var(--muted)] text-center max-w-sm mb-6">The Customer, Premise, Account, Technical configuration, and initial Meter Baseline have been successfully established.</p>
                 <div className="flex gap-3">
                    <button className="px-4 py-2 border border-[var(--card-border)] rounded-md font-medium text-[var(--foreground)] hover:bg-[rgba(255,255,255,0.05)] transition" onClick={() => router.push('/')}>Go to Dashboard</button>
                    <button className="px-4 py-2 bg-[var(--accent)] text-white rounded-md font-medium hover:bg-[var(--accent-2)] transition" onClick={() => { setCurrentStep(1); setFormData({...formData, meter: { ...formData.meter, serialNo: "" } }); }}>Onboard Another</button>
                 </div>
              </div>
          )}
        </div>

        {/* Footer Actions */}
        {currentStep < 6 && (
          <div className="border-t border-[var(--card-border)] p-4 px-6 bg-[rgba(255,255,255,0.01)] flex items-center justify-between">
            <button 
              className={`px-4 py-2 text-sm font-medium rounded-md text-[var(--muted)] hover:text-[var(--foreground)] transition ${currentStep === 1 ? 'opacity-0 pointer-events-none' : ''}`}
              onClick={handlePrev}
            >
              Back
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[var(--muted)]">Step {currentStep} of {STEPS.length}</span>
              {currentStep < STEPS.length ? (
                <button 
                  className="px-6 py-2 bg-[var(--accent)] text-white text-sm font-medium rounded-md hover:bg-[var(--accent-2)] transition flex items-center gap-1 shadow-[0_0_12px_var(--accent-glow)]"
                  onClick={handleNext}
                  disabled={currentStep === 1 && !formData.customer.fullName}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button 
                  className="px-6 py-2 bg-[var(--success)] text-white text-sm font-medium rounded-md hover:opacity-90 transition flex items-center gap-2"
                  onClick={submitOnboarding}
                  disabled={isSubmitting || !formData.meter.serialNo}
                >
                  {isSubmitting ? "Processing..." : "Complete Activation"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
