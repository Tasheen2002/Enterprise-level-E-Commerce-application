import type { SubCategory, Product } from "./types";
export type { SubCategory, Product };
import { imageKitUrl } from "../../lib/imagekit";

interface DbProduct {
  id: string;
  title: string;
  brand?: string | null;
  price: number;
  priceUsd?: number | null;
  priceSgd?: number | null;
  currency: string;
  images?: string[];
  slug: string;
  status: string;
  sizes?: { value: string; isAvailable: boolean }[];
  categoryIds?: string[];
}

interface CategoryMapItem {
  slug: string;
  parentId: string | null;
}

const CATEGORY_MAP: Record<string, CategoryMapItem> = {
  "45c2f063-7e4b-4436-97d3-b5cb77027b01": { slug: "women", parentId: null },
  "b7a5f2e8-1b3b-4aa6-b129-dd593d379976": { slug: "leather-goods", parentId: "45c2f063-7e4b-4436-97d3-b5cb77027b01" },
  "09ba7651-a19a-43e2-8f6a-1feb88fc1012": { slug: "bags", parentId: "b7a5f2e8-1b3b-4aa6-b129-dd593d379976" },
  "58eaac47-6f9a-42b0-9f13-db911ac3228d": { slug: "belts", parentId: "b7a5f2e8-1b3b-4aa6-b129-dd593d379976" },
  "651d752a-3e85-452a-94c6-8b1224a68a3c": { slug: "heeled-sandals", parentId: "45c2f063-7e4b-4436-97d3-b5cb77027b01" },
  "ed823dc6-9727-4680-8c42-0f9f1bd434db": { slug: "flat-sandals", parentId: "45c2f063-7e4b-4436-97d3-b5cb77027b01" },
  "496accf7-a083-4dd5-aaa4-1176deff18c0": { slug: "laptop-sleeves", parentId: "b7a5f2e8-1b3b-4aa6-b129-dd593d379976" },
  "63ff8f0f-c515-4203-ba2b-16a6575c6ebd": { slug: "phone-straps", parentId: "b7a5f2e8-1b3b-4aa6-b129-dd593d379976" },
  "40518bf4-7f05-4631-9581-80ba98448e9d": { slug: "small-leather-goods", parentId: "b7a5f2e8-1b3b-4aa6-b129-dd593d379976" },
  "508db84e-1242-404c-a969-5a3215c9b482": { slug: "view-all", parentId: "b7a5f2e8-1b3b-4aa6-b129-dd593d379976" },
};

const dynamicCategoryMap: Record<string, CategoryMapItem> = { ...CATEGORY_MAP };

// Client-side background sync on boot
if (typeof window !== "undefined") {
  api.GET<{ items: { id: string; slug: string; parentId: string | null }[] }>(
    "/api/v1/categories?limit=100&includeChildren=true"
  ).then((res) => {
    if (res.data && res.data.items) {
      res.data.items.forEach((item) => {
        dynamicCategoryMap[item.id] = { slug: item.slug, parentId: item.parentId };
      });
    }
  }).catch((err) => {
    console.warn("Failed to sync category map in background:", err);
  });
}

export function getProductRootCategorySlug(categoryIds?: string[]): string {
  if (!categoryIds || categoryIds.length === 0) return "women";

  for (const catId of categoryIds) {
    let currId: string | null = catId;
    let rootSlug = "";
    
    let depth = 0;
    while (currId && depth < 10) {
      const categoryNode: CategoryMapItem | undefined = dynamicCategoryMap[currId];
      if (!categoryNode) break;
      if (categoryNode.parentId === null) {
        rootSlug = categoryNode.slug;
        break;
      }
      currId = categoryNode.parentId;
      depth++;
    }
    
    if (rootSlug) {
      return rootSlug;
    }
  }
  
  return "women";
}

export function buildProductHref(slug: string, categoryIds?: string[]): string {
  if (!categoryIds || categoryIds.length === 0) {
    return `/catalog/women/heeled-sandals/${slug}`;
  }

  for (const catId of categoryIds) {
    const chain: CategoryMapItem[] = [];
    let currId: string | null = catId;
    let depth = 0;
    
    while (currId && depth < 10) {
      const categoryNode: CategoryMapItem | undefined = dynamicCategoryMap[currId];
      if (!categoryNode) break;
      chain.push(categoryNode);
      currId = categoryNode.parentId;
      depth++;
    }

    if (chain.length > 0) {
      const root = chain[chain.length - 1];
      const leaf = chain[0];
      if (root && leaf) {
        const gender = root.parentId === null ? root.slug : "women";
        const category = leaf.slug;
        
        if (leaf === root) {
          return `/catalog/${gender}/${gender}/${slug}`;
        }
        
        return `/catalog/${gender}/${category}/${slug}`;
      }
    }
  }

  return `/catalog/women/heeled-sandals/${slug}`;
}

interface DbCategory {
  id: string;
  title: string;
  slug: string;
}

