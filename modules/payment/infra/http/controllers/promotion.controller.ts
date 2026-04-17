import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreatePromotionHandler,
  ApplyPromotionHandler,
  GetActivePromotionsHandler,
  RecordPromotionUsageHandler,
  GetPromotionUsageHandler,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import { PromotionRule } from "../../../domain/entities/promotion.entity";

export interface CreatePromotionRequest {
  code?: string;
  rule: PromotionRule;
  startsAt?: string;
  endsAt?: string;
  usageLimit?: number;
}

export interface ApplyPromotionRequest {
  promoCode: string;
  orderId?: string;
  orderAmount: number;
  currency?: string;
  products?: string[];
  categories?: string[];
}

export interface RecordPromotionUsageRequest {
  orderId: string;
  discountAmount: number;
  currency?: string;
}

export class PromotionController {
  constructor(
    private readonly createHandler: CreatePromotionHandler,
    private readonly applyHandler: ApplyPromotionHandler,
    private readonly listActiveHandler: GetActivePromotionsHandler,
    private readonly recordUsageHandler: RecordPromotionUsageHandler,
    private readonly listUsageHandler: GetPromotionUsageHandler,
  ) {}

  async create(
    request: FastifyRequest<{ Body: CreatePromotionRequest }>,
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
    request: FastifyRequest<{ Body: ApplyPromotionRequest }>,
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

  async listActive(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await this.listActiveHandler.handle();
      return ResponseHelper.ok(reply, "Active promotions retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async recordUsage(
    request: FastifyRequest<{
      Params: { promoId: string };
      Body: RecordPromotionUsageRequest;
    }>,
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

  async listUsage(
    request: FastifyRequest<{ Params: { promoId: string } }>,
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
}
