import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "premiseId",
            "label": "ID"
      },
      {
            "key": "addressLine1",
            "label": "Address Line 1"
      },
      {
            "key": "addressLine2",
            "label": "Address Line 2"
      },
      {
            "key": "areaId",
            "label": "Area ID"
      },
      {
            "key": "buildingType",
            "label": "Building Type"
      },
      {
            "key": "status",
            "label": "Status"
      }
];

  return (
    <DataTable
      title="Premises"
      apiPath="/api/premises"
      columns={columns}
      color="#06b6d4"
    />
  );
}
