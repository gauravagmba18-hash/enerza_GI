import React from 'react';
import { KpiCard } from './KpiCard';
import { MessageSquare, Wrench, Users, Wallet, CreditCard, Activity } from 'lucide-react';

export const CustomerStatsCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-in fade-in slide-up duration-700">
      <KpiCard
        label="Service Disruptions"
        value={14}
        subValue="3 Critical SLA alerts"
        delta={{ value: "24h trend", type: "down" }}
        variant="danger"
        icon={Activity}
      />
      <KpiCard
        label="Open Work Orders"
        value={21}
        subValue="8 Completed · 6 En-route"
        delta={{ value: "↑ 12% week", type: "up" }}
        variant="indigo"
        icon={Wrench}
      />
      <KpiCard
        label="Consumers Impacted"
        value="1,160"
        subValue="Active Grid Outages"
        delta={{ value: "F-07, F-12", type: "neutral" }}
        variant="warning"
        icon={Users}
      />
      <KpiCard
        label="Average Credit Risk"
        value={720}
        subValue="Portfolio Baseline: 680"
        delta={{ value: "+12 pts MTD", type: "up" }}
        variant="success"
        icon={Wallet}
      />
    </div>
  );
};
