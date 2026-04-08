import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "limitId",
            "label": "ID"
      },
      {
            "key": "partnerId",
            "label": "Partner ID"
      },
      {
            "key": "requestsPerMin",
            "label": "Req/min",
            "type": "number"
      },
      {
            "key": "burstLimit",
            "label": "Burst Limit",
            "type": "number"
      },
      {
            "key": "timeoutMs",
            "label": "Timeout (ms)",
            "type": "number"
      },
      {
            "key": "retryPolicy",
            "label": "Retry Policy"
      }
];

  return (
    <DataTable
      title="API Rate Limits"
      apiPath="/api/api-rate-limits"
      columns={columns}
      color="#fb923c"
    />
  );
}
