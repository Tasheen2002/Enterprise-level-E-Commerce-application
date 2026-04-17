import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { TransactionResult } from "./get-transaction.query";
import { StockManagementService } from "../services/stock-management.service";

export interface GetTransactionHistoryQuery extends IQuery {
  readonly variantId: string;
  readonly locationId?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface GetTransactionHistoryResult {
  readonly transactions: TransactionResult[];
  readonly total: number;
}

export class GetTransactionHistoryHandler implements IQueryHandler<
  GetTransactionHistoryQuery,
  GetTransactionHistoryResult
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(query: GetTransactionHistoryQuery): Promise<GetTransactionHistoryResult> {
    const result = await this.stockService.getTransactionHistory(
      query.variantId,
      query.locationId,
      { limit: query.limit, offset: query.offset },
    );
    return { transactions: result.transactions, total: result.total };
  }
}
