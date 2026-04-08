import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "componentId",
            "label": "ID"
      },
      {
            "key": "ratePlanId",
            "label": "Rate Plan"
      },
      {
            "key": "componentName",
            "label": "Component Name"
      },
      {
            "key": "componentType",
            "label": "Type"
      },
      {
            "key": "uom",
            "label": "UOM"
      },
      {
            "key": "rate",
            "label": "Rate",
            "type": "number"
      },
      {
            "key": "slabFrom",
            "label": "Slab From",
            "type": "number"
      },
      {
            "key": "slabTo",
            "label": "Slab To",
            "type": "number"
      }
];

  return (
    <DataTable
      title="Charge Components"
      apiPath="/api/charge-components"
      columns={columns}
      color="#818cf8"
    />
  );
}
