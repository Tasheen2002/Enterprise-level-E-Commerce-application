import { FastifyRequest, FastifyReply } from "fastify";
import {
  GetPaymentTransactionsQuery,
  GetPaymentTransactionsHandler,
} from "../../../application";
import { PaymentService } from "../../../application/services/payment.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export class PaymentTransactionController {
  private listHandler: GetPaymentTransactionsHandler;

  constructor(private readonly paymentService: PaymentService) {
    this.listHandler = new GetPaymentTransactionsHandler(paymentService);
  }

  async list(
    request: FastifyRequest<{ Params: { intentId: string } }>,
    reply: FastifyReply,
  ) {
    const userId = (request as any).user?.userId;
    if (!userId) {
      return ResponseHelper.unauthorized(reply, "Authentication required");
    }

    const result = await this.listHandler.handle({
      intentId: request.params.intentId,
      userId,
      timestamp: new Date(),
    });
    return ResponseHelper.fromQuery(
      reply,
      result,
      "Payment transactions retrieved",
    );
  }
}
