import { ICommand } from "@/api/src/shared/application";

export interface LoginUserCommand extends ICommand {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: {
    userAgent?: string;
    ip?: string;
    fingerprint?: string;
  };
}
