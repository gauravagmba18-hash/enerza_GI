import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "channelId",
            "label": "ID"
      },
      {
            "key": "channelName",
            "label": "Channel Name"
      },
      {
            "key": "channelType",
            "label": "Type"
      },
      {
            "key": "provider",
            "label": "Provider"
      },
      {
            "key": "status",
            "label": "Status"
      }
];

  return (
    <DataTable
      title="Payment Channels"
      apiPath="/api/payment-channels"
      columns={columns}
      color="#10b981"
    />
  );
}
