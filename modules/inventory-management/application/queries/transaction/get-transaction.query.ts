import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { InventoryTransactionDTO } from "../../../domain/entities/inventory-transaction.entity";
import { StockManagementService } from "../../services/stock-management.service";

export interface GetTransactionQuery extends IQuery {
  transactionId: string;
}

export type TransactionResult = InventoryTransactionDTO;

export class GetTransactionHandler implements IQueryHandler<
  GetTransactionQuery,
  QueryResult<TransactionResult>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(query: GetTransactionQuery): Promise<QueryResult<TransactionResult>> {
    const txn = await this.stockService.getTransaction(query.transactionId);
    return QueryResult.success(txn);
  }
}
