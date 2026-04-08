import { ICommand } from "@/api/src/shared/application";

export interface VoidPaymentCommand extends ICommand {
  intentId: string;
  pspReference?: string;
  userId?: string;
}
