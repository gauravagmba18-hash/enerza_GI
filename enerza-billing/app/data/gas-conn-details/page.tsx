import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "connectionId",
            "label": "Connection ID"
      },
      {
            "key": "serviceType",
            "label": "Service Type"
      },
      {
            "key": "pressureBandId",
            "label": "Pressure Band ID"
      },
      {
            "key": "regulatorSerial",
            "label": "Regulator Serial"
      }
];

  return (
    <DataTable
      title="Gas Connection Details"
      apiPath="/api/gas-conn-details"
      columns={columns}
      color="#06b6d4"
    />
  );
}
