import { FastifyRequest, FastifyReply } from "fastify";
import {
  RecordPromotionUsageCommand,
  RecordPromotionUsageHandler,
  GetPromotionUsageQuery,
  GetPromotionUsageHandler,
} from "../../../application";
import { PromotionService } from "../../../application/services/promotion.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export interface RecordPromotionUsageRequest {
  orderId: string;
  discountAmount: number;
  currency?: string;
}

export class PromotionUsageController {
  private recordHandler: RecordPromotionUsageHandler;
  private listHandler: GetPromotionUsageHandler;

  constructor(private readonly promotionService: PromotionService) {
    this.recordHandler = new RecordPromotionUsageHandler(promotionService);
    this.listHandler = new GetPromotionUsageHandler(promotionService);
  }

  async record(
    request: FastifyRequest<{
      Params: { promoId: string };
      Body: RecordPromotionUsageRequest;
    }>,
    reply: FastifyReply,
  ) {
    const { promoId } = request.params;
    const b = request.body;
    const cmd: RecordPromotionUsageCommand = {
      promoId,
      orderId: b.orderId,
      discountAmount: b.discountAmount,
      currency: b.currency,
      timestamp: new Date(),
    };
    const result = await this.recordHandler.handle(cmd);
    return ResponseHelper.fromCommand(
      reply,
      result,
      "Promotion usage recorded",
      201,
    );
  }

  async list(
    request: FastifyRequest<{ Params: { promoId: string } }>,
    reply: FastifyReply,
  ) {
    const q: GetPromotionUsageQuery = {
      promoId: request.params.promoId,
      timestamp: new Date(),
    };
    const result = await this.listHandler.handle(q);
    return ResponseHelper.fromQuery(reply, result, "Promotion usage retrieved");
  }
}
