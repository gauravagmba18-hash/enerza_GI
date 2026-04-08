import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "readId",
            "label": "ID"
      },
      {
            "key": "supplyZoneId",
            "label": "Zone ID"
      },
      {
            "key": "readDate",
            "label": "Date",
            "type": "date"
      },
      {
            "key": "valueScm",
            "label": "Volume (SCM)",
            "type": "number"
      },
      {
            "key": "status",
            "label": "Status"
      }
];

  return (
    <DataTable
      title="Bulk Meter Reads"
      apiPath="/api/bulk-meter-reads"
      columns={columns}
      color="#3b82f6"
    />
  );
}
