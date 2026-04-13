import { NewConnectionWizard } from "@/components/wizards/NewConnectionWizard";

export default function NewConnectionPage() {
  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--foreground)", margin: 0 }}>
          New Connection Onboarding
        </h1>
        <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>
          Provision a new customer, premise, service line, and meter installation in one unified flow.
        </p>
      </div>
      <NewConnectionWizard />
    </div>
  );
}
