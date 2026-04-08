import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "routeId",
            "label": "ID"
      },
      {
            "key": "areaId",
            "label": "Area ID"
      },
      {
            "key": "routeName",
            "label": "Route Name"
      },
      {
            "key": "cycleGroup",
            "label": "Cycle Group"
      },
      {
            "key": "readerId",
            "label": "Reader ID"
      },
      {
            "key": "status",
            "label": "Status"
      }
];

  return (
    <DataTable
      title="Routes"
      apiPath="/api/routes"
      columns={columns}
      color="#f59e0b"
    />
  );
}
