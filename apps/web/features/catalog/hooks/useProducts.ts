import { useQuery } from "@tanstack/react-query";
import { getProducts } from "../api";

export function useProducts(category: string) {
  return useQuery({
    queryKey: ["products", category],
    queryFn: () => getProducts(category),
    enabled: !!category,
  });
}
