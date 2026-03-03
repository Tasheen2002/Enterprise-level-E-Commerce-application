import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreateGiftCardCommand,
  CreateGiftCardHandler,
  RedeemGiftCardCommand,
  RedeemGiftCardHandler,
  GetGiftCardBalanceQuery,
  GetGiftCardBalanceHandler,
  GetGiftCardTransactionsQuery,
  GetGiftCardTransactionsHandler,
} from "../../../application";
import { GiftCardService } from "../../../application/services/gift-card.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export interface CreateGiftCardRequest {
  code: string;
  initialBalance: number;
  currency?: string;
  expiresAt?: string;
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
}

export interface RedeemGiftCardRequest {
  amount: number;
  orderId: string;
}

export class GiftCardController {
  private createHandler: CreateGiftCardHandler;
  private redeemHandler: RedeemGiftCardHandler;
  private balanceHandler: GetGiftCardBalanceHandler;
  private txnsHandler: GetGiftCardTransactionsHandler;

  constructor(private readonly giftCardService: GiftCardService) {
    this.createHandler = new CreateGiftCardHandler(giftCardService);
    this.redeemHandler = new RedeemGiftCardHandler(giftCardService);
    this.balanceHandler = new GetGiftCardBalanceHandler(giftCardService);
    this.txnsHandler = new GetGiftCardTransactionsHandler(giftCardService);
  }

  async create(
    request: FastifyRequest<{ Body: CreateGiftCardRequest }>,
    reply: FastifyReply,
  ) {
    const userId = (request as any).user?.userId;
    if (!userId) {
      return ResponseHelper.unauthorized(reply, "Authentication required");
    }

    const body = request.body;
    const cmd: CreateGiftCardCommand = {
      code: body.code,
      initialBalance: body.initialBalance,
      currency: body.currency,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      recipientEmail: body.recipientEmail,
      recipientName: body.recipientName,
      message: body.message,
      timestamp: new Date(),
    };
    const result = await this.createHandler.handle(cmd);
    return ResponseHelper.fromCommand(reply, result, "Gift card created", 201);
  }

  async redeem(
    request: FastifyRequest<{
      Params: { giftCardId: string };
      Body: RedeemGiftCardRequest;
    }>,
    reply: FastifyReply,
  ) {
    const userId = (request as any).user?.userId;
    if (!userId) {
      return ResponseHelper.unauthorized(reply, "Authentication required");
    }

    const { giftCardId } = request.params;
    const body = request.body;
    const cmd: RedeemGiftCardCommand = {
      giftCardId,
      amount: body.amount,
      orderId: body.orderId,
      userId,
      timestamp: new Date(),
    };
    const result = await this.redeemHandler.handle(cmd);
    return ResponseHelper.fromCommand(reply, result, "Gift card redeemed");
  }

  async getBalance(
    request: FastifyRequest<{ Querystring: { codeOrId: string } }>,
    reply: FastifyReply,
  ) {
    const query: GetGiftCardBalanceQuery = {
      codeOrId: request.query.codeOrId,
      timestamp: new Date(),
    };
    const result = await this.balanceHandler.handle(query);
    return ResponseHelper.fromQuery(
      reply,
      result,
      "Gift card balance retrieved",
      "Gift card not found",
    );
  }

  async getTransactions(
    request: FastifyRequest<{ Params: { giftCardId: string } }>,
    reply: FastifyReply,
  ) {
    const query: GetGiftCardTransactionsQuery = {
      giftCardId: request.params.giftCardId,
      timestamp: new Date(),
    };
    const result = await this.txnsHandler.handle(query);
    return ResponseHelper.fromQuery(
      reply,
      result,
      "Gift card transactions retrieved",
    );
  }
}
