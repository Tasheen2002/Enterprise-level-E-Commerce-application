import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { TransactionResult } from "./get-transaction.query";
import { StockManagementService } from "../../services/stock-management.service";

export interface GetTransactionHistoryQuery extends IQuery {
  variantId: string;
  locationId?: string;
  limit?: number;
  offset?: number;
}

export interface GetTransactionHistoryResult {
  transactions: TransactionResult[];
  total: number;
}

export class GetTransactionHistoryHandler implements IQueryHandler<
  GetTransactionHistoryQuery,
  QueryResult<GetTransactionHistoryResult>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(query: GetTransactionHistoryQuery): Promise<QueryResult<GetTransactionHistoryResult>> {
    const result = await this.stockService.getTransactionHistory(
      query.variantId,
      query.locationId,
      { limit: query.limit, offset: query.offset },
    );
    return QueryResult.success({ transactions: result.transactions, total: result.total });
  }
}
