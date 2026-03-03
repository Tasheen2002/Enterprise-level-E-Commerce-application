import { ICommand } from "@/api/src/shared/application";

export interface RedeemLoyaltyPointsCommand extends ICommand {
  userId: string;
  programId: string;
  points: number;
  orderId: string;
}
