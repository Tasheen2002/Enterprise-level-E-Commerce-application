export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  position?: number | null;
  createdAt?: string;
  updatedAt?: string;
}
