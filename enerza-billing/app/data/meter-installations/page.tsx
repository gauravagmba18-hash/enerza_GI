import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "installId",
            "label": "ID"
      },
      {
            "key": "meterId",
            "label": "Meter ID"
      },
      {
            "key": "connectionId",
            "label": "Connection ID"
      },
      {
            "key": "installDate",
            "label": "Install Date",
            "type": "date"
      },
      {
            "key": "removeDate",
            "label": "Remove Date",
            "type": "date"
      },
      {
            "key": "sealNo",
            "label": "Seal No."
      },
      {
            "key": "reason",
            "label": "Reason"
      }
];

  return (
    <DataTable
      title="Meter Installations"
      apiPath="/api/meter-installations"
      columns={columns}
      color="#f59e0b"
    />
  );
}
