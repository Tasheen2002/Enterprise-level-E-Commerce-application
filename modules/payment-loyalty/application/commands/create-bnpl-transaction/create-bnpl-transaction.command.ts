import { ICommand } from "@/api/src/shared/application";
import { BnplPlan } from "../../../domain/entities/bnpl-transaction.entity";

export interface CreateBnplTransactionCommand extends ICommand {
  intentId: string;
  provider: string;
  plan: BnplPlan;
  userId?: string;
}
