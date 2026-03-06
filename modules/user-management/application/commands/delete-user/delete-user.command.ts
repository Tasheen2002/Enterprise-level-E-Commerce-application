import { ICommand } from "@/api/src/shared/application";

export interface DeleteUserCommand extends ICommand {
  userId: string;
}

export interface DeleteUserResult {
  userId: string;
}
