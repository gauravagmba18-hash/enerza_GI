import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "credentialId",
            "label": "ID"
      },
      {
            "key": "partnerId",
            "label": "Partner ID"
      },
      {
            "key": "clientId",
            "label": "Client ID"
      },
      {
            "key": "ipWhitelist",
            "label": "IP Whitelist"
      },
      {
            "key": "tokenExpiry",
            "label": "Token Expiry",
            "type": "date"
      }
];

  return (
    <DataTable
      title="API Credentials"
      apiPath="/api/api-credentials"
      columns={columns}
      color="#fb923c"
    />
  );
}
