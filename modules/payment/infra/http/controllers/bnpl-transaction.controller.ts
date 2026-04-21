import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  CreateBnplTransactionHandler,
  ProcessBnplPaymentHandler,
  GetBnplTransactionsHandler,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  CreateBnplTransactionBody,
  BnplParams,
  ListBnplQuery,
} from "../validation/bnpl.schema";

export class BnplTransactionController {
  constructor(
    private readonly createHandler: CreateBnplTransactionHandler,
    private readonly processHandler: ProcessBnplPaymentHandler,
    private readonly listHandler: GetBnplTransactionsHandler,
  ) {}

  async create(
    request: AuthenticatedRequest<{ Body: CreateBnplTransactionBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.createHandler.handle({
        ...request.body,
        userId: request.user.userId,
        timestamp: new Date(),
      });
      return ResponseHelper.fromCommand(reply, result, "BNPL transaction created", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async process(
    request: AuthenticatedRequest<{ Params: BnplParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.processHandler.handle({
        bnplId: request.params.bnplId,
        action: request.params.action,
        userId: request.user.userId,
        timestamp: new Date(),
      });
      return ResponseHelper.fromCommand(reply, result, "BNPL payment processed");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async list(
    request: AuthenticatedRequest<{ Querystring: ListBnplQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.listHandler.handle({
        ...request.query,
        userId: request.user.userId,
        timestamp: new Date(),
      });
      return ResponseHelper.ok(reply, "BNPL transactions retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
