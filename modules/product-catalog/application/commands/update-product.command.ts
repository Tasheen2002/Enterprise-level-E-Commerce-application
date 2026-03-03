import { ICommand } from "@/api/src/shared/application";
import { ProductStatus } from "../../domain/entities/product.entity";

export interface UpdateProductCommand extends ICommand {
  productId: string;
  title?: string;
  brand?: string;
  shortDesc?: string;
  longDescHtml?: string;
  status?: ProductStatus;
  publishAt?: Date;
  countryOfOrigin?: string;
  seoTitle?: string;
  seoDescription?: string;
  price?: number;
  priceSgd?: number | null;
  priceUsd?: number | null;
  compareAtPrice?: number | null;
  categoryIds?: string[];
  tags?: string[];
}
