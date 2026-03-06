import { ICommand } from "@/api/src/shared/application";

export interface TransferCartCommand extends ICommand {
  guestToken: string;
  userId: string;
  mergeWithExisting?: boolean;
}
