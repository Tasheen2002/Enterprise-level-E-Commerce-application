import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreatePaymentIntentCommand,
  CreatePaymentIntentHandler,
  ProcessPaymentCommand,
  ProcessPaymentHandler,
  RefundPaymentCommand,
  RefundPaymentHandler,
  VoidPaymentCommand,
  VoidPaymentHandler,
  GetPaymentIntentQuery,
  GetPaymentIntentHandler,
} from "../../../application";
import { PaymentService } from "../../../application/services/payment.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export interface CreatePaymentIntentRequest {
  orderId: string;
  provider: string;
  amount: number;
  currency?: string;
  idempotencyKey?: string;
  clientSecret?: string;
}
export interface ProcessPaymentRequest {
  intentId: string;
  pspReference?: string;
}
export interface RefundPaymentRequest {
  intentId: string;
  amount?: number;
  reason?: string;
}
export interface VoidPaymentRequest {
  intentId: string;
  pspReference?: string;
}
export interface GetPaymentIntentQuerystring {
  intentId?: string;
  orderId?: string;
}

export class PaymentIntentController {
  private createHandler: CreatePaymentIntentHandler;
  private processHandler: ProcessPaymentHandler;
  private refundHandler: RefundPaymentHandler;
  private voidHandler: VoidPaymentHandler;
  private getHandler: GetPaymentIntentHandler;

  constructor(private readonly paymentService: PaymentService) {
    this.createHandler = new CreatePaymentIntentHandler(paymentService);
    this.processHandler = new ProcessPaymentHandler(paymentService);
    this.refundHandler = new RefundPaymentHandler(paymentService);
    this.voidHandler = new VoidPaymentHandler(paymentService);
    this.getHandler = new GetPaymentIntentHandler(paymentService);
  }

  async create(
    request: FastifyRequest<{ Body: CreatePaymentIntentRequest }>,
    reply: FastifyReply,
  ) {
    const userId = (request as any).user?.userId;
    if (!userId) {
      return ResponseHelper.unauthorized(reply, "Authentication required");
    }

    const cmd: CreatePaymentIntentCommand = {
      ...request.body,
      userId,
      timestamp: new Date(),
    };
    const result = await this.createHandler.handle(cmd);
    return ResponseHelper.fromCommand(
      reply,
      result,
      "Payment intent created",
      201,
    );
  }

  async process(
    request: FastifyRequest<{ Body: ProcessPaymentRequest }>,
    reply: FastifyReply,
  ) {
    const userId = (request as any).user?.userId;
    if (!userId) {
      return ResponseHelper.unauthorized(reply, "Authentication required");
    }

    const cmd: ProcessPaymentCommand = {
      ...request.body,
      userId,
      timestamp: new Date(),
    };
    const result = await this.processHandler.handle(cmd);
    return ResponseHelper.fromCommand(reply, result, "Payment processed");
  }

  async refund(
    request: FastifyRequest<{ Body: RefundPaymentRequest }>,
    reply: FastifyReply,
  ) {
    const userId = (request as any).user?.userId;
    if (!userId) {
      return ResponseHelper.unauthorized(reply, "Authentication required");
    }

    const cmd: RefundPaymentCommand = {
      ...request.body,
      userId,
      timestamp: new Date(),
    };
    const result = await this.refundHandler.handle(cmd);
    return ResponseHelper.fromCommand(reply, result, "Payment refunded");
  }

  async void(
    request: FastifyRequest<{ Body: VoidPaymentRequest }>,
    reply: FastifyReply,
  ) {
    const userId = (request as any).user?.userId;
    if (!userId) {
      return ResponseHelper.unauthorized(reply, "Authentication required");
    }

    const cmd: VoidPaymentCommand = {
      ...request.body,
      userId,
      timestamp: new Date(),
    };
    const result = await this.voidHandler.handle(cmd);
    return ResponseHelper.fromCommand(reply, result, "Payment voided");
  }

  async get(
    request: FastifyRequest<{ Querystring: GetPaymentIntentQuerystring }>,
    reply: FastifyReply,
  ) {
    const userId = (request as any).user?.userId;
    if (!userId) {
      return ResponseHelper.unauthorized(reply, "Authentication required");
    }

    const query: GetPaymentIntentQuery = {
      intentId: request.query.intentId,
      orderId: request.query.orderId,
      userId,
      timestamp: new Date(),
    };
    const result = await this.getHandler.handle(query);
    return ResponseHelper.fromQuery(
      reply,
      result,
      "Payment intent retrieved",
      "Payment intent not found",
    );
  }
}
