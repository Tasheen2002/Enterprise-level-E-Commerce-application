import { api, unwrap } from "../../lib/api-client";
import { Category, Product, Variant, Review } from "./types";

export const productsApi = {
  /**
   * Fetch categories with standard pagination and name sorting
   */
  async getCategories(): Promise<Category[]> {
    const res = await api.GET("/api/v1/categories", {
      params: {
        query: {
          page: 1,
          limit: 100,
          sortBy: "name",
          sortOrder: "asc",
          includeChildren: true,
        }
      }
    });
    if (res.data?.success && res.data.data?.items) {
      return (res.data.data.items as any[]).map((c) => ({
        id: c.id,
        title: c.name || c.title,
        slug: c.slug,
      }));
    }
    return [];
  },

  /**
   * Fetch products catalog list
   */
  async getProducts(): Promise<Product[]> {
    const res = await api.GET("/api/v1/products", {
      params: {
        query: {
          page: 1,
          limit: 100,
          sortBy: "createdAt",
          sortOrder: "desc",
          includeDrafts: true,
        }
      }
    });
    if (res.data?.success && res.data.data?.items) {
      return (res.data.data.items as any[]).map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        brand: p.brand || "Slipperze",
        shortDesc: p.shortDesc || "",
        longDescHtml: p.longDescHtml || "",
        status: p.status ? (p.status.toUpperCase() as any) : "DRAFT",
        price: p.price || 0,
        compareAtPrice: p.compareAtPrice || null,
        currency: p.currency || "USD",
        categoryIds: p.categoryIds || [],
        sizes: p.sizes || [
          { value: "35", isAvailable: true },
          { value: "36", isAvailable: true },
          { value: "37", isAvailable: true },
          { value: "38", isAvailable: true },
          { value: "39", isAvailable: true },
          { value: "40", isAvailable: true },
          { value: "41", isAvailable: true },
          { value: "42", isAvailable: true },
        ],
        images: p.images || [],
      }));
    }
    return [];
  },

  /**
   * Fetch single product details (e.g. for variant title lookups)
   */
  async getProduct(productId: string): Promise<Product | null> {
    const res = await api.GET("/api/v1/products/{productId}", {
      params: { path: { productId } },
    });
    if (res.data?.success && res.data.data) {
      const p = res.data.data as any;
      return {
        id: p.id,
        title: p.title || "",
        slug: p.slug || "",
        brand: p.brand || "Slipperze",
        shortDesc: p.shortDesc || "",
        longDescHtml: p.longDescHtml || "",
        status: p.status ? (p.status.toUpperCase() as any) : "DRAFT",
        price: p.price || 0,
        compareAtPrice: p.compareAtPrice || null,
        currency: p.currency || "USD",
        categoryIds: p.categoryIds || [],
        images: p.images || [],
      };
    }
    return null;
  },

  /**
   * Create a new product catalog entry
   */
  async createProduct(formData: Product): Promise<Product> {
    const res = await api.POST("/api/v1/products", {
      body: {
        title: formData.title,
        slug: formData.slug,
        brand: formData.brand,
        shortDesc: formData.shortDesc,
        longDescHtml: formData.longDescHtml,
        status: (formData.status || "DRAFT").toLowerCase() as any,
        price: formData.price,
        compareAtPrice: formData.compareAtPrice ?? undefined,
        currency: formData.currency,
        categoryIds: formData.categoryIds,
        images: formData.images,
      }
    }) as any;
    if (res.error) {
      throw new Error((res.error as any).message || "Failed to create product");
    }
    const resData = unwrap(res.data) as any;
    return {
      ...formData,
      id: resData.id,
      images: resData.images || formData.images,
    };
  },

  /**
   * Update an existing product
   */
  async updateProduct(productId: string, formData: Product): Promise<void> {
    const res = await api.PATCH("/api/v1/products/{productId}", {
      params: { path: { productId } },
      body: {
        title: formData.title,
        slug: formData.slug,
        brand: formData.brand,
        shortDesc: formData.shortDesc,
        longDescHtml: formData.longDescHtml,
        status: (formData.status || "DRAFT").toLowerCase() as any,
        price: formData.price,
        compareAtPrice: formData.compareAtPrice ?? undefined,
        currency: formData.currency,
        categoryIds: formData.categoryIds,
        images: formData.images,
      }
    }) as any;
    if (res.error) {
      throw new Error((res.error as any).message || "Failed to update product");
    }
    unwrap(res.data);
  },

  /**
   * Delete product by ID
   */
  async deleteProduct(productId: string): Promise<void> {
    const res = await api.DELETE("/api/v1/products/{productId}", {
      params: { path: { productId } }
    }) as any;
    if (res.error) {
      throw new Error((res.error as any).message || "Failed to delete product");
    }
  },

  /**
   * Fetch product variants list
   */
  async getVariants(productId: string): Promise<Variant[]> {
    const res = await api.GET("/api/v1/products/{productId}/variants", {
      params: {
        path: { productId },
        query: { page: 1, limit: 100, sortBy: "createdAt", sortOrder: "desc" }
      },
    });
    if (res.data?.success && res.data.data && "items" in res.data.data) {
      return (res.data.data.items as any[]).map((v) => ({
        id: v.id,
        sku: v.sku,
        size: v.size || null,
        color: v.color || null,
        barcode: v.barcode || null,
        weightG: v.weightG || null,
        allowBackorder: v.allowBackorder ?? false,
        allowPreorder: v.allowPreorder ?? false,
        createdAt: v.createdAt,
      }));
    }
    return [];
  },

  /**
   * Create a variant under a specific product
   */
  async createVariant(productId: string, variantData: Partial<Variant>): Promise<void> {
    const res = await api.POST("/api/v1/products/{productId}/variants", {
      params: { path: { productId } },
      body: {
        sku: variantData.sku!,
        size: variantData.size || undefined,
        color: variantData.color || undefined,
        barcode: variantData.barcode || undefined,
        allowBackorder: variantData.allowBackorder || false,
        allowPreorder: variantData.allowPreorder || false,
      },
    }) as any;
    if (res.error) {
      throw new Error((res.error as any).message || "Failed to create variant");
    }
  },

  /**
   * Update an existing product variant
   */
  async updateVariant(variantId: string, variantData: Partial<Variant>): Promise<void> {
    const res = await api.PATCH("/api/v1/variants/{variantId}", {
      params: { path: { variantId } },
      body: {
        sku: variantData.sku!,
        size: variantData.size || undefined,
        color: variantData.color || undefined,
        barcode: variantData.barcode || undefined,
        allowBackorder: variantData.allowBackorder || false,
        allowPreorder: variantData.allowPreorder || false,
      },
    }) as any;
    if (res.error) {
      throw new Error((res.error as any).message || "Failed to update variant");
    }
  },

  /**
   * Delete a variant
   */
  async deleteVariant(variantId: string): Promise<void> {
    const res = await api.DELETE("/api/v1/variants/{variantId}", {
      params: { path: { variantId } },
    }) as any;
    if (res.error) {
      throw new Error((res.error as any).message || "Failed to delete variant");
    }
  },

  /**
   * Fetch reviews (filterable by status)
   */
  async getReviews(status?: string): Promise<Review[]> {
    const res = await (api as any).GET("/api/v1/engagement/reviews", {
      params: {
        query: {
          limit: 100,
          status: status || undefined,
        }
      }
    });
    if (res.data?.success && res.data.data?.items) {
      return res.data.data.items as Review[];
    }
    return [];
  },

  /**
   * Update review moderation status
   */
  async updateReviewStatus(reviewId: string, status: "approved" | "rejected" | "flagged"): Promise<void> {
    const res = await (api as any).PATCH("/api/v1/engagement/reviews/{reviewId}/status", {
      params: { path: { reviewId } },
      body: { status }
    });
    if (res.error) {
      throw new Error((res.error as any).message || "Failed to update review status");
    }
  }
};
