import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "appUserId",
            "label": "ID"
      },
      {
            "key": "customerId",
            "label": "Customer ID"
      },
      {
            "key": "mobile",
            "label": "Mobile"
      },
      {
            "key": "email",
            "label": "Email",
            "type": "email"
      },
      {
            "key": "otpVerified",
            "label": "OTP Verified"
      },
      {
            "key": "status",
            "label": "Status"
      }
];

  return (
    <DataTable
      title="App Users"
      apiPath="/api/app-users"
      columns={columns}
      color="#f472b6"
    />
  );
}
