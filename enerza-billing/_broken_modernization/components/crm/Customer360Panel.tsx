"use client"

import React, { useState } from 'react';
import { X, User, Zap, FileText, CreditCard, MessageSquare, MapPin, Tablet } from 'lucide-react';

interface Customer360PanelProps {
  customer: any;
  isOpen: boolean;
  onClose: () => void;
}

export const Customer360Panel: React.FC<Customer360PanelProps> = ({ customer, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('svc');

  if (!isOpen || !customer) return null;

  const tabs = [
    { id: 'svc', label: 'Service', icon: Zap },
    { id: 'bills', label: 'Bills', icon: FileText },
    { id: 'pay', label: 'Payments', icon: CreditCard },
    { id: 'comp', label: 'Complaints', icon: MessageSquare },
    { id: 'field', label: 'Field', icon: MapPin },
    { id: 'dev', label: 'Devices', icon: Tablet },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-300">
      {/* Overlay */}
      <div className="absolute inset-0 bg-enerza-navy/40 backdrop-blur-[2px]" onClick={onClose} />
      
      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-500">
        
        {/* BFS Header */}
        <div className="bg-gradient-to-br from-enerza-navy to-enerza-ink2 p-4 flex items-center gap-3.5 border-b border-white/10">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-xl text-white shadow-inner">
            <User className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="font-syne text-lg font-bold text-white leading-tight">{customer.fullName}</div>
            <div className="text-[11px] text-white/60 font-medium">
              {customer.customerType || 'Residential'} · BP ID: {customer.customerId} · Status: {customer.status}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BFS Stats */}
        <div className="grid grid-cols-4 border-b border-enerza-border">
          {[
            { label: 'Outstanding', value: '₹1,284', color: 'text-enerza-gold' },
            { label: 'Bills', value: '12', color: 'text-enerza-blue' },
            { label: 'Complaints', value: '1', color: 'text-enerza-red' },
            { label: 'Field Visits', value: '3', color: 'text-enerza-teal' },
          ].map((stat, idx) => (
            <div key={idx} className="p-2.5 text-center border-r last:border-r-0 border-enerza-border hover:bg-enerza-bg transition-colors cursor-default">
              <div className={`font-syne text-lg font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-[9px] uppercase tracking-wider text-enerza-ink3 font-mono">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* BFS Tabs */}
        <div className="flex border-b border-enerza-border bg-enerza-bg/30 px-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold font-syne border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id 
                ? 'border-enerza-navy text-enerza-navy bg-white shadow-sm' 
                : 'border-transparent text-enerza-ink3 hover:text-enerza-navy hover:bg-white/50'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-enerza-bg/10 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === 'svc' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-bold text-enerza-ink3 font-mono uppercase border-b border-enerza-border pb-1.5 mb-3">Service Agreement</div>
                  <InfoRow label="Contract ID" value={`CON-${customer.customerId}-01`} />
                  <InfoRow label="Tariff" value={customer.category || "LT-1 Domestic"} />
                  <InfoRow label="Credit Score" value={customer.creditScore?.toString() || "720"} />
                  <InfoRow label="Load" value="5 kW (Single Phase)" />
                  <InfoRow label="Bill Cycle" value="Monthly (8th)" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-enerza-ink3 font-mono uppercase border-b border-enerza-border pb-1.5 mb-3">Service History</div>
                  <div className="space-y-4 border-l-2 border-enerza-border ml-2 pl-4 relative">
                    <TimelineItem title="New Connection Activated" sub="LT-1 Domestic 5kW" date="12 Jan 2021" status="done" />
                    <TimelineItem title="Meter Replacement" sub="Old meter faulty (CMP-18211)" date="05 Mar 2023" status="done" />
                    <TimelineItem title="Category Change Request" sub="Pending: LT-1 → LT-2" date="15 Mar 2026" status="active" />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {['bills', 'pay', 'comp', 'field', 'dev'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center h-48 text-enerza-ink3/50 italic text-xs">
              <div className="bg-enerza-bg rounded-full p-4 mb-3 border border-enerza-border drop-shadow-sm">
                {React.createElement(tabs.find(t => t.id === activeTab)?.icon || User, { className: 'w-6 h-6' })}
              </div>
              Detailed {tabs.find(t=>t.id===activeTab)?.label} logs will be displayed here.
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-3 border-t border-enerza-border bg-enerza-bg/30 flex justify-end gap-2">
          <button className="px-3 py-1.5 rounded-lg border border-enerza-border bg-white text-xs font-medium hover:bg-enerza-bg" onClick={onClose}>
            Close
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-enerza-navy text-white text-xs font-semibold hover:opacity-90 shadow-lg shadow-enerza-navy/20">
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string, value: string }) => (
  <div className="mb-2.5">
    <div className="text-[9px] uppercase tracking-wider text-enerza-ink4 font-mono leading-none">{label}</div>
    <div className="text-xs font-semibold text-enerza-ink mt-0.5">{value}</div>
  </div>
);

const TimelineItem = ({ title, sub, date, status }: { title: string, sub: string, date: string, status: 'done' | 'active' | 'pend' }) => (
  <div className="relative mb-4 last:mb-0">
    <div className={`absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full border-2 bg-white ${
      status === 'done' ? 'bg-enerza-green border-enerza-green' : 
      status === 'active' ? 'bg-enerza-blue border-enerza-blue ring-4 ring-enerza-blue/20' : 
      'border-enerza-border'
    }`} />
    <div className="text-xs font-bold text-enerza-ink leading-tight">{title}</div>
    <div className="text-[10.5px] text-enerza-ink3 mt-0.5">{sub}</div>
    <div className="text-[9px] text-enerza-ink4 font-mono mt-1">{date}</div>
  </div>
);
