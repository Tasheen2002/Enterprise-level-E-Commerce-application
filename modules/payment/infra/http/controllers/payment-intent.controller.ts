import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  CreatePaymentIntentHandler,
  ProcessPaymentHandler,
  RefundPaymentHandler,
  VoidPaymentHandler,
  GetPaymentIntentHandler,
  GetPaymentTransactionsHandler,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  CreatePaymentIntentBody,
  ProcessPaymentBody,
  RefundPaymentBody,
  VoidPaymentBody,
  GetPaymentIntentQuery,
  IntentIdParams,
} from "../validation/payment-intent.schema";

export class PaymentIntentController {
  constructor(
    private readonly createHandler: CreatePaymentIntentHandler,
    private readonly processHandler: ProcessPaymentHandler,
    private readonly refundHandler: RefundPaymentHandler,
    private readonly voidHandler: VoidPaymentHandler,
    private readonly getHandler: GetPaymentIntentHandler,
    private readonly listTransactionsHandler: GetPaymentTransactionsHandler,
  ) {}

  async get(
    request: AuthenticatedRequest<{ Querystring: GetPaymentIntentQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.getHandler.handle({
        intentId: request.query.intentId,
        orderId: request.query.orderId,
        userId: request.user.userId,
        timestamp: new Date(),
      });
      return ResponseHelper.ok(reply, "Payment intent retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listTransactions(
    request: AuthenticatedRequest<{ Params: IntentIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.listTransactionsHandler.handle({
        intentId: request.params.intentId,
        userId: request.user.userId,
        timestamp: new Date(),
      });
      return ResponseHelper.ok(reply, "Payment transactions retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async create(
    request: AuthenticatedRequest<{ Body: CreatePaymentIntentBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.createHandler.handle({
        ...request.body,
        userId: request.user.userId,
        timestamp: new Date(),
      });
      return ResponseHelper.fromCommand(reply, result, "Payment intent created", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async process(
    request: AuthenticatedRequest<{ Body: ProcessPaymentBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.processHandler.handle({
        ...request.body,
        userId: request.user.userId,
        timestamp: new Date(),
      });
      return ResponseHelper.fromCommand(reply, result, "Payment processed");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async refund(
    request: AuthenticatedRequest<{ Body: RefundPaymentBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.refundHandler.handle({
        ...request.body,
        userId: request.user.userId,
        timestamp: new Date(),
      });
      return ResponseHelper.fromCommand(reply, result, "Payment refunded");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async void(
    request: AuthenticatedRequest<{ Body: VoidPaymentBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.voidHandler.handle({
        ...request.body,
        userId: request.user.userId,
        timestamp: new Date(),
      });
      return ResponseHelper.fromCommand(reply, result, "Payment voided");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
