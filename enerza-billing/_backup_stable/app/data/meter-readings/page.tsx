import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "readingId",
            "label": "ID"
      },
      {
            "key": "meterId",
            "label": "Meter ID"
      },
      {
            "key": "connectionId",
            "label": "Connection ID"
      },
      {
            "key": "routeId",
            "label": "Route ID"
      },
      {
            "key": "readingDate",
            "label": "Reading Date",
            "type": "date"
      },
      {
            "key": "readingValue",
            "label": "Reading Value",
            "type": "number"
      },
      {
            "key": "consumption",
            "label": "Consumption",
            "type": "number"
      },
      {
            "key": "readingType",
            "label": "Type"
      },
      {
            "key": "status",
            "label": "Status"
      }
];

  return (
    <DataTable
      title="Meter Readings"
      apiPath="/api/meter-readings"
      columns={columns}
      color="#f59e0b"
    />
  );
}
