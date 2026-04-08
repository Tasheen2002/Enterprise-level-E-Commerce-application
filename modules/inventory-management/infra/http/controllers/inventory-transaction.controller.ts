import { FastifyRequest, FastifyReply } from "fastify";
import {
  GetTransactionsByVariantQuery,
  GetTransactionsByVariantHandler,
  ListTransactionsQuery,
  ListTransactionsHandler,
  GetTransactionQuery,
  GetTransactionHandler,
} from "../../../application";
import { StockManagementService } from "../../../application/services/stock-management.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export interface TransactionsByVariantQuerystring {
  locationId?: string;
  limit?: number;
  offset?: number;
}

export interface ListTransactionsQuerystring {
  variantId?: string;
  locationId?: string;
  limit?: number;
  offset?: number;
}

export class InventoryTransactionController {
  private getTransactionsByVariantHandler: GetTransactionsByVariantHandler;
  private listTransactionsHandler: ListTransactionsHandler;
  private getTransactionHandler: GetTransactionHandler;

  constructor(private readonly stockService: StockManagementService) {
    this.getTransactionsByVariantHandler = new GetTransactionsByVariantHandler(
      stockService,
    );
    this.listTransactionsHandler = new ListTransactionsHandler(stockService);
    this.getTransactionHandler = new GetTransactionHandler(stockService);
  }

  async getTransaction(
    request: FastifyRequest<{ Params: { transactionId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { transactionId } = request.params;
      const query: GetTransactionQuery = { transactionId };
      const result = await this.getTransactionHandler.handle(query);
      return ResponseHelper.fromQuery(
        reply,
        result,
        "Transaction retrieved",
        "Transaction not found",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getTransactionsByVariant(
    request: FastifyRequest<{
      Params: { variantId: string };
      Querystring: TransactionsByVariantQuerystring;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { variantId } = request.params;
      const queryParams = request.query;
      const query: GetTransactionsByVariantQuery = {
        variantId,
        locationId: queryParams.locationId,
        limit: queryParams.limit ? Number(queryParams.limit) : undefined,
        offset: queryParams.offset ? Number(queryParams.offset) : undefined,
      };

      const result = await this.getTransactionsByVariantHandler.handle(query);
      return ResponseHelper.fromQuery(reply, result, "Transactions retrieved");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listTransactions(
    request: FastifyRequest<{ Querystring: ListTransactionsQuerystring }>,
    reply: FastifyReply,
  ) {
    try {
      const queryParams = request.query;
      const query: ListTransactionsQuery = {
        variantId: queryParams.variantId,
        locationId: queryParams.locationId,
        limit: queryParams.limit ? Number(queryParams.limit) : undefined,
        offset: queryParams.offset ? Number(queryParams.offset) : undefined,
      };

      const result = await this.listTransactionsHandler.handle(query);
      return ResponseHelper.fromQuery(reply, result, "Transactions retrieved");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }
}
