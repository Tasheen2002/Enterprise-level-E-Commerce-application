import { ICommand } from "@/api/src/shared/application";

export interface DeleteAccountCommand extends ICommand {
  userId: string;
  password: string;
  currentAccessToken?: string;
}

export interface DeleteAccountResult {
  deleted: boolean;
  message: string;
}
