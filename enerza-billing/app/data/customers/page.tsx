import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "customerId",
            "label": "ID"
      },
      {
            "key": "fullName",
            "label": "Full Name"
      },
      {
            "key": "customerType",
            "label": "Type"
      },
      {
            "key": "mobile",
            "label": "Mobile",
            "type": "text"
      },
      {
            "key": "email",
            "label": "Email",
            "type": "email"
      },
      {
            "key": "kycStatus",
            "label": "KYC Status"
      },
      {
            "key": "status",
            "label": "Status"
      }
];

  return (
    <DataTable
      title="Customers"
      apiPath="/api/customers"
      columns={columns}
      color="#06b6d4"
      detailPath="/customers"
    />
  );
}
