import { FastifyRequest, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  CreateLoyaltyProgramHandler,
  AwardLoyaltyPointsHandler,
  RedeemLoyaltyPointsHandler,
} from "../../../application/commands";
import {
  GetLoyaltyProgramsHandler,
  GetLoyaltyAccountHandler,
  GetLoyaltyTransactionsHandler,
} from "../../../application/queries";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  EarnRule,
  BurnRule,
  LoyaltyTierConfig,
} from "../../../domain/entities/loyalty-program.entity";
import { LoyaltyTransactionReason } from "../../../domain/enums/loyalty.enums";

export interface CreateLoyaltyProgramRequest {
  name: string;
  earnRules: EarnRule[];
  burnRules: BurnRule[];
  tiers: LoyaltyTierConfig[];
}

export interface GetLoyaltyAccountQuerystring {
  userId: string;
}

export interface AwardPointsRequest {
  userId: string;
  points: number;
  reason: LoyaltyTransactionReason;
  orderId?: string;
  description?: string;
}

export interface RedeemPointsRequest {
  userId: string;
  points: number;
  orderId: string;
  reason?: LoyaltyTransactionReason;
}

export interface ListLoyaltyTransactionsQuerystring {
  accountId?: string;
  orderId?: string;
}

export class LoyaltyController {
  constructor(
    private readonly createProgramHandler: CreateLoyaltyProgramHandler,
    private readonly listProgramsHandler: GetLoyaltyProgramsHandler,
    private readonly getAccountHandler: GetLoyaltyAccountHandler,
    private readonly awardPointsHandler: AwardLoyaltyPointsHandler,
    private readonly redeemPointsHandler: RedeemLoyaltyPointsHandler,
    private readonly listTransactionsHandler: GetLoyaltyTransactionsHandler,
  ) {}

  async createProgram(
    request: FastifyRequest<{ Body: CreateLoyaltyProgramRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.createProgramHandler.handle({
        ...request.body,
        timestamp: new Date(),
      });
      return ResponseHelper.fromCommand(reply, result, "Loyalty program created", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listPrograms(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await this.listProgramsHandler.handle();
      return ResponseHelper.ok(reply, "Loyalty programs retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getAccount(
    request: AuthenticatedRequest<{ Querystring: GetLoyaltyAccountQuerystring }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getAccountHandler.handle({
        userId: request.query.userId,
        timestamp: new Date(),
      });
      return ResponseHelper.ok(reply, "Loyalty account retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async awardPoints(
    request: FastifyRequest<{ Body: AwardPointsRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.awardPointsHandler.handle({
        ...request.body,
        timestamp: new Date(),
      });
      return ResponseHelper.fromCommand(reply, result, "Loyalty points awarded", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async redeemPoints(
    request: FastifyRequest<{ Body: RedeemPointsRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.redeemPointsHandler.handle({
        ...request.body,
        timestamp: new Date(),
      });
      return ResponseHelper.fromCommand(reply, result, "Loyalty points redeemed", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listTransactions(
    request: AuthenticatedRequest<{ Querystring: ListLoyaltyTransactionsQuerystring }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.listTransactionsHandler.handle({
        accountId: request.query.accountId,
        orderId: request.query.orderId,
        timestamp: new Date(),
      });
      return ResponseHelper.ok(reply, "Loyalty transactions retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
