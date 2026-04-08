import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "subStationId",
            "label": "ID"
      },
      {
            "key": "name",
            "label": "Name"
      },
      {
            "key": "voltageLevel",
            "label": "Voltage Level"
      },
      {
            "key": "areaId",
            "label": "Area ID"
      },
      {
            "key": "status",
            "label": "Status"
      }
];

  return (
    <DataTable
      title="Sub-Stations"
      apiPath="/api/sub-stations"
      columns={columns}
      color="#eab308"
    />
  );
}
