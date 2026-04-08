import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "stationId",
            "label": "ID"
      },
      {
            "key": "stationName",
            "label": "Station Name"
      },
      {
            "key": "areaId",
            "label": "Area ID"
      },
      {
            "key": "city",
            "label": "City"
      },
      {
            "key": "compressorType",
            "label": "Compressor Type"
      },
      {
            "key": "dispenserCount",
            "label": "Dispensers",
            "type": "number"
      },
      {
            "key": "status",
            "label": "Status"
      }
];

  return (
    <DataTable
      title="CNG Stations"
      apiPath="/api/cng-stations"
      columns={columns}
      color="#f59e0b"
    />
  );
}
