import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "slotId",
            "label": "ID"
      },
      {
            "key": "name",
            "label": "Name"
      },
      {
            "key": "startTime",
            "label": "Start Time"
      },
      {
            "key": "endTime",
            "label": "End Time"
      },
      {
            "key": "rateModifier",
            "label": "Rate Modifier",
            "type": "number"
      },
      {
            "key": "status",
            "label": "Status"
      }
];

  return (
    <DataTable
      title="TOD Slots"
      apiPath="/api/tod-slots"
      columns={columns}
      color="#eab308"
    />
  );
}
