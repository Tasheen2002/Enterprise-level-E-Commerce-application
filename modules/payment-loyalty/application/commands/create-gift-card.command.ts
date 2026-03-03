import { ICommand } from "@/api/src/shared/application";

export interface CreateGiftCardCommand extends ICommand {
  code: string;
  initialBalance: number;
  currency?: string;
  expiresAt?: Date;
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
}
