import { IQuery } from "@/api/src/shared/application";

export interface ListAddressesQuery extends IQuery {
  userId: string;
  type?: "billing" | "shipping";
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface AddressListItem {
  addressId: string;
  userId: string;
  type: string;
  isDefault: boolean;
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
  createdAt: Date;
}

export interface ListAddressesResult {
  userId: string;
  addresses: AddressListItem[];
  totalCount: number;
}
