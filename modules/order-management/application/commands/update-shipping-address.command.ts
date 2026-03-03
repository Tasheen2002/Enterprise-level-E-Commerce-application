import { ICommand } from "@/api/src/shared/application";

export interface UpdateShippingAddressCommand extends ICommand {
  orderId: string;
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
}
