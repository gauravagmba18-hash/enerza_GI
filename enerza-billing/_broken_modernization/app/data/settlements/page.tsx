import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "settlementId",
            "label": "ID"
      },
      {
            "key": "gatewayId",
            "label": "Gateway ID"
      },
      {
            "key": "settlementDate",
            "label": "Date",
            "type": "date"
      },
      {
            "key": "grossAmount",
            "label": "Gross Amount",
            "type": "number"
      },
      {
            "key": "netAmount",
            "label": "Net Amount",
            "type": "number"
      },
      {
            "key": "matchedCount",
            "label": "Matched",
            "type": "number"
      },
      {
            "key": "exceptionCount",
            "label": "Exceptions",
            "type": "number"
      }
];

  return (
    <DataTable
      title="Settlements"
      apiPath="/api/settlements"
      columns={columns}
      color="#10b981"
    />
  );
}
