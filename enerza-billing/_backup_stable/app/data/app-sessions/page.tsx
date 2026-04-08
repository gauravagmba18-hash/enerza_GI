import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "sessionId",
            "label": "ID"
      },
      {
            "key": "appUserId",
            "label": "User ID"
      },
      {
            "key": "deviceId",
            "label": "Device ID"
      },
      {
            "key": "startedAt",
            "label": "Started At",
            "type": "date"
      },
      {
            "key": "endedAt",
            "label": "Ended At",
            "type": "date"
      },
      {
            "key": "sessionStatus",
            "label": "Status"
      }
];

  return (
    <DataTable
      title="App Sessions"
      apiPath="/api/app-sessions"
      columns={columns}
      color="#f472b6"
    />
  );
}
