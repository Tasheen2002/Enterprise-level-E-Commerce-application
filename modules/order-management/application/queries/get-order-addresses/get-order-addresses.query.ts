import { IQuery } from "@/api/src/shared/application";

export interface GetOrderAddressesQuery extends IQuery {
  orderId: string;
}

export interface OrderAddressResult {
  orderId: string;
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
  };
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
  };
  isSameAddress: boolean;
}
