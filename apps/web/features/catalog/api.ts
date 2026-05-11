import { SubCategory } from "./types";
import { request } from "@/lib/api-client";

/**
 * Enterprise Pattern: Catalog API Service
 * 
 * This module uses the shared @/lib/api-client engine, ensuring 
 * consistency with User Management. 
 */

export const LEATHER_GOODS_DATA: SubCategory[] = [
  {
    id: "bags",
    title: "BAGS",
    image: "leather-bags-heritage.png",
    href: "/catalog/women/leather-goods/bags",
  },
  {
    id: "belts",
    title: "BELTS",
    image: "artisan-belts.png",
    href: "/catalog/women/leather-goods/belts",
  },
  {
    id: "small-leather-goods",
    title: "SMALL LEATHER GOODS",
    image: "small-leather-goods.png",
    href: "/catalog/women/leather-goods/wallets",
  },
  {
    id: "laptop-sleeves",
    title: "LAPTOP SLEEVES",
    image: "leather-laptop-sleeves.png",
    href: "/catalog/women/leather-goods/laptop-sleeves",
  },
  {
    id: "phone-straps",
    title: "PHONE STRAPS",
    image: "artisan-phone-straps.png",
    href: "/catalog/women/leather-goods/phone-straps",
  },
  {
    id: "view-all",
    title: "VIEW ALL",
    image: "view-all-editorial.png",
    href: "/catalog/women/leather-goods/all",
  },
];

/**
 * Fetches subcategories for a given parent category.
 * 
 * Note: While we're currently mocking the data to maintain visual 
 * fidelity during development, this function is architecturally wired 
 * to the shared request engine for easy production cutover.
 */
export async function getSubCategories(category: string): Promise<SubCategory[]> {
  // In production, this becomes:
  // return request<SubCategory[]>(`/catalog/categories/${category}/subcategories`, { method: "GET" });
  
  if (category === "leather-goods") {
    return Promise.resolve(LEATHER_GOODS_DATA);
  }
  return Promise.resolve([]);
}
