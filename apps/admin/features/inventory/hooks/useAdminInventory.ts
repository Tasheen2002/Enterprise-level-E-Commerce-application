import { useState, useEffect, useCallback } from "react";
import { inventoryApi } from "../api";
import { Stock } from "../types";

export function useAdminInventory() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [variantMap, setVariantMap] = useState<Record<string, { sku: string; size: string; productName: string }>>({});
  const [loading, setLoading] = useState(true);

  const fetchStocks = useCallback(async () => {
    try {
      const res = await inventoryApi.fetchStocks(100, 0);
      setStocks(res);
    } catch (err) {
      console.error("Failed to load inventory stock levels", err);
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    try {
      const locList = await inventoryApi.getLocations();
      setLocations(locList);
    } catch (e) {
      console.error("Failed to load facility locations", e);
    }
  }, []);

  const fetchAllVariants = useCallback(async () => {
    try {
      const productsList = await inventoryApi.getProducts();
      const newMap: Record<string, { sku: string; size: string; productName: string }> = {};

      const chunkSize = 5;
      for (let i = 0; i < productsList.length; i += chunkSize) {
        const chunk = productsList.slice(i, i + chunkSize);
        await Promise.all(
          chunk.map(async (prod) => {
            try {
              const variants = await inventoryApi.getProductVariants(prod.id!);
              if (variants) {
                variants.forEach((v: any) => {
                  newMap[v.variantId || v.id] = {
                    sku: v.sku,
                    size: v.size || "",
                    productName: prod.title || "",
                  };
                });
              }
            } catch (err) {
              console.error(`Failed to fetch variants for product ${prod.id}`, err);
            }
          })
        );
      }
      setVariantMap(newMap);
    } catch (e) {
      console.error("Failed to map variant database entries", e);
    }
  }, []);

  const handleInitialFetch = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStocks(), fetchLocations(), fetchAllVariants()]);
    setLoading(false);
  }, [fetchStocks, fetchLocations, fetchAllVariants]);

  useEffect(() => {
    handleInitialFetch();
  }, [handleInitialFetch]);

  return {
    stocks,
    locations,
    variantMap,
    loading,
    refetch: fetchStocks,
    refetchLocations: fetchLocations,
    refetchAll: handleInitialFetch,
  };
}
