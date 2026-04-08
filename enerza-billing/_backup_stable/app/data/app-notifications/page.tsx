import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "notifId",
            "label": "ID"
      },
      {
            "key": "appUserId",
            "label": "User ID"
      },
      {
            "key": "templateId",
            "label": "Template ID"
      },
      {
            "key": "channel",
            "label": "Channel"
      },
      {
            "key": "message",
            "label": "Message"
      },
      {
            "key": "sentAt",
            "label": "Sent At",
            "type": "date"
      },
      {
            "key": "readFlag",
            "label": "Read?",
            "type": "boolean"
      }
];

  return (
    <DataTable
      title="App Notifications"
      apiPath="/api/app-notifications"
      columns={columns}
      color="#f472b6"
    />
  );
}
