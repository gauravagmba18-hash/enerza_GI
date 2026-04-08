import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "suspenseId",
            "label": "ID"
      },
      {
            "key": "txnId",
            "label": "Txn ID"
      },
      {
            "key": "reason",
            "label": "Reason"
      },
      {
            "key": "amount",
            "label": "Amount",
            "type": "number"
      },
      {
            "key": "resolutionStatus",
            "label": "Resolution Status"
      }
];

  return (
    <DataTable
      title="Suspense Records"
      apiPath="/api/suspense-records"
      columns={columns}
      color="#10b981"
    />
  );
}
