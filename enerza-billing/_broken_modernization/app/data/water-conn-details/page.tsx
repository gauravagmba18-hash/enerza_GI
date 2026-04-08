import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "connectionId",
            "label": "Connection ID"
      },
      {
            "key": "pipeSizeMm",
            "label": "Pipe Size (mm)",
            "type": "number"
      },
      {
            "key": "supplyZoneId",
            "label": "Supply Zone"
      },
      {
            "key": "meterType",
            "label": "Meter Type"
      }
];

  return (
    <DataTable
      title="Water Connection Details"
      apiPath="/api/water-conn-details"
      columns={columns}
      color="#06b6d4"
    />
  );
}
