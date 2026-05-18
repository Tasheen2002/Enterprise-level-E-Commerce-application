import { useQuery } from "@tanstack/react-query";
import { getSubCategories } from "../api";

/**
 * Enterprise Pattern: useCategories Hook
 * 
 * Provides a clean interface for UI components to access catalog categories
 * with robust, out-of-the-box client-side caching and automatic deduplication
 * via @tanstack/react-query.
 */
export function useCategories(categorySlug: string) {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["catalog-categories", categorySlug],
    queryFn: () => getSubCategories(categorySlug),
    enabled: !!categorySlug,
    staleTime: 5 * 60 * 1000, // 5 minutes cache for static subcategories
    gcTime: 10 * 60 * 1000,   // 10 minutes garbage collection
  });

  return { 
    data, 
    isLoading, 
    error: error instanceof Error ? error : error ? new Error(String(error)) : null 
  };
}
