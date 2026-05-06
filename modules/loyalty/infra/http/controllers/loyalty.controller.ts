import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  CreateLoyaltyProgramHandler,
  AwardLoyaltyPointsHandler,
  RedeemLoyaltyPointsHandler,
  AdjustLoyaltyPointsHandler,
} from "../../../application/commands";
import {
  GetLoyaltyProgramsHandler,
  GetLoyaltyAccountHandler,
  GetLoyaltyTransactionsHandler,
} from "../../../application/queries";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import { LoyaltyTransactionReasonValue } from "../../../domain/value-objects/loyalty-reason.vo";
import {
  CreateLoyaltyProgramBody,
  AwardPointsBody,
  RedeemPointsBody,
  AdjustPointsBody,
  GetAccountQuery,
  ListTransactionsQuery,
} from "../validation/loyalty.schema";

export class LoyaltyController {
  constructor(
    private readonly createProgramHandler: CreateLoyaltyProgramHandler,
    private readonly listProgramsHandler: GetLoyaltyProgramsHandler,
    private readonly getAccountHandler: GetLoyaltyAccountHandler,
    private readonly awardPointsHandler: AwardLoyaltyPointsHandler,
    private readonly redeemPointsHandler: RedeemLoyaltyPointsHandler,
    private readonly adjustPointsHandler: AdjustLoyaltyPointsHandler,
    private readonly listTransactionsHandler: GetLoyaltyTransactionsHandler,
  ) {}

  async listPrograms(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const result = await this.listProgramsHandler.handle({ timestamp: new Date() });
      return ResponseHelper.ok(reply, "Loyalty programs retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getAccount(
    request: AuthenticatedRequest<{ Querystring: GetAccountQuery }>,
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

  async listTransactions(
    request: AuthenticatedRequest<{ Querystring: ListTransactionsQuery }>,
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

  async createProgram(
    request: AuthenticatedRequest<{ Body: CreateLoyaltyProgramBody }>,
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

  async awardPoints(
    request: AuthenticatedRequest<{ Body: AwardPointsBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.awardPointsHandler.handle({
        ...request.body,
        reason: request.body.reason as LoyaltyTransactionReasonValue,
        timestamp: new Date(),
      });
      return ResponseHelper.fromCommand(reply, result, "Loyalty points awarded", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async redeemPoints(
    request: AuthenticatedRequest<{ Body: RedeemPointsBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.redeemPointsHandler.handle({
        ...request.body,
        reason: request.body.reason as LoyaltyTransactionReasonValue | undefined,
        timestamp: new Date(),
      });
      return ResponseHelper.fromCommand(reply, result, "Loyalty points redeemed", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async adjustPoints(
    request: AuthenticatedRequest<{ Body: AdjustPointsBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.adjustPointsHandler.handle({
        ...request.body,
        timestamp: new Date(),
      });
      return ResponseHelper.fromCommand(reply, result, "Loyalty points adjusted", 200);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
