import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { VariantManagementService } from "../../services/variant-management.service";
import { ListVariantsQuery } from "./list-variants.query";

export interface ListVariantsResult {
  variants: Array<{
    id: string;
    productId: string;
    sku: string;
    size: string | null;
    color: string | null;
    barcode: string | null;
    weightG: number | null;
    dims: Record<string, any> | null;
    taxClass: string | null;
    allowBackorder: boolean;
    allowPreorder: boolean;
    restockEta: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  meta: {
    productId: string;
    page: number;
    limit: number;
    filters: {
      size?: string;
      color?: string;
      inStock?: boolean;
    };
  };
}

export class ListVariantsHandler
  implements IQueryHandler<ListVariantsQuery, QueryResult<ListVariantsResult>>
{
  constructor(private readonly variantManagementService: VariantManagementService) {}

  async handle(query: ListVariantsQuery): Promise<QueryResult<ListVariantsResult>> {
    try {
      const page = Math.max(1, query.page || 1);
      const limit = Math.min(100, Math.max(1, query.limit || 20));

      const variants = await this.variantManagementService.getVariantsByProduct(
        query.productId,
        {
          page,
          limit,
          size: query.size,
          color: query.color,
          sortBy: query.sortBy || "createdAt",
          sortOrder: query.sortOrder || "asc",
        },
      );

      return QueryResult.success<ListVariantsResult>({
        variants: variants.map((v) => v.toData()),
        meta: {
          productId: query.productId,
          page,
          limit,
          filters: {
            size: query.size,
            color: query.color,
            inStock: query.inStock,
          },
        },
      });
    } catch (error) {
      return QueryResult.failure<ListVariantsResult>("Failed to list variants");
    }
  }
}
