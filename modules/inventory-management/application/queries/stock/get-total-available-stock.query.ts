import { IQuery, IQueryHandler, CommandResult } from "@/api/src/shared/application";
import { StockManagementService } from "../../services/stock-management.service";

export interface GetTotalAvailableStockQuery extends IQuery {
  variantId: string;
}

export interface TotalAvailableStockResult {
  variantId: string;
  totalAvailable: number;
}

export class GetTotalAvailableStockQueryHandler implements IQueryHandler<
  GetTotalAvailableStockQuery,
  CommandResult<TotalAvailableStockResult>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(
    query: GetTotalAvailableStockQuery,
  ): Promise<CommandResult<TotalAvailableStockResult>> {
    try {
      const errors: string[] = [];

      if (!query.variantId || query.variantId.trim().length === 0) {
        errors.push("variantId: Variant ID is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure<TotalAvailableStockResult>(
          "Validation failed",
          errors,
        );
      }

      const totalAvailable = await this.stockService.getTotalAvailableStock(
        query.variantId,
      );

      const result: TotalAvailableStockResult = {
        variantId: query.variantId,
        totalAvailable,
      };

      return CommandResult.success(result);
    } catch (error) {
      return CommandResult.failure<TotalAvailableStockResult>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

export { GetTotalAvailableStockQueryHandler as GetTotalAvailableStockHandler };
