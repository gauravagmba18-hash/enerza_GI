import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "bandId",
            "label": "ID"
      },
      {
            "key": "bandName",
            "label": "Band Name"
      },
      {
            "key": "minPressure",
            "label": "Min Pressure",
            "type": "number"
      },
      {
            "key": "maxPressure",
            "label": "Max Pressure",
            "type": "number"
      },
      {
            "key": "usageClass",
            "label": "Usage Class"
      }
];

  return (
    <DataTable
      title="Pressure Bands"
      apiPath="/api/pressure-bands"
      columns={columns}
      color="#06b6d4"
    />
  );
}
