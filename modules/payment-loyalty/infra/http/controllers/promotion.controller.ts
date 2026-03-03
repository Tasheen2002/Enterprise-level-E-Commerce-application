import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreatePromotionCommand,
  CreatePromotionHandler,
  ApplyPromotionCommand,
  ApplyPromotionHandler,
  GetActivePromotionsQuery,
  GetActivePromotionsHandler,
} from "../../../application";
import { PromotionService } from "../../../application/services/promotion.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export interface CreatePromotionRequest {
  code?: string;
  rule: any;
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

export class PromotionController {
  private createHandler: CreatePromotionHandler;
  private applyHandler: ApplyPromotionHandler;
  private listActiveHandler: GetActivePromotionsHandler;

  constructor(private readonly promotionService: PromotionService) {
    this.createHandler = new CreatePromotionHandler(promotionService);
    this.applyHandler = new ApplyPromotionHandler(promotionService);
    this.listActiveHandler = new GetActivePromotionsHandler(promotionService);
  }

  async create(
    request: FastifyRequest<{ Body: CreatePromotionRequest }>,
    reply: FastifyReply,
  ) {
    const b = request.body;
    const cmd: CreatePromotionCommand = {
      code: b.code,
      rule: b.rule,
      startsAt: b.startsAt ? new Date(b.startsAt) : undefined,
      endsAt: b.endsAt ? new Date(b.endsAt) : undefined,
      usageLimit: b.usageLimit,
      timestamp: new Date(),
    };
    const result = await this.createHandler.handle(cmd);
    return ResponseHelper.fromCommand(reply, result, "Promotion created", 201);
  }

  async apply(
    request: FastifyRequest<{ Body: ApplyPromotionRequest }>,
    reply: FastifyReply,
  ) {
    const cmd: ApplyPromotionCommand = {
      ...request.body,
      timestamp: new Date(),
    };
    const result = await this.applyHandler.handle(cmd);
    return ResponseHelper.fromCommand(reply, result, "Promotion applied");
  }

  async listActive(_req: FastifyRequest, reply: FastifyReply) {
    const result = await this.listActiveHandler.handle({
      timestamp: new Date(),
    });
    return ResponseHelper.fromQuery(
      reply,
      result,
      "Active promotions retrieved",
    );
  }
}
