import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "categoryId",
            "label": "ID"
      },
      {
            "key": "categoryName",
            "label": "Category Name"
      },
      {
            "key": "vehicleType",
            "label": "Vehicle Type"
      },
      {
            "key": "commercialFlag",
            "label": "Commercial?",
            "type": "boolean"
      },
      {
            "key": "status",
            "label": "Status"
      }
];

  return (
    <DataTable
      title="Vehicle Categories"
      apiPath="/api/vehicle-categories"
      columns={columns}
      color="#f59e0b"
    />
  );
}
