import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "requestId",
            "label": "ID"
      },
      {
            "key": "appUserId",
            "label": "User ID"
      },
      {
            "key": "accountId",
            "label": "Account ID"
      },
      {
            "key": "typeId",
            "label": "Type ID"
      },
      {
            "key": "description",
            "label": "Description"
      },
      {
            "key": "status",
            "label": "Status"
      }
];

  return (
    <DataTable
      title="App Service Requests"
      apiPath="/api/app-service-requests"
      columns={columns}
      color="#f472b6"
    />
  );
}
