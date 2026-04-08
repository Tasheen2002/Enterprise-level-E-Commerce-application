import { ICommand } from "@/api/src/shared/application";
import { UserStatus } from "../../../domain/entities/user.entity";

export interface UpdateUserStatusCommand extends ICommand {
  userId: string;
  status: UserStatus;
  notes?: string;
}

export interface UpdateUserStatusResult {
  userId: string;
  newStatus: UserStatus;
}
