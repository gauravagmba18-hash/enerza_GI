import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
      {
            "key": "ratePlanId",
            "label": "ID"
      },
      {
            "key": "planName",
            "label": "Plan Name"
      },
      {
            "key": "utilityType",
            "label": "Utility Type"
      },
      {
            "key": "segmentId",
            "label": "Segment ID"
      },
      {
            "key": "billingFreq",
            "label": "Billing Freq"
      },
      {
            "key": "effectiveFrom",
            "label": "From",
            "type": "date"
      },
      {
            "key": "effectiveTo",
            "label": "To",
            "type": "date"
      },
      {
            "key": "status",
            "label": "Status"
      }
];

  return (
    <DataTable
      title="Rate Plans"
      apiPath="/api/rate-plans"
      columns={columns}
      color="#818cf8"
    />
  );
}