interface ApiProductsResponse {
  items: DbProduct[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface ApiVariant {
  id: string;
  productId: string;
  sku: string;
  size: string | null;
  color: string | null;
}

interface ApiVariantsResponse {
  items: ApiVariant[];
}

export const LEATHER_GOODS_DATA: SubCategory[] = [
  {
    id: "bags",
    title: "BAGS",
    image: "leather-bags-heritage.png",
    href: "/catalog/women/bags",
  },
  {
    id: "belts",
    title: "BELTS",
    image: "artisan-belts.png",
    href: "/catalog/women/belts",
  },
  {
    id: "small-leather-goods",
    title: "SMALL LEATHER GOODS",
    image: "small-leather-goods.png",
    href: "/catalog/women/wallets",
  },
  {
    id: "laptop-sleeves",
    title: "LAPTOP SLEEVES",
    image: "leather-laptop-sleeves.png",
    href: "/catalog/women/laptop-sleeves",
  },
  {
    id: "phone-straps",
    title: "PHONE STRAPS",
    image: "artisan-phone-straps.png",
    href: "/catalog/women/phone-straps",
  },
  {
    id: "view-all",
    title: "VIEW ALL",
    image: "view-all-editorial.png",
    href: "/catalog/women/leather-goods",
  },
];

const DEFAULT_SIZES = [
  { value: "35", isAvailable: true },
  { value: "36", isAvailable: true },
  { value: "37", isAvailable: false },
  { value: "38", isAvailable: true },
  { value: "39", isAvailable: true },
  { value: "40", isAvailable: true },
  { value: "41", isAvailable: true },
  { value: "42", isAvailable: false },
];

import { api } from "../../lib/api-client";

// HEELED_SANDALS_DATA removed to strictly retrieve from DB API

function mapVariantsToSizes(items: ApiVariant[]): { value: string; isAvailable: boolean }[] {
  if (!items || items.length === 0) return DEFAULT_SIZES;

  // Extract unique non-null sizes
  const uniqueSizes = Array.from(new Set(items.map(v => v.size).filter((s): s is string => !!s)));

  if (uniqueSizes.length === 0) return DEFAULT_SIZES;

  // Sizing sorting sequence helpers
  const bagSizeOrder = ["one size", "os", "mini", "small", "medium", "large", "xl"];

  // Sort sizes:
  // 1. If all are numeric, sort numerically.
  // 2. Otherwise sort based on bagSizeOrder or alphabetically.
  const isNumeric = uniqueSizes.every(s => !isNaN(Number(s)));
  
  uniqueSizes.sort((a, b) => {
    if (isNumeric) {
      return Number(a) - Number(b);
    }
    
    const idxA = bagSizeOrder.indexOf(a.toLowerCase());
    const idxB = bagSizeOrder.indexOf(b.toLowerCase());
    
    if (idxA !== -1 && idxB !== -1) {
      return idxA - idxB;
    }
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    
    return a.localeCompare(b);
  });

  return uniqueSizes.map(size => ({
    value: size,
    isAvailable: true,
  }));
}



function mapDbProduct(p: DbProduct): Product {
  return {
    id: p.id,
    name: p.title,
    color: p.brand || "Mocha Dots",
    price: p.price,
    priceUsd: p.priceUsd,
    priceSgd: p.priceSgd,
    currency: p.currency === "EUR" ? "€" : "US$",
    images: p.images && p.images.length > 0
      ? p.images.map((img: string) => img.startsWith("http") ? img : imageKitUrl(img))
      : [imageKitUrl("profile.jpg")],
    href: buildProductHref(p.slug, p.categoryIds),
    sizes: p.sizes || DEFAULT_SIZES,
    status: p.status,
    categoryIds: p.categoryIds,
  };
}

/**
 * Fetches subcategories for a given parent category.
 */
export async function getSubCategories(category: string): Promise<SubCategory[]> {
  if (category === "leather-goods") {
    return Promise.resolve(LEATHER_GOODS_DATA);
  }
  return Promise.resolve([]);
}

/**
 * Fetches products for a given category.
 */
export async function getProducts(categorySlug: string): Promise<Product[]> {
  try {
    // 1. Fetch category ID by slug
    const catRes = await api.GET<DbCategory>(`/api/v1/categories/slug/${categorySlug}`);

    if (!catRes.data || !catRes.data.id) {
      console.warn(`Category ${categorySlug} not found.`);
      return [];
    }

    // 2. Fetch products for this category
    const query = new URLSearchParams({
      categoryId: catRes.data.id,
      page: "1",
      limit: "100",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    
    const res = await api.GET<ApiProductsResponse>(`/api/v1/products?${query.toString()}`);

    if (res.data && res.data.items && res.data.items.length > 0) {
      const products = res.data.items
        .filter((p: DbProduct) => p.status === "published")
        .map(mapDbProduct);

      // Fetch variants for each product to get real sizes
      const productsWithSizes = await Promise.all(
        products.map(async (product: Product) => {
          try {
            const variantsRes = await api.GET<ApiVariantsResponse>(`/api/v1/products/${product.id}/variants`);
            if (variantsRes.data && variantsRes.data.items) {
              product.sizes = mapVariantsToSizes(variantsRes.data.items);
              product.variants = variantsRes.data.items;
            }
          } catch (e) {
            console.warn(`Failed to fetch variants for product ${product.id}`, e);
          }
          return product;
        })
      );

      return productsWithSizes;
    }
  } catch (err) {
    console.warn("Catalog API offline or error. Returning empty.", err);
  }

  return [];
}

/**
 * Fetches a single product by its slug.
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const res = await api.GET<DbProduct>(`/api/v1/products/slug/${slug}`);

    if (res.data) {
      const dbProd = res.data;
      if (dbProd.status === "published") {
        const product = mapDbProduct(dbProd);

        // Fetch real variants to get real available sizes
        try {
          const variantsRes = await api.GET<ApiVariantsResponse>(`/api/v1/products/${product.id}/variants`);
          if (variantsRes.data && variantsRes.data.items) {
            product.sizes = mapVariantsToSizes(variantsRes.data.items);
            product.variants = variantsRes.data.items;
          }
        } catch (e) {
          console.warn(`Failed to fetch variants for product ${product.id}`, e);
        }

        return product;
      } else {
        console.warn(`Product /${slug} is in ${dbProd.status} state. Access denied.`);
        return null;
      }
    }
  } catch (err) {
    console.warn("Product by slug API offline. Returning null.", err);
  }

  return null;
}

export interface ProductSearchOptions {
  page?: number;
  limit?: number;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "relevance" | "price" | "title" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface SearchProductsResult {
  items: Product[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  suggestions?: string[];
}

export interface SearchSuggestion {
  type: "product" | "category" | "brand";
  value: string;
  label: string;
  count?: number;
}

export interface SearchFilterOption {
  value: string;
  label: string;
  count: number;
}

export interface SearchFilter {
  name: string;
  type: "select" | "range" | "checkbox";
  options?: SearchFilterOption[];
  min?: number;
  max?: number;
}

/**
 * Perform a full-text search on products with filters and sorting.
 */
export async function searchProducts(
  query: string,
  options: ProductSearchOptions = {}
): Promise<SearchProductsResult> {
  try {
    const searchParams = new URLSearchParams({ q: query });
    if (options.page) searchParams.append("page", options.page.toString());
    if (options.limit) searchParams.append("limit", options.limit.toString());
    if (options.category) searchParams.append("category", options.category);
    if (options.brand) searchParams.append("brand", options.brand);
    if (options.minPrice !== undefined) searchParams.append("minPrice", options.minPrice.toString());
    if (options.maxPrice !== undefined) searchParams.append("maxPrice", options.maxPrice.toString());
    if (options.sortBy) searchParams.append("sortBy", options.sortBy);
    if (options.sortOrder) searchParams.append("sortOrder", options.sortOrder);

    const res = await api.GET<{
      items: DbProduct[];
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
      suggestions?: string[];
    }>(`/api/v1/search?${searchParams.toString()}`);

    if (res.error) {
      console.error("[searchProducts] API returned error:", res.error);
    }

    if (res.data) {
      const products = res.data.items.map(mapDbProduct);
      // Fetch variants for each product to get real sizes
      const productsWithSizes = await Promise.all(
        products.map(async (product: Product) => {
          try {
            const variantsRes = await api.GET<ApiVariantsResponse>(`/api/v1/products/${product.id}/variants`);
            if (variantsRes.data && variantsRes.data.items) {
              product.sizes = mapVariantsToSizes(variantsRes.data.items);
            }
          } catch (e) {
            console.warn(`Failed to fetch variants for product ${product.id}`, e);
          }
          return product;
        })
      );

      return {
        items: productsWithSizes,
        total: res.data.total,
        limit: res.data.limit,
        offset: res.data.offset,
        hasMore: res.data.hasMore,
        suggestions: res.data.suggestions,
      };
    }
  } catch (err) {
    console.error("[searchProducts] Exception during search:", err);
  }

  return {
    items: [],
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
    suggestions: [],
  };
}

/**
 * Fetch autocomplete search suggestions.
 */
export async function getSearchSuggestions(
  query: string,
  options: { limit?: number; type?: "products" | "categories" | "brands" | "all" } = {}
): Promise<SearchSuggestion[]> {
  try {
    const searchParams = new URLSearchParams({ q: query });
    if (options.limit) searchParams.append("limit", options.limit.toString());
    if (options.type) searchParams.append("type", options.type);

    const res = await api.GET<{ suggestions: SearchSuggestion[] }>(
      `/api/v1/search/suggestions?${searchParams.toString()}`
    );

    if (res.data && res.data.suggestions) {
      return res.data.suggestions;
    }
  } catch (err) {
    console.warn("Failed to get search suggestions", err);
  }
  return [];
}

/**
 * Fetch dynamic search facets/filters.
 */
export async function getSearchFilters(
  query?: string,
  category?: string
): Promise<SearchFilter[]> {
  try {
    const searchParams = new URLSearchParams();
    if (query) searchParams.append("q", query);
    if (category) searchParams.append("category", category);

    const res = await api.GET<SearchFilter[]>(`/api/v1/search/filters?${searchParams.toString()}`);
    if (res.data) {
      return res.data;
    }
  } catch (err) {
    console.warn("Failed to get search filters", err);
  }
  return [];
}


