import { ICommand } from "@/api/src/shared/application";

export interface ChangePasswordCommand extends ICommand {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResult {
  userId: string;
  message: string;
}
