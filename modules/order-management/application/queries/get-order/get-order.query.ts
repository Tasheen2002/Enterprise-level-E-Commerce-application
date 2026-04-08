import { IQuery } from "@/api/src/shared/application";

export interface GetOrderQuery extends IQuery {
  orderId?: string;
  orderNumber?: string;
}

export interface OrderResult {
  orderId: string;
  orderNumber: string;
  userId?: string;
  guestToken?: string;
  items: Array<{
    orderItemId: string;
    variantId: string;
    quantity: number;
    subtotal: number;
    productSnapshot: {
      productId: string;
      variantId: string;
      sku: string;
      name: string;
      variantName?: string;
      price: number;
      imageUrl?: string;
      weight?: number;
      dimensions?: {
        length: number;
        width: number;
        height: number;
      };
      attributes?: Record<string, any>;
    };
    isGift: boolean;
    giftMessage?: string;
  }>;
  totals: {
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
  };
  billingAddress: {
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
  } | null;
  shippingAddress: {
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
  } | null;
  shipments: Array<{
    shipmentId: string;
    carrier: string;
    service: string;
    trackingNumber?: string;
    shippedAt?: Date;
    deliveredAt?: Date;
  }>;
  status: string;
  source: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}
