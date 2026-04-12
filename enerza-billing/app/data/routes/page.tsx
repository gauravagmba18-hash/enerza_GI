import { DataTable } from "@/components/ui/DataTable";

export default function Page() {
  const columns = [
    { key: "routeName",       label: "Route Name" },
    { key: "areaName",        label: "Area" },
    { key: "location",        label: "City / District" },
    { key: "cycleName",       label: "Billing Cycle" },
    { key: "readDateRule",    label: "Read Day" },
    { key: "connectionCount", label: "Connections" },
    { key: "status",          label: "Status" },
  ];

  return (
    <DataTable
      title="Routes"
      description="Predefined reading routes — each route covers an area and billing cycle"
      apiPath="/api/routes"
      columns={columns}
      color="#f59e0b"
    />
  );
}
