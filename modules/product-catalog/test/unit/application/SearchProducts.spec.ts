import { describe, it, expect, vi } from "vitest";
import { SearchProductsHandler, SearchProductsQuery } from "@modules/product-catalog/application/queries/search-products.query";
import { ProductSearchService, ProductSearchResult } from "@modules/product-catalog/application/services/product-search.service";

describe("SearchProductsHandler", () => {
  it("should successfully search products using ProductSearchService with defaults", async () => {
    // Arrange
    const mockResult: ProductSearchResult = {
      items: [
        {
          id: "prod-123",
          title: "Cashmere Scarf",
          slug: "cashmere-scarf",
          brand: "Tasheen",
          shortDesc: "Luxury cashmere accessory",
          longDescHtml: null,
          status: "published" as any,
          publishAt: new Date().toISOString(),
          countryOfOrigin: null,
          seoTitle: null,
          seoDescription: null,
          price: 250,
          currency: "GBP",
          priceSgd: null,
          priceUsd: null,
          compareAtPrice: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
      hasMore: false,
    };

    const mockSearchService = {
      searchProducts: vi.fn().mockResolvedValue(mockResult),
    } as unknown as ProductSearchService;

    const handler = new SearchProductsHandler(mockSearchService);

    const query: SearchProductsQuery = {
      searchTerm: "  cashmere  ",
    };

    // Act
    const result = await handler.handle(query);

    // Assert
    expect(mockSearchService.searchProducts).toHaveBeenCalledWith("cashmere", {
      page: 1,
      limit: 20,
      category: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      brand: undefined,
      tags: undefined,
      status: undefined,
      sortBy: "relevance",
      sortOrder: "desc",
    });
    expect(result).toEqual(mockResult);
  });

  it("should normalize page and limit boundaries to valid constants range", async () => {
    const mockSearchService = {
      searchProducts: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    } as unknown as ProductSearchService;

    const handler = new SearchProductsHandler(mockSearchService);

    const query: SearchProductsQuery = {
      searchTerm: "coat",
      page: 0, // Should be normalized to MIN_PAGE = 1
      limit: 1000, // Should be normalized to MAX_PAGE_SIZE = 100
      sortBy: "price",
      sortOrder: "asc",
    };

    // Act
    await handler.handle(query);

    // Assert
    expect(mockSearchService.searchProducts).toHaveBeenCalledWith("coat", {
      page: 1,
      limit: 100,
      category: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      brand: undefined,
      tags: undefined,
      status: undefined,
      sortBy: "price",
      sortOrder: "asc",
    });
  });
});
