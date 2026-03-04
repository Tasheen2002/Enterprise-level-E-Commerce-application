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
import { ResponseHelper } from "@/api/src/shared/response.helper";

export interface CreateBnplTransactionRequest {
  intentId: string;
  provider: string;
  plan: any;
}

export interface ProcessBnplParams {
  bnplId: string;
  action: "approve" | "reject" | "activate" | "complete" | "cancel";
}
export interface ListBnplTransactionsQuerystring {
  bnplId?: string;
  intentId?: string;
  orderId?: string;
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
      return ResponseHelper.unauthorized(reply, "Authentication required");
    }

    const cmd: CreateBnplTransactionCommand = {
      ...request.body,
      userId,
      timestamp: new Date(),
    };
    const result = await this.createHandler.handle(cmd);
    return ResponseHelper.fromCommand(
      reply,
      result,
      "BNPL transaction created",
      201,
    );
  }

  async process(
    request: FastifyRequest<{ Params: ProcessBnplParams }>,
    reply: FastifyReply,
  ) {
    const userId = (request as any).user?.userId;
    if (!userId) {
      return ResponseHelper.unauthorized(reply, "Authentication required");
    }

    const { bnplId, action } = request.params;
    const cmd: ProcessBnplPaymentCommand = {
      bnplId,
      action,
      userId,
      timestamp: new Date(),
    };
    const result = await this.processHandler.handle(cmd);
    return ResponseHelper.fromCommand(reply, result, "BNPL payment processed");
  }

  async list(
    request: FastifyRequest<{ Querystring: ListBnplTransactionsQuerystring }>,
    reply: FastifyReply,
  ) {
    const userId = (request as any).user?.userId;
    if (!userId) {
      return ResponseHelper.unauthorized(reply, "Authentication required");
    }

    const query: GetBnplTransactionsQuery = {
      ...request.query,
      userId,
      timestamp: new Date(),
    };
    const result = await this.listHandler.handle(query);
    return ResponseHelper.fromQuery(
      reply,
      result,
      "BNPL transactions retrieved",
    );
  }
}
