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
  GetPaymentTransactionsQuery,
  GetPaymentTransactionsHandler,
} from "../../../application";
import { PaymentService } from "../../../application/services/payment.service";

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

export class PaymentIntentController {
  private createHandler: CreatePaymentIntentHandler;
  private processHandler: ProcessPaymentHandler;
  private refundHandler: RefundPaymentHandler;
  private voidHandler: VoidPaymentHandler;
  private getHandler: GetPaymentIntentHandler;
  private txnsHandler: GetPaymentTransactionsHandler;

  constructor(private readonly paymentService: PaymentService) {
    this.createHandler = new CreatePaymentIntentHandler(paymentService);
    this.processHandler = new ProcessPaymentHandler(paymentService);
    this.refundHandler = new RefundPaymentHandler(paymentService);
    this.voidHandler = new VoidPaymentHandler(paymentService);
    this.getHandler = new GetPaymentIntentHandler(paymentService);
    this.txnsHandler = new GetPaymentTransactionsHandler(paymentService);
  }

  async create(
    request: FastifyRequest<{ Body: CreatePaymentIntentRequest }>,
    reply: FastifyReply,
  ) {
    const userId = (request as any).user?.userId;
    if (!userId) {
      return reply
        .code(401)
        .send({ success: false, error: "Authentication required" });
    }

    const cmd: CreatePaymentIntentCommand = {
      ...request.body,
      userId,
      timestamp: new Date(),
    };
    const result = await this.createHandler.handle(cmd);
    return reply.code(result.success ? 201 : 400).send(result);
  }

  async process(
    request: FastifyRequest<{ Body: ProcessPaymentRequest }>,
    reply: FastifyReply,
  ) {
    const userId = (request as any).user?.userId;
    if (!userId) {
      return reply
        .code(401)
        .send({ success: false, error: "Authentication required" });
    }

    const cmd: ProcessPaymentCommand = {
      ...request.body,
      userId,
      timestamp: new Date(),
    };
    const result = await this.processHandler.handle(cmd);
    return reply.code(result.success ? 200 : 400).send(result);
  }

  async refund(
    request: FastifyRequest<{ Body: RefundPaymentRequest }>,
    reply: FastifyReply,
  ) {
    const userId = (request as any).user?.userId;
    if (!userId) {
      return reply
        .code(401)
        .send({ success: false, error: "Authentication required" });
    }

    const cmd: RefundPaymentCommand = {
      ...request.body,
      userId,
      timestamp: new Date(),
    };
    const result = await this.refundHandler.handle(cmd);
    return reply.code(result.success ? 200 : 400).send(result);
  }

  async void(
    request: FastifyRequest<{ Body: VoidPaymentRequest }>,
    reply: FastifyReply,
  ) {
    const userId = (request as any).user?.userId;
    if (!userId) {
      return reply
        .code(401)
        .send({ success: false, error: "Authentication required" });
    }

    const cmd: VoidPaymentCommand = {
      ...request.body,
      userId,
      timestamp: new Date(),
    };
    const result = await this.voidHandler.handle(cmd);
    return reply.code(result.success ? 200 : 400).send(result);
  }

  async get(
    request: FastifyRequest<{
      Querystring: { intentId?: string; orderId?: string };
    }>,
    reply: FastifyReply,
  ) {
    const userId = (request as any).user?.userId;
    if (!userId) {
      return reply
        .code(401)
        .send({ success: false, error: "Authentication required" });
    }

    const query: GetPaymentIntentQuery = {
      intentId: request.query.intentId,
      orderId: request.query.orderId,
      userId,
      timestamp: new Date(),
    };
    const result = await this.getHandler.handle(query);
    return reply.code(result.success ? 200 : 404).send(result);
  }

  async listTransactions(
    request: FastifyRequest<{ Params: { intentId: string } }>,
    reply: FastifyReply,
  ) {
    const userId = (request as any).user?.userId;
    if (!userId) {
      return reply
        .code(401)
        .send({ success: false, error: "Authentication required" });
    }

    const q: GetPaymentTransactionsQuery = {
      intentId: request.params.intentId,
      userId,
      timestamp: new Date(),
    };
    const result = await this.txnsHandler.handle(q);
    return reply.code(result.success ? 200 : 400).send(result);
  }
}
