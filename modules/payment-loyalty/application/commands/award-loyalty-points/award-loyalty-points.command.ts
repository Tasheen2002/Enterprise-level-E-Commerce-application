import { ICommand } from "@/api/src/shared/application";

export interface AwardLoyaltyPointsCommand extends ICommand {
  userId: string;
  programId: string;
  points: number;
  reason: string;
  orderId?: string;
}
