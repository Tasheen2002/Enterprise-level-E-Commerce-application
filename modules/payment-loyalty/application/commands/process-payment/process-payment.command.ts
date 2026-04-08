import { ICommand } from "@/api/src/shared/application";

export interface ProcessPaymentCommand extends ICommand {
  intentId: string;
  pspReference?: string;
  userId?: string;
}
