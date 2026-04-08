import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "saleId",
            "label": "ID"
      },
      {
            "key": "stationId",
            "label": "Station ID"
      },
      {
            "key": "categoryId",
            "label": "Category ID"
      },
      {
            "key": "saleDate",
            "label": "Sale Date",
            "type": "date"
      },
      {
            "key": "quantityScm",
            "label": "Qty (SCM)",
            "type": "number"
      },
      {
            "key": "unitPrice",
            "label": "Unit Price",
            "type": "number"
      },
      {
            "key": "amount",
            "label": "Amount",
            "type": "number"
      }
];

  return (
    <DataTable
      title="CNG Sales"
      apiPath="/api/cng-sales"
      columns={columns}
      color="#f59e0b"
    />
  );
}
