import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "endpointId",
            "label": "ID"
      },
      {
            "key": "endpointCode",
            "label": "Endpoint Code"
      },
      {
            "key": "operationType",
            "label": "Operation"
      },
      {
            "key": "requestMethod",
            "label": "Method"
      },
      {
            "key": "authType",
            "label": "Auth Type"
      },
      {
            "key": "syncFlag",
            "label": "Sync?",
            "type": "boolean"
      },
      {
            "key": "version",
            "label": "Version"
      }
];

  return (
    <DataTable
      title="API Endpoint Catalog"
      apiPath="/api/api-endpoint-catalogs"
      columns={columns}
      color="#fb923c"
    />
  );
}
