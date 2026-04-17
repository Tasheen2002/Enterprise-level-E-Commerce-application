import { ProductTagAssociation } from '../entities/product-tag-association.entity';
import { ProductId } from '../value-objects/product-id.vo';
import { ProductTagId } from '../value-objects/product-tag-id.vo';

export interface IProductTagAssociationRepository {
  // Core CRUD
  save(association: ProductTagAssociation): Promise<void>;
  delete(productId: ProductId, tagId: ProductTagId): Promise<void>;
  deleteAllForProduct(productId: ProductId): Promise<void>;

  // Queries
  findByProductId(productId: ProductId): Promise<ProductTagAssociation[]>;
  findByTagId(
    tagId: ProductTagId,
    options?: { limit?: number; offset?: number },
  ): Promise<ProductTagAssociation[]>;
  exists(productId: ProductId, tagId: ProductTagId): Promise<boolean>;
  countByTagId(tagId: ProductTagId): Promise<number>;
}
