"use client";
import React from 'react';

interface Props {
  data: any;
  updateForm: (section: 'customer' | 'premise' | 'service' | 'technical' | 'meter', field: string, value: any) => void;
}

export function GasTechForm({ data, updateForm }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 mt-6 animate-in fade-in duration-300">
      <div>
        <label className="block text-sm font-medium text-[var(--muted)] mb-1">Service Type</label>
        <select 
          className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--card-border)] text-[var(--foreground)] rounded-md px-3 py-2 outline-none focus:border-[var(--accent)]" 
          value={data.serviceType || "DOMESTIC"} 
          onChange={e => updateForm('technical', 'serviceType', e.target.value)}
        >
          <option value="DOMESTIC">Domestic (PNG)</option>
          <option value="COMMERCIAL">Commercial (PNG)</option>
          <option value="INDUSTRIAL">Industrial (PNG)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--muted)] mb-1">Pressure Band</label>
        <select 
          className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--card-border)] text-[var(--foreground)] rounded-md px-3 py-2 outline-none focus:border-[var(--accent)]" 
          value={data.pressureBandId || "cl_pb_01"} 
          onChange={e => updateForm('technical', 'pressureBandId', e.target.value)}
        >
          <option value="cl_pb_01">Low Pressure (21 mbar)</option>
          <option value="cl_pb_02">Medium Pressure (100 mbar)</option>
          <option value="cl_pb_03">High Pressure (1-2 bar)</option>
        </select>
      </div>
      <div className="col-span-2">
        <label className="block text-sm font-medium text-[var(--muted)] mb-1">Regulator Serial Number</label>
        <input 
          type="text" 
          className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--card-border)] text-[var(--foreground)] rounded-md px-3 py-2 outline-none focus:border-[var(--accent)]" 
          value={data.regulatorSerial || ""} 
          onChange={e => updateForm('technical', 'regulatorSerial', e.target.value)} 
          placeholder="REG-XXXXX"
        />
      </div>
      <div className="col-span-2 p-4 bg-[rgba(245,158,11,0.05)] border border-[rgba(245,158,11,0.2)] rounded-lg text-sm text-[var(--warning)]">
        <strong>Note:</strong> Gas pricing follows the APM (Administered Pricing Mechanism) quota system. Ensure the correct Service Type is selected for quota allocation.
      </div>
    </div>
  );
}
