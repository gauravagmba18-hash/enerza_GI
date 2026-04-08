import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "templateId",
            "label": "ID"
      },
      {
            "key": "channel",
            "label": "Channel"
      },
      {
            "key": "eventType",
            "label": "Event Type"
      },
      {
            "key": "language",
            "label": "Language"
      },
      {
            "key": "bodyTemplate",
            "label": "Body Template"
      },
      {
            "key": "active",
            "label": "Active?",
            "type": "boolean"
      }
];

  return (
    <DataTable
      title="Notification Templates"
      apiPath="/api/notif-templates"
      columns={columns}
      color="#f472b6"
    />
  );
}
