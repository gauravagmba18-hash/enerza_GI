"use client";
import React from 'react';

interface Props {
  data: any;
  updateForm: (section: 'customer' | 'premise' | 'service' | 'technical' | 'meter', field: string, value: any) => void;
}

export function ElectricityTechForm({ data, updateForm }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 mt-6 animate-in fade-in duration-300">
      <div>
        <label className="block text-sm font-medium text-[var(--muted)] mb-1">Contract Demand (kVA)</label>
        <input 
          type="number" 
          className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--card-border)] text-[var(--foreground)] rounded-md px-3 py-2 outline-none focus:border-[var(--accent)]" 
          value={data.contractDemandKva || ""} 
          onChange={e => updateForm('technical', 'contractDemandKva', Number(e.target.value))} 
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--muted)] mb-1">Sanctioned Load (kW)</label>
        <input 
          type="number" 
          className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--card-border)] text-[var(--foreground)] rounded-md px-3 py-2 outline-none focus:border-[var(--accent)]" 
          value={data.loadKw || ""} 
          onChange={e => updateForm('technical', 'loadKw', Number(e.target.value))} 
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--muted)] mb-1">Supply Voltage</label>
        <select 
          className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--card-border)] text-[var(--foreground)] rounded-md px-3 py-2 outline-none focus:border-[var(--accent)]" 
          value={data.supplyVoltage || "230V"} 
          onChange={e => updateForm('technical', 'supplyVoltage', e.target.value)}
        >
          <option value="230V">230V (LT Single Phase)</option>
          <option value="415V">415V (LT Three Phase)</option>
          <option value="11kV">11kV (HT)</option>
          <option value="33kV">33kV (HT)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--muted)] mb-1">Phase Type</label>
        <select 
          className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--card-border)] text-[var(--foreground)] rounded-md px-3 py-2 outline-none focus:border-[var(--accent)]" 
          value={data.phaseType || "SINGLE"} 
          onChange={e => updateForm('technical', 'phaseType', e.target.value)}
        >
          <option value="SINGLE">Single Phase</option>
          <option value="THREE">Three Phase</option>
        </select>
      </div>
      <div className="col-span-2">
        <label className="flex items-center gap-2 px-3 py-3 w-full border border-[var(--card-border)] rounded-md bg-[rgba(255,255,255,0.01)] cursor-pointer hover:bg-[rgba(255,255,255,0.03)] transition">
          <input 
            type="checkbox" 
            className="rounded text-[var(--accent)] focus:ring-[var(--accent)]" 
            checked={data.isNetMetered || false} 
            onChange={e => updateForm('technical', 'isNetMetered', e.target.checked)} 
          />
          <span className="text-sm font-medium text-[var(--foreground)]">Enable Solar Net-Metering (Grid Injection Support)</span>
        </label>
      </div>
    </div>
  );
}
