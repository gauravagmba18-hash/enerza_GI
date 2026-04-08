import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "linkId",
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
            "key": "ownershipType",
            "label": "Ownership Type"
      },
      {
            "key": "linkedAt",
            "label": "Linked At",
            "type": "date"
      }
];

  return (
    <DataTable
      title="App Account Links"
      apiPath="/api/app-account-links"
      columns={columns}
      color="#f472b6"
    />
  );
}
