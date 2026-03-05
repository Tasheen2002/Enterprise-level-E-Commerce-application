import { ICommand } from "@/api/src/shared/application";

export interface LogoutCommand extends ICommand {
  token?: string;
  userId?: string;
}

export interface LogoutResult {
  action: string;
}
