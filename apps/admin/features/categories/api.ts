import { api, unwrap } from "../../lib/api-client";
import { Category } from "./types";

export const categoriesApi = {
  /**
   * Fetch categories with standard pagination and sorting
   */
  async getCategories(): Promise<Category[]> {
    const { data, error } = await api.GET("/api/v1/categories", {
      params: {
        query: {
          page: 1,
          limit: 100,
          sortBy: "position",
          sortOrder: "asc",
          includeChildren: true,
        },
      },
    });

    if (error) {
      throw error;
    }

    const res = unwrap(data) as any;
    if (res && res.items) {
      return res.items as Category[];
    }
    return [];
  },

  /**
   * Create a new category
   */
  async createCategory(payload: {
    name: string;
    slug?: string;
    parentId?: string;
    position: number;
  }): Promise<Category> {
    const { data, error } = await api.POST("/api/v1/categories", {
      body: payload as any,
    });

    if (error) {
      throw error;
    }

    return unwrap(data) as Category;
  },

  /**
   * Update an existing category
   */
  async updateCategory(
    id: string,
    payload: {
      name: string;
      slug?: string;
      parentId?: string | null;
      position: number;
    }
  ): Promise<Category> {
    const { data, error } = await api.PATCH("/api/v1/categories/{id}", {
      params: { path: { id } },
      body: payload as any,
    });

    if (error) {
      throw error;
    }

    return unwrap(data) as Category;
  },

  /**
   * Delete a category
   */
  async deleteCategory(id: string): Promise<void> {
    const { error } = await api.DELETE("/api/v1/categories/{id}", {
      params: { path: { id } },
    });

    if (error) {
      throw error;
    }
  },
};
