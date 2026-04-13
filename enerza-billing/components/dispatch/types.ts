export type DispatchItem = {
  type: "TICKET" | "SR";
  id: string;
  subject: string;
  status: string;
  priority: string;
  category?: string;
  accountId?: string | null;
  customerName: string;
  technicianId?: string | null;
  technicianName?: string | null;
  workOrderId?: string | null;
  slaBreached: boolean;
  sparesHeld: boolean;
  createdAt: string;
};

export type DispatchKpis = {
  pending: number;
  onVisit: number;
  resolved: number;
  slaBreach: number;
  sparesHeld: number;
};

export type CriticalSpare = {
  itemId: string;
  itemName: string;
  quantityOnHand: number;
  minLevel: number;
};

export type DispatchSummary = {
  kpis: DispatchKpis;
  items: DispatchItem[];
  criticalSpares: CriticalSpare[];
};

export type WorkOrderDetail = {
  workOrderId: string;
  ticketId?: string | null;
  status: string;
  startedAt?: string | null;
  completedAt?: string | null;
  inspectionNotes?: string | null;
  resolutionNotes?: string | null;
  scheduledDate?: string | null;
  technician?: { fullName: string; mobile: string } | null;
  ticket?: { subject: string; account?: { customer?: { fullName: string } | null } | null } | null;
  spares: { usageId: string; quantity: number; item: { itemId: string; itemName: string; unitCost: number } }[];
};
