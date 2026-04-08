import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "lineId",
            "label": "ID"
      },
      {
            "key": "billId",
            "label": "Bill ID"
      },
      {
            "key": "componentId",
            "label": "Component ID"
      },
      {
            "key": "description",
            "label": "Description"
      },
      {
            "key": "quantity",
            "label": "Qty",
            "type": "number"
      },
      {
            "key": "rate",
            "label": "Rate",
            "type": "number"
      },
      {
            "key": "amount",
            "label": "Amount",
            "type": "number"
      },
      {
            "key": "lineType",
            "label": "Line Type"
      }
];

  return (
    <DataTable
      title="Bill Lines"
      apiPath="/api/bill-lines"
      columns={columns}
      color="#818cf8"
    />
  );
}
