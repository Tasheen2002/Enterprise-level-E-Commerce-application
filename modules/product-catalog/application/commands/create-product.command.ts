import { ICommand } from "@/api/src/shared/application";
import { ProductStatus } from "../../domain/entities/product.entity";

export interface CreateProductCommand extends ICommand {
  title: string;
  brand?: string;
  shortDesc?: string;
  longDescHtml?: string;
  status?: ProductStatus;
  publishAt?: Date;
  countryOfOrigin?: string;
  seoTitle?: string;
  seoDescription?: string;
  price?: number;
  priceSgd?: number;
  priceUsd?: number;
  compareAtPrice?: number;
  categoryIds?: string[];
  tags?: string[];
}
