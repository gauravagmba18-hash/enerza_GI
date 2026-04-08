import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "segmentId",
            "label": "ID"
      },
      {
            "key": "segmentName",
            "label": "Segment Name"
      },
      {
            "key": "utilityType",
            "label": "Utility Type"
      },
      {
            "key": "description",
            "label": "Description"
      }
];

  return (
    <DataTable
      title="Consumer Segments"
      apiPath="/api/consumer-segments"
      columns={columns}
      color="#06b6d4"
    />
  );
}
