import { ICommand } from "@/api/src/shared/application";
import { UserRole } from "../../../domain/entities/user.entity";

export interface RegisterUserCommand extends ICommand {
  email: string;
  password: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}
