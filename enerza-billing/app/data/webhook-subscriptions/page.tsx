import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "webhookId",
            "label": "ID"
      },
      {
            "key": "partnerId",
            "label": "Partner ID"
      },
      {
            "key": "eventType",
            "label": "Event Type"
      },
      {
            "key": "targetUrl",
            "label": "Target URL"
      },
      {
            "key": "signatureMethod",
            "label": "Signature Method"
      },
      {
            "key": "retryCount",
            "label": "Retry Count",
            "type": "number"
      },
      {
            "key": "active",
            "label": "Active?",
            "type": "boolean"
      }
];

  return (
    <DataTable
      title="Webhook Subscriptions"
      apiPath="/api/webhook-subscriptions"
      columns={columns}
      color="#fb923c"
    />
  );
}
