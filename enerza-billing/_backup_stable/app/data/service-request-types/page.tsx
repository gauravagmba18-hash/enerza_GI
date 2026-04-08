import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "typeId",
            "label": "ID"
      },
      {
            "key": "category",
            "label": "Category"
      },
      {
            "key": "subcategory",
            "label": "Subcategory"
      },
      {
            "key": "slaHours",
            "label": "SLA Hours",
            "type": "number"
      },
      {
            "key": "priority",
            "label": "Priority"
      },
      {
            "key": "department",
            "label": "Department"
      }
];

  return (
    <DataTable
      title="Service Request Types"
      apiPath="/api/service-request-types"
      columns={columns}
      color="#f472b6"
    />
  );
}
