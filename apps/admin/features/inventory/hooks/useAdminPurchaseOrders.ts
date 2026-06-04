import { useState, useEffect, useCallback } from "react";
import { inventoryApi } from "../api";
import { Supplier, PurchaseOrder } from "../types";

export function useAdminPurchaseOrders() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [productVariants, setProductVariants] = useState<any[]>([]);
  const [variantMap, setVariantMap] = useState<Record<string, { sku: string; size: string; productName: string }>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [supList, poList, locList, prodList] = await Promise.all([
        inventoryApi.getSuppliers(),
        inventoryApi.getPurchaseOrders(),
        inventoryApi.getLocations(),
        inventoryApi.getProducts(),
      ]);

      setSuppliers(supList);
      setPurchaseOrders(poList);
      setLocations(locList);

      if (prodList && prodList.length > 0) {
        const newMap: Record<string, { sku: string; size: string; productName: string }> = {};
        const variantsList: any[] = [];

        const chunkSize = 5;
        for (let i = 0; i < prodList.length; i += chunkSize) {
          const chunk = prodList.slice(i, i + chunkSize);
          await Promise.all(
            chunk.map(async (prod) => {
              try {
                const variants = await inventoryApi.getProductVariants(prod.id!);
                if (variants) {
                  variants.forEach((v: any) => {
                    const entry = {
                      variantId: v.variantId || v.id,
                      sku: v.sku,
                      size: v.size || "",
                      productName: prod.title || "",
                    };
                    newMap[v.variantId || v.id] = entry;
                    variantsList.push({ ...v, productName: prod.title });
                  });
                }
              } catch (err) {
                console.error(`Failed to fetch variants for product ${prod.id}`, err);
              }
            })
          );
        }

        setVariantMap(newMap);
        setProductVariants(variantsList);
      }
    } catch (err) {
      console.error("Error loading B2B data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    suppliers,
    purchaseOrders,
    locations,
    productVariants,
    variantMap,
    loading,
    refetch: fetchData,
  };
}
