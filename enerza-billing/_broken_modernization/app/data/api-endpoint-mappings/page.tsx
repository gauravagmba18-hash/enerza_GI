import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "mappingId",
            "label": "ID"
      },
      {
            "key": "partnerId",
            "label": "Partner ID"
      },
      {
            "key": "endpointId",
            "label": "Endpoint ID"
      },
      {
            "key": "enabled",
            "label": "Enabled?",
            "type": "boolean"
      },
      {
            "key": "effectiveFrom",
            "label": "Effective From",
            "type": "date"
      }
];

  return (
    <DataTable
      title="API Endpoint Mappings"
      apiPath="/api/api-endpoint-mappings"
      columns={columns}
      color="#fb923c"
    />
  );
}
