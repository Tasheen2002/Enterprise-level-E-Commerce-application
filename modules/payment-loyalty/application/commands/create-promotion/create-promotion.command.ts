import { ICommand } from "@/api/src/shared/application";
import { PromotionRule } from "../../../domain/entities/promotion.entity";

export interface CreatePromotionCommand extends ICommand {
  code?: string;
  rule: PromotionRule;
  startsAt?: Date;
  endsAt?: Date;
  usageLimit?: number;
}
