import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
    { key: "cnId",            label: "CN ID" },
    { key: "accountId",       label: "Account ID" },
    { key: "reason",          label: "Reason" },
    { key: "amount",          label: "Amount", type: "number" },
    { key: "status",          label: "Status" },
    { key: "issuedOn",        label: "Issued On", type: "date" },
    { key: "appliedToBillId", label: "Applied To Bill" },
  ];

  return (
    <DataTable
      title="Credit Notes"
      apiPath="/api/credit-notes"
      columns={columns}
      color="#818cf8"
    />
  );
}
