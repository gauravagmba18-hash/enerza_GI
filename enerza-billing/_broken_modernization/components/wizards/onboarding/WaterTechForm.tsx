"use client";
import React from 'react';

interface Props {
  data: any;
  updateForm: (section: 'customer' | 'premise' | 'service' | 'technical' | 'meter', field: string, value: any) => void;
}

export function WaterTechForm({ data, updateForm }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 mt-6 animate-in fade-in duration-300">
      <div>
        <label className="block text-sm font-medium text-[var(--muted)] mb-1">Pipe Size (mm)</label>
        <select 
          className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--card-border)] text-[var(--foreground)] rounded-md px-3 py-2 outline-none focus:border-[var(--accent)]" 
          value={data.pipeSizeMm || 15} 
          onChange={e => updateForm('technical', 'pipeSizeMm', Number(e.target.value))}
        >
          <option value="15">15mm (1/2") Domestic</option>
          <option value="20">20mm (3/4") Residential</option>
          <option value="25">25mm (1") Commercial</option>
          <option value="50">50mm (2") Industrial</option>
          <option value="100">100mm (4") High Flow</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--muted)] mb-1">Supply Zone</label>
        <select 
          className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--card-border)] text-[var(--foreground)] rounded-md px-3 py-2 outline-none focus:border-[var(--accent)]" 
          value={data.supplyZoneId || ""} 
          onChange={e => updateForm('technical', 'supplyZoneId', e.target.value)}
        >
          <option value="">Select a Zone...</option>
          <option value="zone_north_01">Sector 14 - North Zone</option>
          <option value="zone_south_01">Indira Nagar - Zone B</option>
          <option value="zone_west_01">Gomti Nagar - West</option>
        </select>
      </div>
      <div className="col-span-2">
        <label className="block text-sm font-medium text-[var(--muted)] mb-1">Meter Type</label>
        <select 
          className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--card-border)] text-[var(--foreground)] rounded-md px-3 py-2 outline-none focus:border-[var(--accent)]" 
          value={data.meterType || "MECHANICAL"} 
          onChange={e => updateForm('technical', 'meterType', e.target.value)}
        >
          <option value="MECHANICAL">Mechanical (Multi-jet)</option>
          <option value="ULTRASONIC">Ultrasonic (Solid State)</option>
          <option value="ELECTROMAGNETIC">Electromagnetic (Magmeter)</option>
        </select>
      </div>
      <div className="col-span-2 p-4 bg-[rgba(59,130,246,0.05)] border border-[rgba(59,130,246,0.2)] rounded-lg text-sm text-[var(--info)]">
        <strong>Information:</strong> Supply Zone mapping is critical for NRW (Non-Revenue Water) leakage tracking. Ensure the correct bulk-meter zone is selected.
      </div>
    </div>
  );
}
