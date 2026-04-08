import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "noticeId",
            "label": "ID"
      },
      {
            "key": "accountId",
            "label": "Account ID"
      },
      {
            "key": "levelId",
            "label": "Level ID"
      },
      {
            "key": "status",
            "label": "Status"
      },
      {
            "key": "issuedAt",
            "label": "Issued At",
            "type": "date"
      }
];

  return (
    <DataTable
      title="Dunning Notices"
      apiPath="/api/dunning-notices"
      columns={columns}
      color="#ef4444"
    />
  );
}
