import { IQuery, IQueryHandler, CommandResult } from "@/api/src/shared/application";
import { StockManagementService } from "../../services/stock-management.service";

export interface GetTransactionQuery extends IQuery {
  transactionId: string;
}

export interface TransactionResult {
  invTxnId: string;
  variantId: string;
  locationId: string;
  qtyDelta: number;
  reason: string;

  referenceId?: string;
  createdAt: Date;
}

export class GetTransactionQueryHandler implements IQueryHandler<
  GetTransactionQuery,
  CommandResult<TransactionResult | null>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(
    query: GetTransactionQuery,
  ): Promise<CommandResult<TransactionResult | null>> {
    try {
      const errors: string[] = [];

      if (!query.transactionId || query.transactionId.trim().length === 0) {
        errors.push("transactionId: Transaction ID is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure<TransactionResult | null>(
          "Validation failed",
          errors,
        );
      }

      const txn = await this.stockService.getTransaction(query.transactionId);

      if (!txn) {
        return CommandResult.success<TransactionResult | null>(null);
      }

      const result: TransactionResult = {
        invTxnId: txn.getInvTxnId().getValue(),
        variantId: txn.getVariantId(),
        locationId: txn.getLocationId(),
        qtyDelta: txn.getQtyDelta(),
        reason: txn.getReason().getValue(),
        referenceId: txn.getReferenceId() ?? undefined,
        createdAt: txn.getCreatedAt(),
      };

      return CommandResult.success(result);
    } catch (error) {
      return CommandResult.failure<TransactionResult | null>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

export { GetTransactionQueryHandler as GetTransactionHandler };
