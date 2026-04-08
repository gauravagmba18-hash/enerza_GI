import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "cycleId",
            "label": "ID"
      },
      {
            "key": "cycleName",
            "label": "Cycle Name"
      },
      {
            "key": "readDateRule",
            "label": "Read Date Rule"
      },
      {
            "key": "billDateRule",
            "label": "Bill Date Rule"
      },
      {
            "key": "dueDateRule",
            "label": "Due Date Rule"
      },
      {
            "key": "graceDays",
            "label": "Grace Days",
            "type": "number"
      },
      {
            "key": "status",
            "label": "Status"
      }
];

  return (
    <DataTable
      title="Bill Cycles"
      apiPath="/api/bill-cycles"
      columns={columns}
      color="#818cf8"
    />
  );
}
