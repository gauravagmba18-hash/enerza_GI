import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "meterId",
            "label": "ID"
      },
      {
            "key": "serialNo",
            "label": "Serial No."
      },
      {
            "key": "meterType",
            "label": "Type"
      },
      {
            "key": "make",
            "label": "Make"
      },
      {
            "key": "model",
            "label": "Model"
      },
      {
            "key": "utilityType",
            "label": "Utility Type"
      },
      {
            "key": "calibrationDue",
            "label": "Calibration Due",
            "type": "date"
      },
      {
            "key": "status",
            "label": "Status"
      }
];

  return (
    <DataTable
      title="Meters"
      apiPath="/api/meters"
      columns={columns}
      color="#f59e0b"
    />
  );
}
