import { FastifyRequest, FastifyReply } from "fastify";
import {
  AwardLoyaltyPointsCommand,
  AwardLoyaltyPointsHandler,
  RedeemLoyaltyPointsCommand,
  RedeemLoyaltyPointsHandler,
  GetLoyaltyTransactionsQuery,
  GetLoyaltyTransactionsHandler,
} from "../../../application";
import { LoyaltyService } from "../../../application/services/loyalty.service";
import { LoyaltyTransactionService } from "../../../application/services/loyalty-transaction.service";

export interface AwardPointsRequest {
  userId: string;
  programId: string;
  points: number;
  reason: string;
  orderId?: string;
}

export interface RedeemPointsRequest {
  userId: string;
  programId: string;
  points: number;
  orderId: string;
}

export class LoyaltyTransactionController {
  private awardHandler: AwardLoyaltyPointsHandler;
  private redeemHandler: RedeemLoyaltyPointsHandler;
  private listHandler: GetLoyaltyTransactionsHandler;

  constructor(
    private readonly loyaltyService: LoyaltyService,
    private readonly loyaltyTxnService: LoyaltyTransactionService,
  ) {
    this.awardHandler = new AwardLoyaltyPointsHandler(loyaltyService);
    this.redeemHandler = new RedeemLoyaltyPointsHandler(loyaltyService);
    this.listHandler = new GetLoyaltyTransactionsHandler(loyaltyTxnService);
  }

  async award(
    request: FastifyRequest<{ Body: AwardPointsRequest }>,
    reply: FastifyReply,
  ) {
    const cmd: AwardLoyaltyPointsCommand = {
      ...request.body,
      timestamp: new Date(),
    };
    const result = await this.awardHandler.handle(cmd);
    return reply.code(result.success ? 201 : 400).send(result);
  }

  async redeem(
    request: FastifyRequest<{ Body: RedeemPointsRequest }>,
    reply: FastifyReply,
  ) {
    const cmd: RedeemLoyaltyPointsCommand = {
      ...request.body,
      timestamp: new Date(),
    };
    const result = await this.redeemHandler.handle(cmd);
    return reply.code(result.success ? 201 : 400).send(result);
  }

  /**
   * GET /loyalty/transactions/:accountId
   * List loyalty transactions for an account
   */
  async list(
    request: FastifyRequest<{ Params: { accountId: string } }>,
    reply: FastifyReply,
  ) {
    const query: GetLoyaltyTransactionsQuery = {
      accountId: request.params.accountId,
      timestamp: new Date(),
    };
    const result = await this.listHandler.handle(query);
    return reply.code(result.success ? 200 : 400).send(result);
  }
}
