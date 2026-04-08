import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "accountId",
            "label": "ID"
      },
      {
            "key": "customerId",
            "label": "Customer ID"
      },
      {
            "key": "premiseId",
            "label": "Premise ID"
      },
      {
            "key": "cycleId",
            "label": "Cycle ID"
      },
      {
            "key": "billDeliveryMode",
            "label": "Bill Delivery"
      },
      {
            "key": "status",
            "label": "Status"
      },
      {
            "key": "effectiveFrom",
            "label": "Effective From",
            "type": "date"
      }
];

  return (
    <DataTable
      title="Accounts"
      apiPath="/api/accounts"
      columns={columns}
      color="#06b6d4"
    />
  );
}
