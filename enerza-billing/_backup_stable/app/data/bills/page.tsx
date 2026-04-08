import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "billId",
            "label": "ID"
      },
      {
            "key": "accountId",
            "label": "Account ID"
      },
      {
            "key": "connectionId",
            "label": "Connection ID"
      },
      {
            "key": "billDate",
            "label": "Bill Date",
            "type": "date"
      },
      {
            "key": "dueDate",
            "label": "Due Date",
            "type": "date"
      },
      {
            "key": "netAmount",
            "label": "Net Amount",
            "type": "number"
      },
      {
            "key": "taxAmount",
            "label": "Tax Amount",
            "type": "number"
      },
      {
            "key": "totalAmount",
            "label": "Total",
            "type": "number"
      },
      {
            "key": "status",
            "label": "Status"
      }
];

  return (
    <DataTable
      title="Bills"
      apiPath="/api/bills"
      columns={columns}
      color="#818cf8"
    />
  );
}
