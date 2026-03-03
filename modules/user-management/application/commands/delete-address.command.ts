import { ICommand } from "@/api/src/shared/application";

export interface DeleteAddressCommand extends ICommand {
  addressId: string;
  userId: string;
}

export interface DeleteAddressResult {
  addressId: string;
  userId: string;
  deleted: boolean;
  message: string;
}
