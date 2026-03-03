import { FastifyRequest, FastifyReply } from "fastify";
import {
  GetLoyaltyAccountQuery,
  GetLoyaltyAccountHandler,
} from "../../../application";
import { LoyaltyService } from "../../../application/services/loyalty.service";

export class LoyaltyAccountController {
  private getHandler: GetLoyaltyAccountHandler;

  constructor(private readonly loyaltyService: LoyaltyService) {
    this.getHandler = new GetLoyaltyAccountHandler(loyaltyService);
  }

  /**
   * GET /loyalty/accounts/:userId/:programId
   * Get loyalty account for a user in a specific program
   */
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
    return reply.code(result.success ? 200 : 404).send(result);
  }
}
