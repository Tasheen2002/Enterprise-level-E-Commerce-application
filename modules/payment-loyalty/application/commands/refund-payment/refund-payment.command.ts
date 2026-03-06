import { ICommand } from "@/api/src/shared/application";

export interface RefundPaymentCommand extends ICommand {
  intentId: string;
  amount?: number;
  reason?: string;
  userId?: string;
}
