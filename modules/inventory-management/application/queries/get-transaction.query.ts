import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { InventoryTransactionDTO } from "../../domain/entities/inventory-transaction.entity";
import { StockManagementService } from "../services/stock-management.service";

export interface GetTransactionQuery extends IQuery {
  readonly transactionId: string;
}

export type TransactionResult = InventoryTransactionDTO;

export class GetTransactionHandler implements IQueryHandler<
  GetTransactionQuery,
  TransactionResult
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(query: GetTransactionQuery): Promise<TransactionResult> {
    return this.stockService.getTransaction(query.transactionId);
  }
}
