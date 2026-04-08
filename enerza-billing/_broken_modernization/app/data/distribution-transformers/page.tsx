import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "dtId",
            "label": "ID"
      },
      {
            "key": "name",
            "label": "Name"
      },
      {
            "key": "feederId",
            "label": "Feeder ID"
      },
      {
            "key": "capacityKva",
            "label": "Capacity (kVA)",
            "type": "number"
      },
      {
            "key": "status",
            "label": "Status"
      }
];

  return (
    <DataTable
      title="Transformers (DT)"
      apiPath="/api/distribution-transformers"
      columns={columns}
      color="#eab308"
    />
  );
}
