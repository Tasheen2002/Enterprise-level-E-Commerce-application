import { ICommand } from "@/api/src/shared/application";

export interface ChangeEmailCommand extends ICommand {
  userId: string;
  newEmail: string;
  password: string;
}

export interface ChangeEmailResult {
  userId: string;
  newEmail: string;
  message: string;
}
