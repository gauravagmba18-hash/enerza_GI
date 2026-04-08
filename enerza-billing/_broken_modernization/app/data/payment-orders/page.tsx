import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "orderId",
            "label": "ID"
      },
      {
            "key": "billId",
            "label": "Bill ID"
      },
      {
            "key": "accountId",
            "label": "Account ID"
      },
      {
            "key": "channelId",
            "label": "Channel ID"
      },
      {
            "key": "gatewayId",
            "label": "Gateway ID"
      },
      {
            "key": "amount",
            "label": "Amount",
            "type": "number"
      },
      {
            "key": "convenienceFee",
            "label": "Conv. Fee",
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
      title="Payment Orders"
      apiPath="/api/payment-orders"
      columns={columns}
      color="#10b981"
    />
  );
}
