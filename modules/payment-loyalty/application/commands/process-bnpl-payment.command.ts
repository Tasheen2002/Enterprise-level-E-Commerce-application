import { ICommand } from "@/api/src/shared/application";

type BnplAction = "approve" | "reject" | "activate" | "complete" | "cancel";

export interface ProcessBnplPaymentCommand extends ICommand {
  bnplId: string;
  action: BnplAction;
  userId?: string;
}
