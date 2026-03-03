import { ICommand } from "@/api/src/shared/application";

export interface AddAddressCommand extends ICommand {
  userId: string;
  type: "billing" | "shipping";
  isDefault?: boolean;
  firstName?: string;
  lastName?: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phone?: string;
}

export interface AddAddressResult {
  addressId: string;
  userId: string;
  created: boolean;
  message: string;
}
