import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "partnerId",
            "label": "ID"
      },
      {
            "key": "partnerName",
            "label": "Partner Name"
      },
      {
            "key": "partnerType",
            "label": "Type"
      },
      {
            "key": "contactEmail",
            "label": "Email",
            "type": "email"
      },
      {
            "key": "contactMobile",
            "label": "Mobile"
      },
      {
            "key": "settlementMode",
            "label": "Settlement Mode"
      },
      {
            "key": "status",
            "label": "Status"
      }
];

  return (
    <DataTable
      title="API Partners"
      apiPath="/api/api-partners"
      columns={columns}
      color="#fb923c"
    />
  );
}
