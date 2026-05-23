export interface SubCategory {
  id: string;
  title: string;
  image: string;
  href: string;
  description?: string;
}

export interface Size {
  value: string;
  isAvailable: boolean;
}

export interface Variant {
  id: string;
  productId: string;
  sku: string;
  size: string | null;
  color: string | null;
}

export interface Product {
  id: string;
  name: string;
  color: string;
  price: number;
  priceUsd?: number | null;
  priceSgd?: number | null;
  currency: string;
  images: string[];
  href: string;
  sizes: Size[];
  status?: string;
  categoryIds?: string[];
  variants?: Variant[];
}

export interface CategoryPageData {
  title: string;
  description: string;
  gender: 'women' | 'men';
  subCategories: SubCategory[];
}
