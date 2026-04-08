import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "planId",
            "label": "ID"
      },
      {
            "key": "accountId",
            "label": "Account ID"
      },
      {
            "key": "monthlyAmount",
            "label": "Monthly Amount",
            "type": "number"
      },
      {
            "key": "startDate",
            "label": "Start Date",
            "type": "date"
      },
      {
            "key": "reconciliationMonth",
            "label": "True-Up Month",
            "type": "number"
      }
];

  return (
    <DataTable
      title="Budget Billing Plans"
      apiPath="/api/budget-billing-plans"
      columns={columns}
      color="#ef4444"
    />
  );
}
