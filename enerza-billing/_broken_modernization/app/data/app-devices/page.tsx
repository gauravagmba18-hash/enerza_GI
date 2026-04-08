import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "deviceId",
            "label": "ID"
      },
      {
            "key": "appUserId",
            "label": "User ID"
      },
      {
            "key": "osType",
            "label": "OS Type"
      },
      {
            "key": "appVersion",
            "label": "App Version"
      },
      {
            "key": "deviceFingerprint",
            "label": "Fingerprint"
      },
      {
            "key": "active",
            "label": "Active?",
            "type": "boolean"
      }
];

  return (
    <DataTable
      title="App Devices"
      apiPath="/api/app-devices"
      columns={columns}
      color="#f472b6"
    />
  );
}
