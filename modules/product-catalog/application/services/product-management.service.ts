import {
  IProductRepository,
  ProductQueryOptions,
  ProductEnrichment,
  ProductMediaEnrichment,
} from "../../domain/repositories/product.repository";
import { IProductTagAssociationRepository } from "../../domain/repositories/product-tag-association.repository";
import { Product, ProductDTO } from "../../domain/entities/product.entity";
import { ProductStatus } from "../../domain/value-objects";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { ProductId } from "../../domain/value-objects/product-id.vo";
import { CategoryId } from "../../domain/value-objects/category-id.vo";
import { ProductTagAssociation } from "../../domain/entities/product-tag-association.entity";
import { Slug } from "../../domain/value-objects/slug.vo";
import { IHtmlSanitizer } from "./ihtml-sanitizer.service";
import {
  DomainValidationError,
  ProductAlreadyExistsError,
  ProductNotFoundError,
  InvalidOperationError,
} from "../../domain/errors";
import { randomUUID } from "crypto";

// ── Input / result types ─────────────────────────────────────────────

export interface CreateProductInput {
  title: string;
  brand?: string | null;
  shortDesc?: string | null;
  longDescHtml?: string | null;
  status?: ProductStatus;
  publishAt?: Date;
  countryOfOrigin?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  price?: number;
  currency?: string;
  priceSgd?: number | null;
  priceUsd?: number | null;
  compareAtPrice?: number | null;
  categoryIds?: string[];
  tags?: string[];
}

export type UpdateProductInput = Partial<CreateProductInput>;

export interface ListProductsOptions {
  page?: number;
  limit?: number;
  sortBy?: ProductQueryOptions["sortBy"];
  sortOrder?: ProductQueryOptions["sortOrder"];
  includeDrafts?: boolean;
  categoryId?: string;
  brand?: string;
  status?: string;
}

// ── Service ───────────────────────────────────────────────────────────

