export interface Contact {
  name?: string;
  email?: string;
  phone?: string;
}

export interface Supplier {
  supplierId: string;
  name: string;
  leadTimeDays?: number | null;
  contacts?: Contact[] | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface POItem {
  poId: string;
  variantId: string;
  orderedQty: number;
  receivedQty: number;
  remainingQty: number;
  isFullyReceived: boolean;
  isPartiallyReceived: boolean;
}

export interface PurchaseOrder {
  poId: string;
  supplierId: string;
  status: "draft" | "sent" | "part_received" | "received" | "cancelled";
  eta?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  locationId?: string;
  name: string;
  type: "warehouse" | "store" | "vendor";
  createdAt?: string;
  updatedAt?: string;
}

export interface Stock {
  id: string;
  variantId: string;
  locationId: string;
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  safetyStock?: number;
  updatedAt: string;
}
