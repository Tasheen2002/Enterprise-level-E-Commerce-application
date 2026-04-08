import { ICommand } from "@/api/src/shared/application";

export interface ResetPasswordCommand extends ICommand {
  email: string;
  newPassword: string;
}

export interface ResetPasswordResult {
  email: string;
  message: string;
}
