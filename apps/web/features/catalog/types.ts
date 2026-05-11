export interface SubCategory {
  id: string;
  title: string;
  image: string;
  href: string;
  description?: string;
}

export interface CategoryPageData {
  title: string;
  description: string;
  gender: 'women' | 'men';
  subCategories: SubCategory[];
}
