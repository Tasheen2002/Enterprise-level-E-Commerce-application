import { useQuery } from "@tanstack/react-query";
import { getProductBySlug } from "../api";

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug(slug),
    enabled: !!slug,
  });
}
