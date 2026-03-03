import { ICommand } from "@/api/src/shared/application";

export interface VerifyEmailCommand extends ICommand {
  userId: string;
}

export interface VerifyEmailResult {
  userId: string;
  message: string;
}
