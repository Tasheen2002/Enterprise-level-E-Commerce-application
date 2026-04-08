import { ICommand } from "@/api/src/shared/application";

export interface CreatePaymentIntentCommand extends ICommand {
  orderId: string;
  provider: string;
  amount: number;
  currency?: string;
  idempotencyKey?: string;
  clientSecret?: string;
  userId?: string;
}
