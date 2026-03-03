import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { Product } from "../../domain/entities/product.entity";
import { ProductManagementService } from "../services/product-management.service";
import { ListProductsQuery, ListProductsResult, ProductResult } from "./list-products.query";

export class ListProductsHandler implements IQueryHandler<ListProductsQuery, QueryResult<ListProductsResult>> {
  constructor(private readonly productManagementService: ProductManagementService) {}

  async handle(query: ListProductsQuery): Promise<QueryResult<ListProductsResult>> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 20;

      const products = await this.productManagementService.getAllProducts({
        page,
        limit,
        categoryId: query.categoryId,
        brand: query.brand,
        status: query.status,
        includeDrafts: query.includeDrafts,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

      const productResults: ProductResult[] = products.items.map((product: Product) => ({
        productId: product.getId().toString(),
        title: product.getTitle(),
        slug: product.getSlug().toString(),
        brand: product.getBrand() ?? undefined,
        shortDesc: product.getShortDesc() ?? undefined,
        longDescHtml: product.getLongDescHtml() ?? undefined,
        status: product.getStatus(),
        publishAt: product.getPublishAt() ?? undefined,
        countryOfOrigin: product.getCountryOfOrigin() ?? undefined,
        seoTitle: product.getSeoTitle() ?? undefined,
        seoDescription: product.getSeoDescription() ?? undefined,
        price: product.getPrice().getValue(),
        priceSgd: product.getPriceSgd()?.getValue() ?? null,
        priceUsd: product.getPriceUsd()?.getValue() ?? null,
        compareAtPrice: product.getCompareAtPrice()?.getValue() ?? null,
        createdAt: product.getCreatedAt(),
        updatedAt: product.getUpdatedAt(),
      }));

      return QueryResult.success<ListProductsResult>({
        products: productResults,
        totalCount: products.totalCount,
        page,
        limit,
      });
    } catch (error) {
      return QueryResult.failure<ListProductsResult>("Failed to retrieve products");
    }
  }
}
