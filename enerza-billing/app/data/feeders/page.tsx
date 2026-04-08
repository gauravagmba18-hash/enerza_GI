import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "feederId",
            "label": "ID"
      },
      {
            "key": "name",
            "label": "Name"
      },
      {
            "key": "subStationId",
            "label": "Sub-Station ID"
      },
      {
            "key": "status",
            "label": "Status"
      }
];

  return (
    <DataTable
      title="Feeders"
      apiPath="/api/feeders"
      columns={columns}
      color="#eab308"
    />
  );
}
