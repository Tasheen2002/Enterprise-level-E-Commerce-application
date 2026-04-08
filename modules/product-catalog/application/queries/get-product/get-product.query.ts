import { IQuery } from "@/api/src/shared/application";

export interface GetProductQuery extends IQuery {
  productId?: string;
  slug?: string;
}

export interface ProductResult {
  productId: string;
  title: string;
  slug: string;
  brand?: string;
  shortDesc?: string;
  longDescHtml?: string;
  status: string;
  publishAt?: Date;
  countryOfOrigin?: string;
  seoTitle?: string;
  seoDescription?: string;
  price: number;
  priceSgd?: number | null;
  priceUsd?: number | null;
  compareAtPrice?: number | null;
  createdAt: Date;
  updatedAt: Date;
}
