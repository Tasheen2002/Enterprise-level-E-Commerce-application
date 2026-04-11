import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  GetTransactionsByVariantHandler,
  ListTransactionsHandler,
  GetTransactionHandler,
} from "../../../application";
import { StockManagementService } from "../../../application/services/stock-management.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export class InventoryTransactionController {
  private getTransactionsByVariantHandler: GetTransactionsByVariantHandler;
  private listTransactionsHandler: ListTransactionsHandler;
  private getTransactionHandler: GetTransactionHandler;

  constructor(stockService: StockManagementService) {
    this.getTransactionsByVariantHandler = new GetTransactionsByVariantHandler(stockService);
    this.listTransactionsHandler = new ListTransactionsHandler(stockService);
    this.getTransactionHandler = new GetTransactionHandler(stockService);
  }

  async getTransaction(
    request: AuthenticatedRequest<{
      Params: { transactionId: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { transactionId } = request.params;
      const result = await this.getTransactionHandler.handle({ transactionId });
      return ResponseHelper.fromQuery(reply, result, "Transaction retrieved", "Transaction not found");
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }
}
