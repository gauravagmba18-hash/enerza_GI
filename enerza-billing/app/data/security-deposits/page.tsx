import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "depositId",
            "label": "ID"
      },
      {
            "key": "accountId",
            "label": "Account ID"
      },
      {
            "key": "amount",
            "label": "Amount",
            "type": "number"
      },
      {
            "key": "status",
            "label": "Status"
      },
      {
            "key": "paymentDate",
            "label": "Payment Date",
            "type": "date"
      }
];

  return (
    <DataTable
      title="Security Deposits"
      apiPath="/api/security-deposits"
      columns={columns}
      color="#ef4444"
    />
  );
}
