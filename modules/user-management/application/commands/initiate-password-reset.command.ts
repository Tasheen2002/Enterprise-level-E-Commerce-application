import { ICommand } from "@/api/src/shared/application";

export interface InitiatePasswordResetCommand extends ICommand {
  email: string;
}

export interface InitiatePasswordResetResult {
  exists: boolean;
  token?: string;
  userId?: string;
  message: string;
}