export class ProductManagementService {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly tagAssociationRepository?: IProductTagAssociationRepository,
    private readonly htmlSanitizer?: IHtmlSanitizer,
  ) {}

  // NOTE: product + categories + tags are written in three separate transactions.
  // For full atomicity, wrap these in a service-level `withTransaction(tx => …)`
  // helper once a UnitOfWork pattern is adopted across the codebase.
  async createProduct(data: CreateProductInput): Promise<ProductDTO> {
    if (!data.categoryIds || data.categoryIds.length === 0) {
      throw new DomainValidationError("Product must have at least one category");
    }

    const sanitized = this.sanitizeProductInput(data);
    const product = Product.create(sanitized);

    await this.assertSlugAvailable(product.slug);

    await this.productRepository.save(product);
    await this.productRepository.replaceCategories(
      product.id,
      data.categoryIds.map((cid) => CategoryId.fromString(cid)),
    );

    if (data.tags && data.tags.length > 0) {
      await this.replaceProductTags(product.id, data.tags);
    }

    return Product.toDTO(product);
  }

  async getProductById(id: string): Promise<ProductDTO> {
    return Product.toDTO(await this.getProduct(id));
  }

  async getProductBySlug(slug: string): Promise<ProductDTO> {
    if (!slug || slug.trim().length === 0) {
      throw new DomainValidationError("Product slug is required");
    }

    const productSlug = Slug.fromString(slug.trim());
    const product = await this.productRepository.findBySlug(productSlug);
    if (!product) {
      throw new ProductNotFoundError(slug);
    }
    return Product.toDTO(product);
  }

  async getAllProducts(
    options?: ListProductsOptions,
  ): Promise<PaginatedResult<ProductDTO>> {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      includeDrafts = false,
      categoryId,
      brand,
      status,
    } = options ?? {};

    const offset = (page - 1) * limit;
    const effectiveIncludeDrafts = status ? true : includeDrafts;
    const categoryIdVo = categoryId ? CategoryId.fromString(categoryId) : undefined;
    const statusVo = status ? this.parseStatus(status) : undefined;

    const queryOptions: ProductQueryOptions = {
      limit,
      offset,
      sortBy,
      sortOrder,
      includeDrafts: effectiveIncludeDrafts,
      brand,
      categoryId: categoryIdVo,
      status: statusVo,
    };

    const [products, total] = await Promise.all([
      this.productRepository.findAll(queryOptions),
      this.productRepository.count({
        brand,
        categoryId: categoryIdVo,
        status: statusVo,
      }),
    ]);

    return {
      items: products.map((p) => Product.toDTO(p)),
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  async getProductsByStatus(
    status: string,
    options?: ProductQueryOptions,
  ): Promise<ProductDTO[]> {
    const statusVo = this.parseStatus(status);
    const products = await this.productRepository.findByStatus(statusVo, options);
    return products.map((p) => Product.toDTO(p));
  }

  async getProductsByBrand(
    brand: string,
    options?: ProductQueryOptions,
  ): Promise<ProductDTO[]> {
    if (!brand || brand.trim().length === 0) {
      throw new DomainValidationError("Brand is required");
    }

    const products = await this.productRepository.findByBrand(brand.trim(), options);
    return products.map((p) => Product.toDTO(p));
  }

  async getProductsByCategory(
    categoryId: string,
    options?: ProductQueryOptions,
  ): Promise<ProductDTO[]> {
    if (!categoryId || categoryId.trim().length === 0) {
      throw new DomainValidationError("Category ID is required");
    }

    const products = await this.productRepository.findByCategory(
      CategoryId.fromString(categoryId),
      options,
    );
    return products.map((p) => Product.toDTO(p));
  }

  // NOTE: same atomicity caveat as createProduct — three separate transactions.
  async updateProduct(id: string, data: UpdateProductInput): Promise<ProductDTO> {
    const product = await this.getProduct(id);
    const sanitized = this.sanitizeProductInput(data);

    if (sanitized.title !== undefined) product.updateTitle(sanitized.title);
    if (sanitized.brand !== undefined) product.updateBrand(sanitized.brand ?? null);
    if (sanitized.shortDesc !== undefined) product.updateShortDesc(sanitized.shortDesc ?? null);
    if (sanitized.longDescHtml !== undefined) product.updateLongDescHtml(sanitized.longDescHtml ?? null);
    if (sanitized.countryOfOrigin !== undefined) {
      product.updateCountryOfOrigin(sanitized.countryOfOrigin ?? null);
    }
    if (sanitized.seoTitle !== undefined || sanitized.seoDescription !== undefined) {
      product.updateSeoInfo(
        sanitized.seoTitle ?? null,
        sanitized.seoDescription ?? null,
      );
    }

    if (data.status !== undefined) {
      this.applyStatusTransition(product, data.status, data.publishAt);
    }

    if (data.categoryIds !== undefined) {
      if (data.categoryIds.length === 0) {
        throw new InvalidOperationError("Product must have at least one category");
      }
      await this.productRepository.replaceCategories(
        ProductId.fromString(id),
        data.categoryIds.map((cid) => CategoryId.fromString(cid)),
      );
    }

    if (data.tags !== undefined) {
      await this.replaceProductTags(ProductId.fromString(id), data.tags);
    }

    await this.productRepository.save(product);
    return Product.toDTO(product);
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await this.getProduct(id);
    product.archive();
    await this.productRepository.save(product);
  }

  // ── Enrichment / read projections ──────────────────────────────────

  async getProductEnrichment(
    productIds: string[],
  ): Promise<Map<string, ProductEnrichment>> {
    return this.productRepository.findWithEnrichment(
      productIds.map((id) => ProductId.fromString(id)),
    );
  }

  async getSingleProductEnrichment(productId: string): Promise<ProductEnrichment> {
    const idVo = ProductId.fromString(productId);
    const enrichment = await this.productRepository.findOneWithEnrichment(idVo);
    if (!enrichment) throw new ProductNotFoundError(productId);
    return enrichment;
  }

  async getProductMediaEnrichment(productId: string): Promise<ProductMediaEnrichment> {
    const idVo = ProductId.fromString(productId);
    if (!(await this.productRepository.exists(idVo))) {
      throw new ProductNotFoundError(productId);
    }
    return this.productRepository.findMediaEnrichment(idVo);
  }

  // ── Private helpers ─────────────────────────────────────────────────

  private async getProduct(id: string): Promise<Product> {
    if (!id || id.trim().length === 0) {
      throw new DomainValidationError("Product ID is required");
    }
    const productId = ProductId.fromString(id);
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new ProductNotFoundError(id);
    }
    return product;
  }

  private parseStatus(status: string): ProductStatus {
    if (!status || status.trim().length === 0) {
      throw new DomainValidationError("Status is required");
    }
    const validStatuses = Object.values(ProductStatus);
    if (!validStatuses.includes(status as ProductStatus)) {
      throw new DomainValidationError(
        `Status must be one of: ${validStatuses.join(", ")}`,
      );
    }
    return status as ProductStatus;
  }

  private applyStatusTransition(
    product: Product,
    rawStatus: string,
    publishAt: Date | undefined,
  ): void {
    const status = this.parseStatus(rawStatus);
    switch (status) {
      case ProductStatus.PUBLISHED:
        product.publish();
        return;
      case ProductStatus.DRAFT:
        product.unpublish();
        return;
      case ProductStatus.SCHEDULED:
        if (!publishAt) {
          throw new DomainValidationError(
            "publishAt is required when scheduling a product",
          );
        }
        product.schedulePublication(publishAt);
        return;
      case ProductStatus.ARCHIVED:
        product.archive();
        return;
    }
  }

  // Sanitize any HTML-bearing fields. shortDesc is plain text → title sanitizer.
  // longDescHtml is rich content → full HTML sanitizer.
  private sanitizeProductInput<T extends UpdateProductInput>(input: T): T {
    if (!this.htmlSanitizer) return input;

    const sanitized: T = { ...input };
    if (sanitized.title !== undefined) {
      sanitized.title = this.htmlSanitizer.sanitizeTitle(sanitized.title);
    }
    if (sanitized.shortDesc !== undefined && sanitized.shortDesc !== null) {
      sanitized.shortDesc = this.htmlSanitizer.sanitizeTitle(sanitized.shortDesc);
    }
    if (sanitized.longDescHtml !== undefined && sanitized.longDescHtml !== null) {
      sanitized.longDescHtml = this.htmlSanitizer.sanitize(sanitized.longDescHtml);
    }
    if (sanitized.seoTitle !== undefined && sanitized.seoTitle !== null) {
      sanitized.seoTitle = this.htmlSanitizer.sanitizeTitle(sanitized.seoTitle);
    }
    if (sanitized.seoDescription !== undefined && sanitized.seoDescription !== null) {
      sanitized.seoDescription = this.htmlSanitizer.sanitizeTitle(sanitized.seoDescription);
    }
    return sanitized;
  }

  private async replaceProductTags(
    productId: ProductId,
    tagIds: string[],
  ): Promise<void> {
    if (!this.tagAssociationRepository) return;
    await this.tagAssociationRepository.deleteAllForProduct(productId);
    for (const tagId of tagIds) {
      const association = ProductTagAssociation.create({
        id: randomUUID(),
        productId: productId.getValue(),
        tagId,
      });
      await this.tagAssociationRepository.save(association);
    }
  }

  // Race-prone soft check; the DB should enforce a unique index on slug.
  // The global P2002 handler maps DB violations to a 409 response.
  private async assertSlugAvailable(slug: Slug): Promise<void> {
    if (await this.productRepository.existsBySlug(slug)) {
      throw new ProductAlreadyExistsError(slug.getValue());
    }
  }
}
