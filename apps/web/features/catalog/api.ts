import { SubCategory, Product } from "./types";
import { imageKitUrl } from "../../lib/imagekit";

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

export const HEELED_SANDALS_DATA: Product[] = [
  {
    id: "piper-mocha",
    name: "PIPER",
    color: "Mocha Dots",
    price: 230,
    currency: "US$",
    images: [
      imageKitUrl("piper_mocha_primary.png"),
      imageKitUrl("piper_mocha_hover.png"),
      imageKitUrl("piper_mocha_detail.png"),
      imageKitUrl("piper_mocha_lifestyle_alt.png"),
      imageKitUrl("piper_mocha_flatlay.png")
    ],
    href: "/catalog/women/heeled-sandals/piper-mocha",
    sizes: DEFAULT_SIZES,
  },
  {
    id: "suki-mocha",
    name: "SUKI",
    color: "Mocha Dots",
    price: 230,
    currency: "US$",
    images: [
      imageKitUrl("suki_mocha_primary.png"),
      imageKitUrl("suki_mocha_hover.png"),
      imageKitUrl("suki_mocha_detail.png"),
      imageKitUrl("suki_mocha_lifestyle_alt.png"),
      imageKitUrl("suki_mocha_flatlay.png")
    ],
    href: "/catalog/women/heeled-sandals/suki-mocha",
    sizes: DEFAULT_SIZES,
  },
  {
    id: "lenka-mocha",
    name: "LENKA",
    color: "Mocha Dots",
    price: 240,
    currency: "US$",
    images: [
      imageKitUrl("lenka_mocha_primary.png"),
      imageKitUrl("lenka_mocha_hover.png"),
      imageKitUrl("lenka_mocha_detail.png"),
      imageKitUrl("lenka_mocha_lifestyle_alt.png"),
      imageKitUrl("lenka_mocha_flatlay.png")
    ],
    href: "/catalog/women/heeled-sandals/lenka-mocha",
    sizes: DEFAULT_SIZES,
  },
  {
    id: "june-mocha",
    name: "JUNE",
    color: "Mocha Dots",
    price: 215,
    currency: "US$",
    images: [
      imageKitUrl("june_mocha_hero.jpg"),
      imageKitUrl("june_mocha_primary.png"),
      imageKitUrl("june_mocha_hover.png"),
      imageKitUrl("june_mocha_side.jpg"),
      imageKitUrl("june_mocha_sole.jpg")
    ],
    href: "/catalog/women/heeled-sandals/june-mocha",
    sizes: DEFAULT_SIZES,
  },
];

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
export async function getProducts(category: string): Promise<Product[]> {
  if (category === "heeled-sandals") {
    return Promise.resolve(HEELED_SANDALS_DATA);
  }
  return Promise.resolve([]);
}

/**
 * Fetches a single product by its slug.
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const allProducts = [...HEELED_SANDALS_DATA];
  // Simple slug match for now (slug is usually the last part of the href or the id)
  const product = allProducts.find(p => p.id === slug || p.href.endsWith(slug));
  return Promise.resolve(product || null);
}
