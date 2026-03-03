import { ICommand } from "@/api/src/shared/application";
import {
  LoyaltyTier,
  EarnRule,
  BurnRule,
} from "../../domain/entities/loyalty-program.entity";

export interface CreateLoyaltyProgramCommand extends ICommand {
  name: string;
  earnRules: EarnRule | EarnRule[];
  burnRules: BurnRule | BurnRule[];
  tiers: LoyaltyTier[];
}
