import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "connectionId",
            "label": "Connection ID"
      },
      {
            "key": "loadKw",
            "label": "Load (kW)",
            "type": "number"
      },
      {
            "key": "supplyVoltage",
            "label": "Supply Voltage"
      },
      {
            "key": "phaseType",
            "label": "Phase Type"
      },
      {
            "key": "tariffCategory",
            "label": "Tariff Category"
      }
];

  return (
    <DataTable
      title="Electricity Connection Details"
      apiPath="/api/elec-conn-details"
      columns={columns}
      color="#06b6d4"
    />
  );
}
