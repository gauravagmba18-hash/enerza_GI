import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "txnId",
            "label": "ID"
      },
      {
            "key": "orderId",
            "label": "Order ID"
      },
      {
            "key": "settlementId",
            "label": "Settlement ID"
      },
      {
            "key": "gatewayRef",
            "label": "Gateway Ref"
      },
      {
            "key": "gatewayStatus",
            "label": "Status"
      },
      {
            "key": "responseAt",
            "label": "Response At",
            "type": "date"
      },
      {
            "key": "settledAt",
            "label": "Settled At",
            "type": "date"
      }
];

  return (
    <DataTable
      title="Gateway Transactions"
      apiPath="/api/gateway-txns"
      columns={columns}
      color="#10b981"
    />
  );
}
