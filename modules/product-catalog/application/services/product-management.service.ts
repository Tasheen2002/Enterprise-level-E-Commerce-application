import {
  IProductRepository,
  ProductQueryOptions,
  ProductEnrichment,
  ProductMediaEnrichment,
} from "../../domain/repositories/product.repository";
import { IProductTagRepository } from "../../domain/repositories/product-tag.repository";
import {
  Product,
  CreateProductData,
} from "../../domain/entities/product.entity";
import { ProductId } from "../../domain/value-objects/product-id.vo";
import { Slug } from "../../domain/value-objects/slug.vo";
import {
  DomainValidationError,
  ProductAlreadyExistsError,
  InvalidOperationError,
} from "../../domain/errors";

export class ProductManagementService {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly productTagRepository?: IProductTagRepository,
  ) {}

  async createProduct(data: CreateProductData): Promise<Product> {
    // Validate categories - product must have at least one category
    if (!data.categoryIds || data.categoryIds.length === 0) {
      throw new DomainValidationError(
        "Product must have at least one category",
      );
    }

    // Create the product entity (entity validates its own invariants)
    const product = Product.create(data);

    // Check if slug already exists
    const existingProduct = await this.productRepository.existsBySlug(
      product.getSlug(),
    );
    if (existingProduct) {
      throw new ProductAlreadyExistsError(product.getSlug().getValue());
    }

    // Save the product with categories in a transaction
    await this.productRepository.saveWithCategories(product, data.categoryIds);

    // Handle tag associations
    if (data.tags && data.tags.length > 0 && this.productTagRepository) {
      await this.productTagRepository.associateProductTags(
        product.getId().getValue(),
        data.tags,
      );
    }

    return product;
  }

  async getProductById(id: string): Promise<Product> {
    if (!id || id.trim().length === 0) {
      throw new DomainValidationError("Product ID is required");
    }

    try {
      const productId = ProductId.fromString(id);
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw new ProductNotFoundError(id);
      }
      return product;
    } catch (error) {
      if (error instanceof Error && error.message.includes("valid UUID")) {
        throw new DomainValidationError("Invalid product ID format");
      }
      throw error;
    }
  }

  async getProductBySlug(slug: string): Promise<Product> {
    if (!slug || slug.trim().length === 0) {
      throw new DomainValidationError("Product slug is required");
    }

    try {
      const productSlug = Slug.fromString(slug.trim());
      const product = await this.productRepository.findBySlug(productSlug);
      if (!product) {
        throw new ProductNotFoundError(slug);
      }
      return product;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("lowercase letters, numbers, and hyphens")
      ) {
        throw new DomainValidationError("Invalid slug format");
      }
      throw error;
    }
  }

  async getAllProducts(
    options?: ProductQueryOptions & {
      page?: number;
      limit?: number;
      categoryId?: string;
      brand?: string;
      status?: string;
    },
  ): Promise<{ items: Product[]; totalCount: number }> {
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

    // Get all products first, then apply filters progressively (AND logic like variants)
    let products = await this.productRepository.findAll({
      sortBy,
      sortOrder,
      includeDrafts: effectiveIncludeDrafts,
    });

    // Apply filters progressively (AND logic)
    if (brand) {
      products = products.filter((p) => p.getBrand() === brand);
    }

    if (categoryId) {
      // For categoryId, we need to get products in that category
      const categoryProducts = await this.productRepository.findByCategory(
        categoryId,
        {
          sortBy,
          sortOrder,
          includeDrafts: effectiveIncludeDrafts,
        },
      );

      // If we have other filters, apply them to category results
      if (brand) {
        products = categoryProducts.filter((p) => p.getBrand() === brand);
      } else {
        products = categoryProducts;
      }
    }

    if (status) {
      products = products.filter((p) => p.getStatus().toString() === status);
    }

    // Get total count before pagination
    const totalCount = products.length;

    // Apply pagination
    const startIndex = offset;
    const paginatedProducts = products.slice(startIndex, startIndex + limit);

    return {
      items: paginatedProducts,
      totalCount,
    };
  }

  async getProductsByStatus(
    status: string,
    options?: ProductQueryOptions,
  ): Promise<Product[]> {
    if (!status || status.trim().length === 0) {
      throw new DomainValidationError("Status is required");
    }

    const validStatuses = ["draft", "published", "scheduled"];
    if (!validStatuses.includes(status)) {
      throw new DomainValidationError(
        `Status must be one of: ${validStatuses.join(", ")}`,
      );
    }

    return await this.productRepository.findByStatus(status, options);
  }

  async getProductsByBrand(
    brand: string,
    options?: ProductQueryOptions,
  ): Promise<Product[]> {
    if (!brand || brand.trim().length === 0) {
      throw new DomainValidationError("Brand is required");
    }

    return await this.productRepository.findByBrand(brand.trim(), options);
  }

  async getProductsByCategory(
    categoryId: string,
    options?: ProductQueryOptions,
  ): Promise<Product[]> {
    if (!categoryId || categoryId.trim().length === 0) {
      throw new DomainValidationError("Category ID is required");
    }

    return await this.productRepository.findByCategory(categoryId, options);
  }

  async updateProduct(
    id: string,
    data: Partial<CreateProductData>,
  ): Promise<Product> {
    const product = await this.getProductById(id);

    // Update fields if provided
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

    // Handle categoryIds - validate and update associations
    if (data.categoryIds !== undefined) {
      // Validate that product will have at least one category
      if (data.categoryIds.length === 0) {
        throw new InvalidOperationError(
          "Product must have at least one category",
        );
      }

      // Replace category associations
      await this.productRepository.replaceCategories(id, data.categoryIds);
    }

    // Handle tag association updates
    if (data.tags !== undefined && this.productTagRepository) {
      await this.productTagRepository.associateProductTags(id, data.tags);
    }

    // Save the updated product
    await this.productRepository.update(product);

    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await this.getProductById(id);

    try {
      const productId = ProductId.fromString(id);
      await this.productRepository.delete(productId);
    } catch (error) {
      if (error instanceof Error && error.message.includes("constraint")) {
        throw new InvalidOperationError(
          "Cannot delete product: it has associated variants or other dependencies",
        );
      }
      throw error;
    }
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
}
