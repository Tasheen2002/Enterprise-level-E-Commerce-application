import { FastifyRequest, FastifyReply } from "fastify";
import {
  GetLoyaltyAccountQuery,
  GetLoyaltyAccountHandler,
} from "../../../application";
import { LoyaltyService } from "../../../application/services/loyalty.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export interface GetLoyaltyAccountQuerystring {
  userId: string;
  programId: string;
}

export class LoyaltyAccountController {
  private getHandler: GetLoyaltyAccountHandler;

  constructor(private readonly loyaltyService: LoyaltyService) {
    this.getHandler = new GetLoyaltyAccountHandler(loyaltyService);
  }

  async get(
    request: FastifyRequest<{ Querystring: GetLoyaltyAccountQuerystring }>,
    reply: FastifyReply,
  ) {
    const { userId, programId } = request.query;
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
