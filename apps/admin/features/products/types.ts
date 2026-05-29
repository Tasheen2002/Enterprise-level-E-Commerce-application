export interface Category {
  id: string;
  title: string;
  slug: string;
}

export interface Product {
  id?: string;
  title: string;
  slug: string;
  brand?: string;
  shortDesc?: string;
  longDescHtml?: string;
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";
  price: number;
  compareAtPrice?: number | null;
  currency: string;
  seoTitle?: string;
  seoDescription?: string;
  categoryIds?: string[];
  sizes?: { value: string; isAvailable: boolean }[];
  images?: string[];
}

export interface Variant {
  id: string;
  sku: string;
  size?: string | null;
  color?: string | null;
  barcode?: string | null;
  weightG?: number | null;
  allowBackorder: boolean;
  allowPreorder: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  status: "pending" | "approved" | "rejected" | "flagged";
  title?: string;
  body?: string;
  createdAt: string;
  updatedAt: string;
  reviewerName?: string;
}

