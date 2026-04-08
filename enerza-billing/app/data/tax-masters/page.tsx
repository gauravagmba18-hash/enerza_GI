import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "taxId",
            "label": "ID"
      },
      {
            "key": "taxName",
            "label": "Tax Name"
      },
      {
            "key": "jurisdiction",
            "label": "Jurisdiction"
      },
      {
            "key": "taxRate",
            "label": "Tax Rate (%)",
            "type": "number"
      },
      {
            "key": "applicability",
            "label": "Applicability"
      },
      {
            "key": "effectiveFrom",
            "label": "From",
            "type": "date"
      },
      {
            "key": "effectiveTo",
            "label": "To",
            "type": "date"
      }
];

  return (
    <DataTable
      title="Tax Masters"
      apiPath="/api/tax-masters"
      columns={columns}
      color="#818cf8"
    />
  );
}
