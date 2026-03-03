import { ICommand } from "@/api/src/shared/application";
import { UserRole } from "../../domain/entities/user.entity";

export interface UpdateUserRoleCommand extends ICommand {
  userId: string;
  role: UserRole;
  reason?: string;
}

export interface UpdateUserRoleResult {
  userId: string;
  newRole: UserRole;
}
