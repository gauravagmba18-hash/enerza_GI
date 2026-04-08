import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "levelId",
            "label": "ID"
      },
      {
            "key": "levelName",
            "label": "Level Name"
      },
      {
            "key": "daysOverdue",
            "label": "Days Overdue",
            "type": "number"
      },
      {
            "key": "penaltyFee",
            "label": "Penalty Fee",
            "type": "number"
      },
      {
            "key": "actionType",
            "label": "Action Type"
      }
];

  return (
    <DataTable
      title="Dunning Levels"
      apiPath="/api/dunning-levels"
      columns={columns}
      color="#ef4444"
    />
  );
}
