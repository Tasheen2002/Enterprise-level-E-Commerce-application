import {
  IProductRepository,
  ProductQueryOptions,
  ProductEnrichment,
  ProductMediaEnrichment,
} from "../../domain/repositories/product.repository";
import { IProductTagRepository } from "../../domain/repositories/product-tag.repository";
import {
  Product,
  ProductDTO,
} from "../../domain/entities/product.entity";

/** Input shape for creating/updating a product — mirrors Product.create() params */
type CreateProductInput = {
  title: string;
  brand?: string;
  shortDesc?: string;
  longDescHtml?: string;
  status?: import("../../domain/enums/product-catalog.enums").ProductStatus;
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
};
import { ProductId } from "../../domain/value-objects/product-id.vo";
import { Slug } from "../../domain/value-objects/slug.vo";
import {
  DomainValidationError,
  ProductAlreadyExistsError,
  ProductNotFoundError,
  InvalidOperationError,
} from "../../domain/errors";

export class ProductManagementService {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly productTagRepository?: IProductTagRepository,
  ) {}

  async createProduct(data: CreateProductInput): Promise<ProductDTO> {
    if (!data.categoryIds || data.categoryIds.length === 0) {
      throw new DomainValidationError(
        "Product must have at least one category",
      );
    }

    const product = Product.create(data);

    const existingProduct = await this.productRepository.existsBySlug(
      product.slug,
    );
    if (existingProduct) {
      throw new ProductAlreadyExistsError(product.slug.getValue());
    }

    await this.productRepository.saveWithCategories(product, data.categoryIds);

    if (data.tags && data.tags.length > 0 && this.productTagRepository) {
      await this.productTagRepository.associateProductTags(
        product.id.getValue(),
        data.tags,
      );
    }

    return Product.toDTO(product);
  }

  async getProductById(id: string): Promise<ProductDTO> {
    return Product.toDTO(await this._getProduct(id));
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
    options?: ProductQueryOptions & {
      page?: number;
      limit?: number;
      categoryId?: string;
      brand?: string;
      status?: string;
    },
  ): Promise<{ items: ProductDTO[]; totalCount: number }> {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      includeDrafts = false,
      categoryId,
      brand,
      status,
    } = options || {};

    const offset = (page - 1) * limit;
    const effectiveIncludeDrafts = status ? true : includeDrafts;

    let products = await this.productRepository.findAll({
      sortBy,
      sortOrder,
      includeDrafts: effectiveIncludeDrafts,
    });

    if (brand) {
      products = products.filter((p) => p.brand === brand);
    }

    if (categoryId) {
      const categoryProducts = await this.productRepository.findByCategory(
        categoryId,
        { sortBy, sortOrder, includeDrafts: effectiveIncludeDrafts },
      );

      if (brand) {
        products = categoryProducts.filter((p) => p.brand === brand);
      } else {
        products = categoryProducts;
      }
    }

    if (status) {
      products = products.filter((p) => p.status.toString() === status);
    }

    const totalCount = products.length;
    const paginatedProducts = products.slice(offset, offset + limit);

    return {
      items: paginatedProducts.map((p) => Product.toDTO(p)),
      totalCount,
    };
  }

  async getProductsByStatus(
    status: string,
    options?: ProductQueryOptions,
  ): Promise<ProductDTO[]> {
    if (!status || status.trim().length === 0) {
      throw new DomainValidationError("Status is required");
    }

    const validStatuses = ["draft", "published", "scheduled", "archived"];
    if (!validStatuses.includes(status)) {
      throw new DomainValidationError(
        `Status must be one of: ${validStatuses.join(", ")}`,
      );
    }

    const products = await this.productRepository.findByStatus(status, options);
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

    const products = await this.productRepository.findByCategory(categoryId, options);
    return products.map((p) => Product.toDTO(p));
  }

  async updateProduct(
    id: string,
    data: Partial<CreateProductInput>,
  ): Promise<ProductDTO> {
    const product = await this._getProduct(id);

    if (data.title !== undefined) {
      product.updateTitle(data.title);
    }

    if (data.brand !== undefined) {
      product.updateBrand(data.brand);
    }

    if (data.shortDesc !== undefined) {
      product.updateShortDesc(data.shortDesc);
    }

    if (data.longDescHtml !== undefined) {
      product.updateLongDescHtml(data.longDescHtml);
    }

    if (data.countryOfOrigin !== undefined) {
      product.updateCountryOfOrigin(data.countryOfOrigin);
    }

    if (data.seoTitle !== undefined || data.seoDescription !== undefined) {
      product.updateSeoInfo(data.seoTitle || null, data.seoDescription || null);
    }

    if (data.status !== undefined) {
      switch (data.status) {
        case "published":
          product.publish();
          break;
        case "draft":
          product.unpublish();
          break;
        case "scheduled":
          if (data.publishAt) {
            product.schedulePublication(data.publishAt);
          }
          break;
        case "archived":
          product.archive();
          break;
      }
    }

    if (data.categoryIds !== undefined) {
      if (data.categoryIds.length === 0) {
        throw new InvalidOperationError(
          "Product must have at least one category",
        );
      }
      await this.productRepository.replaceCategories(id, data.categoryIds);
    }

    if (data.tags !== undefined && this.productTagRepository) {
      await this.productTagRepository.associateProductTags(id, data.tags);
    }

    await this.productRepository.update(product);

    return Product.toDTO(product);
  }

  async deleteProduct(id: string): Promise<void> {
    await this._getProduct(id);
    const productId = ProductId.fromString(id);
    await this.productRepository.delete(productId);
  }

  async getProductEnrichment(
    productIds: string[],
  ): Promise<Map<string, ProductEnrichment>> {
    return this.productRepository.findWithEnrichment(productIds);
  }

  async getSingleProductEnrichment(
    productId: string,
  ): Promise<ProductEnrichment> {
    return this.productRepository.findOneWithEnrichment(productId);
  }

  async getProductMediaEnrichment(
    productId: string,
  ): Promise<ProductMediaEnrichment> {
    return this.productRepository.findMediaEnrichment(productId);
  }

  private async _getProduct(id: string): Promise<Product> {
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
}
