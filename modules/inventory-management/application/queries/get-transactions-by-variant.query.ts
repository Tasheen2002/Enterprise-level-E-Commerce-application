import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { TransactionResult } from "./get-transaction.query";
import { StockManagementService } from "../services/stock-management.service";

export interface GetTransactionsByVariantQuery extends IQuery {
  readonly variantId: string;
  readonly locationId?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface TransactionsByVariantResult {
  readonly transactions: TransactionResult[];
  readonly total: number;
}

export class GetTransactionsByVariantHandler implements IQueryHandler<
  GetTransactionsByVariantQuery,
  TransactionsByVariantResult
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(query: GetTransactionsByVariantQuery): Promise<TransactionsByVariantResult> {
    const result = await this.stockService.getTransactionHistory(
      query.variantId,
      query.locationId,
      { limit: query.limit, offset: query.offset },
    );
    return { transactions: result.transactions, total: result.total };
  }
}
