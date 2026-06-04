export interface AddressSnapshot {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface OrderItem {
  orderItemId: string;
  id?: string;
  orderId: string;
  variantId: string;
  quantity: number;
  isGift: boolean;
  giftMessage?: string;
  productSnapshot: {
    productId: string;
    variantId: string;
    sku: string;
    name: string;
    price: number;
  };
}

export interface OrderAddress {
  orderId: string;
  billingAddress: AddressSnapshot;
  shippingAddress: AddressSnapshot;
}

export interface OrderShipment {
  id: string;
  orderId: string;
  carrier?: string;
  service?: string;
  trackingNo?: string;
  giftReceipt: boolean;
  pickupLocationId?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export interface OrderTotals {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  guestToken?: string;
  items: OrderItem[];
  address?: OrderAddress;
  shipments: OrderShipment[];
  totals: OrderTotals;
  status: string;
  source: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  guestToken?: string;
  items: Array<{
    variantId: string;
    quantity: number;
    isGift?: boolean;
    giftMessage?: string;
  }>;
  shippingAddress: AddressSnapshot;
  billingAddress?: AddressSnapshot;
  source?: string;
  currency?: string;
}

export interface TrackOrderResult {
  orderId: string;
  orderNumber: string;
  status: string;
  items: OrderItem[];
  totals: OrderTotals;
  shipments: OrderShipment[];
  billingAddress: AddressSnapshot | Record<string, never>;
  shippingAddress: AddressSnapshot | Record<string, never>;
  createdAt: string;
  updatedAt: string;
}

export interface ListOrdersResult {
  items: Order[];
  total: number;
}

export interface OrderStatusHistoryEntry {
  id: string;
  orderId: string;
  fromStatus?: string;
  toStatus: string;
  changedAt: string;
  changedBy?: string;
}

export interface OrderEventEntry {
  id: string;
  orderId: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
}
