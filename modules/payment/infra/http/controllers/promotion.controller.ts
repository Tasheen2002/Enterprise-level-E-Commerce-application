import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  CreatePromotionHandler,
  ApplyPromotionHandler,
  GetActivePromotionsHandler,
  RecordPromotionUsageHandler,
  GetPromotionUsageHandler,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  CreatePromotionBody,
  ApplyPromotionBody,
  RecordPromotionUsageBody,
  PromoIdParams,
} from "../validation/promotion.schema";

export class PromotionController {
  constructor(
    private readonly createHandler: CreatePromotionHandler,
    private readonly applyHandler: ApplyPromotionHandler,
    private readonly listActiveHandler: GetActivePromotionsHandler,
    private readonly recordUsageHandler: RecordPromotionUsageHandler,
    private readonly listUsageHandler: GetPromotionUsageHandler,
  ) {}

  async listActive(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const result = await this.listActiveHandler.handle({ timestamp: new Date() });
      return ResponseHelper.ok(reply, "Active promotions retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listUsage(
    request: AuthenticatedRequest<{ Params: PromoIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.listUsageHandler.handle({
        promoId: request.params.promoId,
        timestamp: new Date(),
      });
      return ResponseHelper.ok(reply, "Promotion usage retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async create(
    request: AuthenticatedRequest<{ Body: CreatePromotionBody }>,
    reply: FastifyReply,
  ) {
    try {
      const b = request.body;
      const result = await this.createHandler.handle({
        code: b.code,
        rule: b.rule,
        startsAt: b.startsAt ? new Date(b.startsAt) : undefined,
        endsAt: b.endsAt ? new Date(b.endsAt) : undefined,
        usageLimit: b.usageLimit,
        timestamp: new Date(),
      });
      return ResponseHelper.fromCommand(reply, result, "Promotion created", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async apply(
    request: AuthenticatedRequest<{ Body: ApplyPromotionBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.applyHandler.handle({
        ...request.body,
        timestamp: new Date(),
      });
      return ResponseHelper.fromCommand(reply, result, "Promotion applied");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async recordUsage(
    request: AuthenticatedRequest<{ Params: PromoIdParams; Body: RecordPromotionUsageBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.recordUsageHandler.handle({
        promoId: request.params.promoId,
        orderId: request.body.orderId,
        discountAmount: request.body.discountAmount,
        currency: request.body.currency,
        timestamp: new Date(),
      });
      return ResponseHelper.fromCommand(reply, result, "Promotion usage recorded", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
