import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  GetTransactionsByVariantHandler,
  ListTransactionsHandler,
  GetTransactionHandler,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export class InventoryTransactionController {
  constructor(
    private readonly getTransactionsByVariantHandler: GetTransactionsByVariantHandler,
    private readonly listTransactionsHandler: ListTransactionsHandler,
    private readonly getTransactionHandler: GetTransactionHandler,
  ) {}

  async getTransaction(
    request: AuthenticatedRequest<{ Params: { transactionId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { transactionId } = request.params;
      const result = await this.getTransactionHandler.handle({ transactionId });
      return ResponseHelper.fromQuery(reply, result, "Transaction retrieved", "Transaction not found");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getTransactionsByVariant(
    request: AuthenticatedRequest<{
      Params: { variantId: string };
      Querystring: { locationId?: string; limit?: number; offset?: number };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;
      const { locationId, limit, offset } = request.query;
      const result = await this.getTransactionsByVariantHandler.handle({
        variantId,
        locationId,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });
      return ResponseHelper.fromQuery(reply, result, "Transactions retrieved");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listTransactions(
    request: AuthenticatedRequest<{
      Querystring: { variantId?: string; locationId?: string; limit?: number; offset?: number };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId, locationId, limit, offset } = request.query;
      const result = await this.listTransactionsHandler.handle({
        variantId,
        locationId,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });
      return ResponseHelper.fromQuery(reply, result, "Transactions retrieved");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
