import { FastifyRequest, FastifyReply } from "fastify";
import {
  GetLoyaltyAccountQuery,
  GetLoyaltyAccountHandler,
} from "../../../application";
import { LoyaltyService } from "../../../application/services/loyalty.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export class LoyaltyAccountController {
  private getHandler: GetLoyaltyAccountHandler;

  constructor(private readonly loyaltyService: LoyaltyService) {
    this.getHandler = new GetLoyaltyAccountHandler(loyaltyService);
  }

  async get(
    request: FastifyRequest<{ Params: { userId: string; programId: string } }>,
    reply: FastifyReply,
  ) {
    const { userId, programId } = request.params;
    const query: GetLoyaltyAccountQuery = {
      userId,
      programId,
      timestamp: new Date(),
    };
    const result = await this.getHandler.handle(query);
    return ResponseHelper.fromQuery(
      reply,
      result,
      "Loyalty account retrieved",
      "Loyalty account not found",
    );
  }
}
