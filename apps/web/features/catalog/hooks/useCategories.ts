import { useState, useEffect } from "react";
import { SubCategory } from "../types";
import { getSubCategories } from "../api";

/**
 * Enterprise Pattern: useCategories Hook
 * 
 * Provides a clean interface for UI components to access catalog data.
 * Currently handles local mock state, but is designed to integrate 
 * perfectly with @tanstack/react-query later.
 */
export function useCategories(categorySlug: string) {
  const [data, setData] = useState<SubCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const result = await getSubCategories(categorySlug);
        setData(result);
      } catch (e) {
        setError(e instanceof Error ? e : new Error("Failed to load categories"));
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [categorySlug]);

  return { data, isLoading, error };
}
