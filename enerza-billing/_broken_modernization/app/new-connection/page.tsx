import React from 'react';
import { NewConnectionWizard } from '@/components/wizards/NewConnectionWizard';
import { UserPlus } from 'lucide-react';

export default function NewConnectionPage() {
  return (
    <div style={{ padding: "0" }}>
      <div style={{ marginBottom: 32, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, background: "rgba(37,99,235,0.1)", color: "#3b82f6", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, border: "1px solid rgba(37,99,235,0.2)" }}>
           <UserPlus size={32} />
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--foreground)", letterSpacing: "-0.5px" }}>
          New Connection Onboarding
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 16, marginTop: 8, maxWidth: 600 }}>
          Provision a new customer, premise, service line, and meter installation in one unified flow.
        </p>
      </div>

      <div style={{ width: "100%", maxWidth: 900, margin: "0 auto" }}>
         <NewConnectionWizard />
      </div>
    </div>
  );
}
