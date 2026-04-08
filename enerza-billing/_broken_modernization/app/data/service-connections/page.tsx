import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "connectionId",
            "label": "ID"
      },
      {
            "key": "accountId",
            "label": "Account ID"
      },
      {
            "key": "segmentId",
            "label": "Segment ID"
      },
      {
            "key": "utilityType",
            "label": "Utility Type"
      },
      {
            "key": "startDate",
            "label": "Start Date",
            "type": "date"
      },
      {
            "key": "endDate",
            "label": "End Date",
            "type": "date"
      },
      {
            "key": "status",
            "label": "Status"
      }
];

  return (
    <DataTable
      title="Service Connections"
      apiPath="/api/service-connections"
      columns={columns}
      color="#06b6d4"
    />
  );
}
