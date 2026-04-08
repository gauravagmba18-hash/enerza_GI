import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "apiTxnId",
            "label": "ID"
      },
      {
            "key": "partnerId",
            "label": "Partner ID"
      },
      {
            "key": "endpointId",
            "label": "Endpoint ID"
      },
      {
            "key": "requestTime",
            "label": "Request Time",
            "type": "date"
      },
      {
            "key": "responseMs",
            "label": "Response (ms)",
            "type": "number"
      },
      {
            "key": "statusCode",
            "label": "Status Code"
      },
      {
            "key": "errorCode",
            "label": "Error Code"
      }
];

  return (
    <DataTable
      title="API Transactions"
      apiPath="/api/api-transactions"
      columns={columns}
      color="#fb923c"
    />
  );
}
