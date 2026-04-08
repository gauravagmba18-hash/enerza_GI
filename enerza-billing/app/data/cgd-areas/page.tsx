import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "areaId",
            "label": "ID"
      },
      {
            "key": "areaName",
            "label": "Area Name"
      },
      {
            "key": "city",
            "label": "City"
      },
      {
            "key": "district",
            "label": "District"
      },
      {
            "key": "state",
            "label": "State"
      },
      {
            "key": "zone",
            "label": "Zone"
      },
      {
            "key": "utilityType",
            "label": "Utility Type"
      },
      {
            "key": "status",
            "label": "Status"
      }
];

  return (
    <DataTable
      title="CGD Areas"
      apiPath="/api/cgd-areas"
      columns={columns}
      color="#f59e0b"
    />
  );
}
