import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "refundId",
            "label": "ID"
      },
      {
            "key": "orderId",
            "label": "Order ID"
      },
      {
            "key": "reasonCode",
            "label": "Reason"
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
            "key": "initiatedAt",
            "label": "Initiated At",
            "type": "date"
      }
];

  return (
    <DataTable
      title="Refunds"
      apiPath="/api/refunds"
      columns={columns}
      color="#10b981"
    />
  );
}
