import { IQuery } from "@/api/src/shared/application";

export interface GetOrderItemQuery extends IQuery {
  itemId: string;
}

export interface OrderItemResult {
  orderItemId: string;
  orderId: string;
  variantId: string;
  quantity: number;
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
  subtotal: number;
}
