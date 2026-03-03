import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreateBnplTransactionCommand,
  CreateBnplTransactionHandler,
  ProcessBnplPaymentCommand,
  ProcessBnplPaymentHandler,
  GetBnplTransactionsQuery,
  GetBnplTransactionsHandler,
} from "../../../application";
import { BnplTransactionService } from "../../../application/services/bnpl-transaction.service";

export interface CreateBnplTransactionRequest {
  intentId: string;
  provider: string;
  plan: any;
}

export interface ProcessBnplParams {
  bnplId: string;
  action: "approve" | "reject" | "activate" | "complete" | "cancel";
}

export class BnplTransactionController {
  private createHandler: CreateBnplTransactionHandler;
  private processHandler: ProcessBnplPaymentHandler;
  private listHandler: GetBnplTransactionsHandler;

  constructor(private readonly bnplService: BnplTransactionService) {
    this.createHandler = new CreateBnplTransactionHandler(bnplService);
    this.processHandler = new ProcessBnplPaymentHandler(bnplService);
    this.listHandler = new GetBnplTransactionsHandler(bnplService);
  }

  async create(
    request: FastifyRequest<{ Body: CreateBnplTransactionRequest }>,
    reply: FastifyReply,
  ) {
    const userId = (request as any).user?.userId;
    if (!userId) {
      return reply
        .code(401)
        .send({ success: false, error: "Authentication required" });
    }

    const cmd: CreateBnplTransactionCommand = {
      ...request.body,
      userId,
      timestamp: new Date(),
    };
    const result = await this.createHandler.handle(cmd);
    return reply.code(result.success ? 201 : 400).send(result);
  }

  async process(
    request: FastifyRequest<{ Params: ProcessBnplParams }>,
    reply: FastifyReply,
  ) {
    const userId = (request as any).user?.userId;
    if (!userId) {
      return reply
        .code(401)
        .send({ success: false, error: "Authentication required" });
    }

    const { bnplId, action } = request.params;
    const cmd: ProcessBnplPaymentCommand = {
      bnplId,
      action,
      userId,
      timestamp: new Date(),
    };
    const result = await this.processHandler.handle(cmd);
    return reply.code(result.success ? 200 : 400).send(result);
  }

  async list(
    request: FastifyRequest<{
      Querystring: { bnplId?: string; intentId?: string; orderId?: string };
    }>,
    reply: FastifyReply,
  ) {
    const userId = (request as any).user?.userId;
    if (!userId) {
      return reply
        .code(401)
        .send({ success: false, error: "Authentication required" });
    }

    const query: GetBnplTransactionsQuery = {
      ...request.query,
      userId,
      timestamp: new Date(),
    };
    const result = await this.listHandler.handle(query);
    return reply.code(result.success ? 200 : 400).send(result);
  }
}
