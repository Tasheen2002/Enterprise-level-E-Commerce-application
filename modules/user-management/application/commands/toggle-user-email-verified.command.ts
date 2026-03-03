import { ICommand } from "@/api/src/shared/application";

export interface ToggleUserEmailVerifiedCommand extends ICommand {
  userId: string;
  isVerified: boolean;
  reason?: string;
}

export interface ToggleUserEmailVerifiedResult {
  userId: string;
  isVerified: boolean;
}
