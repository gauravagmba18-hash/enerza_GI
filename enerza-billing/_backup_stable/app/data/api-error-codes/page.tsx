import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "errorCode",
            "label": "Error Code"
      },
      {
            "key": "httpStatus",
            "label": "HTTP Status",
            "type": "number"
      },
      {
            "key": "message",
            "label": "Message"
      },
      {
            "key": "retryable",
            "label": "Retryable?",
            "type": "boolean"
      },
      {
            "key": "category",
            "label": "Category"
      }
];

  return (
    <DataTable
      title="API Error Codes"
      apiPath="/api/api-error-codes"
      columns={columns}
      color="#fb923c"
    />
  );
}
