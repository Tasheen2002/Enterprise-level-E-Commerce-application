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

export interface Product {
  id: string;
  name: string;
  color: string;
  price: number;
  currency: string;
  images: string[];
  href: string;
  sizes: Size[];
}

export interface CategoryPageData {
  title: string;
  description: string;
  gender: 'women' | 'men';
  subCategories: SubCategory[];
}
