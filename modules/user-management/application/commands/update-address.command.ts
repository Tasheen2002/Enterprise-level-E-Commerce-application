import { ICommand } from "@/api/src/shared/application";

export interface UpdateAddressCommand extends ICommand {
  addressId: string;
  userId: string;
  type?: "billing" | "shipping";
  isDefault?: boolean;
  firstName?: string;
  lastName?: string;
  company?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
}

export interface UpdateAddressResult {
  addressId: string;
  userId: string;
  updated: boolean;
  message: string;
}
