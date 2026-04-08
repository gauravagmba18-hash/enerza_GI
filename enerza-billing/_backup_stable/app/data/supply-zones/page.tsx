import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "supplyZoneId",
            "label": "ID"
      },
      {
            "key": "name",
            "label": "Zone Name"
      },
      {
            "key": "utilityType",
            "label": "Utility"
      },
      {
            "key": "status",
            "label": "Status"
      }
];

  return (
    <DataTable
      title="Supply Zones"
      apiPath="/api/supply-zones"
      columns={columns}
      color="#3b82f6"
    />
  );
}
