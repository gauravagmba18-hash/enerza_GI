import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
    { key: "disputeId",      label: "Dispute ID" },
    { key: "accountId",      label: "Account ID" },
    { key: "disputeType",    label: "Type" },
    { key: "disputedAmount", label: "Disputed Amt", type: "number" },
    { key: "financialHold",  label: "Financial Hold" },
    { key: "assignedTo",     label: "Assigned To" },
    { key: "status",         label: "Status" },
    { key: "raisedOn",       label: "Raised On", type: "date" },
  ];

  return (
    <DataTable
      title="Disputes"
      apiPath="/api/disputes"
      columns={columns}
      color="#ef4444"
    />
  );
}
