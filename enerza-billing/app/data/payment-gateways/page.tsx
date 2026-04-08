import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "gatewayId",
            "label": "ID"
      },
      {
            "key": "provider",
            "label": "Provider"
      },
      {
            "key": "merchantId",
            "label": "Merchant ID"
      },
      {
            "key": "environment",
            "label": "Environment"
      },
      {
            "key": "status",
            "label": "Status"
      }
];

  return (
    <DataTable
      title="Payment Gateways"
      apiPath="/api/payment-gateways"
      columns={columns}
      color="#10b981"
    />
  );
}
