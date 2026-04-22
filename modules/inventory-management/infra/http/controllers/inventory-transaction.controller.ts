import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  GetTransactionsByVariantHandler,
  ListTransactionsHandler,
  GetTransactionHandler,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  TransactionParams,
  TransactionVariantParams,
  TransactionsByVariantQuery,
  ListTransactionsQuery,
} from "../validation/inventory-transaction.schema";

export class InventoryTransactionController {
  constructor(
    private readonly getTransactionsByVariantHandler: GetTransactionsByVariantHandler,
    private readonly listTransactionsHandler: ListTransactionsHandler,
    private readonly getTransactionHandler: GetTransactionHandler,
  ) {}

  async getTransaction(
    request: AuthenticatedRequest<{ Params: TransactionParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { transactionId } = request.params;
      const result = await this.getTransactionHandler.handle({ transactionId });
      return ResponseHelper.ok(reply, "Transaction retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getTransactionsByVariant(
    request: AuthenticatedRequest<{ Params: TransactionVariantParams; Querystring: TransactionsByVariantQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;
      const { locationId, limit, offset } = request.query;
      const result = await this.getTransactionsByVariantHandler.handle({
        variantId,
        locationId,
        limit,
        offset,
      });
      return ResponseHelper.ok(reply, "Transactions retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listTransactions(
    request: AuthenticatedRequest<{ Querystring: ListTransactionsQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId, locationId, limit, offset } = request.query;
      const result = await this.listTransactionsHandler.handle({
        variantId,
        locationId,
        limit,
        offset,
      });
      return ResponseHelper.ok(reply, "Transactions retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
