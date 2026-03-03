import { FastifyRequest, FastifyReply } from "fastify";
import {
  GetPaymentTransactionsQuery,
  GetPaymentTransactionsHandler,
} from "../../../application";
import { PaymentService } from "../../../application/services/payment.service";

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
      return reply
        .code(401)
        .send({ success: false, error: "Authentication required" });
    }

    const result = await this.listHandler.handle({
      intentId: request.params.intentId,
      userId,
      timestamp: new Date(),
    });
    return reply.code(result.success ? 200 : 400).send(result);
  }
}
