import {
  IProductMediaRepository,
  ProductMediaQueryOptions,
} from "../../domain/repositories/product-media.repository";
import { IMediaAssetRepository } from "../../domain/repositories/media-asset.repository";
import { IProductRepository } from "../../domain/repositories/product.repository";
import {
  ProductMedia,
  ProductMediaId,
} from "../../domain/entities/product-media.entity";
import { MediaAssetId as EntityMediaAssetId } from "../../domain/entities/media-asset.entity";
import { ProductId } from "../../domain/value-objects/product-id.vo";
import { MediaAssetId } from "../../domain/value-objects/media-asset-id.vo";
import {
  ProductNotFoundError,
  MediaAssetNotFoundError,
  DomainValidationError,
  InvalidOperationError,
} from "../../domain/errors";

export interface ProductMediaServiceQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: "position" | "createdAt" | "isCover";
  sortOrder?: "asc" | "desc";
  coverOnly?: boolean;
}

export interface ProductMediaData {
  assetId: string;
  position?: number;
  isCover?: boolean;
}

export interface ProductMediaReorderData {
  assetId: string;
  position: number;
}

export interface ProductMediaSummary {
  productId: string;
  totalMedia: number;
  hasCoverImage: boolean;
  coverImageAssetId?: string;
  mediaAssets: Array<{
    assetId: string;
    position?: number;
    isCover: boolean;
    storageKey: string;
    mimeType: string;
    altText?: string;
  }>;
}

export class ProductMediaManagementService {
  constructor(
    private readonly productMediaRepository: IProductMediaRepository,
    private readonly mediaAssetRepository: IMediaAssetRepository,
    private readonly productRepository: IProductRepository,
  ) {}

  async addMediaToProduct(
    productId: string,
    assetId: string,
    position?: number,
    isCover?: boolean,
  ): Promise<string> {
    const productIdVo = ProductId.fromString(productId);
    const assetIdVo = MediaAssetId.fromString(assetId);

    // Validate product exists
    const product = await this.productRepository.findById(productIdVo);
    if (!product) {
      throw new ProductNotFoundError(productId);
    }

    // Validate asset exists
    const assetIdEntity = EntityMediaAssetId.fromString(assetId);
    const asset = await this.mediaAssetRepository.findById(assetIdEntity);
    if (!asset) {
      throw new MediaAssetNotFoundError(assetId);
    }

    // Check if association already exists
    const existingAssociation =
      await this.productMediaRepository.findAssociation(productIdVo, assetIdVo);
    if (existingAssociation) {
      throw new InvalidOperationError("Media asset is already associated with this product");
    }

    // If setting as cover image, remove existing cover flag
    if (isCover) {
      await this.productMediaRepository.removeCoverImageFlag(productIdVo);
    }

    // Determine position if not provided
    const finalPosition =
      position ??
      (await this.productMediaRepository.getNextPosition(productIdVo));

    const productMediaId = await this.productMediaRepository.addMediaToProduct(
      productIdVo,
      assetIdVo,
      finalPosition,
      isCover,
    );
    return productMediaId.toString();
  }

  async removeMediaFromProduct(
    productId: string,
    assetId: string,
  ): Promise<void> {
    const productIdVo = ProductId.fromString(productId);
    const assetIdVo = MediaAssetId.fromString(assetId);

    // Check if association exists
    const association = await this.productMediaRepository.findAssociation(
      productIdVo,
      assetIdVo,
    );
    if (!association) {
      throw new InvalidOperationError("Media asset is not associated with this product");
    }

    await this.productMediaRepository.removeMediaFromProduct(
      productIdVo,
      assetIdVo,
    );

    // Compact positions after removal
    await this.productMediaRepository.compactPositions(productIdVo);
  }

  async removeAllProductMedia(productId: string): Promise<void> {
    const productIdVo = ProductId.fromString(productId);

    // Validate product exists
    const product = await this.productRepository.findById(productIdVo);
    if (!product) {
      throw new ProductNotFoundError(productId);
    }

    await this.productMediaRepository.removeAllProductMedia(productIdVo);
  }

  async getProductMedia(
    productId: string,
    options: ProductMediaServiceQueryOptions = {},
  ): Promise<ProductMediaSummary> {
    const productIdVo = ProductId.fromString(productId);
    const {
      page = 1,
      limit = 50,
      sortBy = "position",
      sortOrder = "asc",
      coverOnly = false,
    } = options;

    // Validate product exists
    const product = await this.productRepository.findById(productIdVo);
    if (!product) {
      throw new ProductNotFoundError(productId);
    }

    const repositoryOptions: ProductMediaQueryOptions = {
      limit,
      offset: (page - 1) * limit,
      sortBy,
      sortOrder,
      coverOnly,
    };

    const [productMediaList, totalCount, coverImage] = await Promise.all([
      this.productMediaRepository.findByProductId(
        productIdVo,
        repositoryOptions,
      ),
      this.productMediaRepository.countProductMedia(productIdVo),
      this.productMediaRepository.getProductCoverImage(productIdVo),
    ]);

    // Get asset details for each product media
    const mediaAssets = await Promise.all(
      productMediaList.map(async (productMedia) => {
        const assetIdEntity = EntityMediaAssetId.fromString(
          productMedia.getAssetId().toString(),
        );
        const asset = await this.mediaAssetRepository.findById(assetIdEntity);
        return {
          assetId: productMedia.getAssetId().toString(),
          position: productMedia.getPosition() ?? undefined,
          isCover: productMedia.getIsCover(),
          storageKey: asset?.getStorageKey() || "",
          mimeType: asset?.getMime() || "",
          altText: asset?.getAltText() ?? undefined,
        };
      }),
    );

    return {
      productId,
      totalMedia: totalCount,
      hasCoverImage: !!coverImage,
      coverImageAssetId: coverImage?.getAssetId().toString(),
      mediaAssets,
    };
  }

  async setProductCoverImage(
    productId: string,
    assetId: string,
  ): Promise<void> {
    const productIdVo = ProductId.fromString(productId);
    const assetIdVo = MediaAssetId.fromString(assetId);

    // Check if media is associated with product
    const association = await this.productMediaRepository.findAssociation(
      productIdVo,
      assetIdVo,
    );
    if (!association) {
      throw new InvalidOperationError("Media asset is not associated with this product");
    }

    await this.productMediaRepository.setProductCoverImage(
      productIdVo,
      assetIdVo,
    );
  }

  async removeCoverImage(productId: string): Promise<void> {
    const productIdVo = ProductId.fromString(productId);

    // Validate product exists
    const product = await this.productRepository.findById(productIdVo);
    if (!product) {
      throw new ProductNotFoundError(productId);
    }

    await this.productMediaRepository.removeCoverImageFlag(productIdVo);
  }

  async reorderProductMedia(
    productId: string,
    reorderData: ProductMediaReorderData[],
  ): Promise<void> {
    const productIdVo = ProductId.fromString(productId);

    // Validate product exists
    const product = await this.productRepository.findById(productIdVo);
    if (!product) {
      throw new ProductNotFoundError(productId);
    }

    // Validate all assets are associated with the product
    for (const item of reorderData) {
      const assetIdVo = MediaAssetId.fromString(item.assetId);
      const association = await this.productMediaRepository.findAssociation(
        productIdVo,
        assetIdVo,
      );
      if (!association) {
        throw new InvalidOperationError(
          `Media asset ${item.assetId} is not associated with this product`,
        );
      }
    }

    // Convert to repository format
    const mediaOrdering = reorderData.map((item) => ({
      assetId: MediaAssetId.fromString(item.assetId),
      position: item.position,
    }));

    await this.productMediaRepository.reorderProductMedia(
      productIdVo,
      mediaOrdering,
    );
  }

  async moveMediaPosition(
    productId: string,
    assetId: string,
    newPosition: number,
  ): Promise<void> {
    const productIdVo = ProductId.fromString(productId);
    const assetIdVo = MediaAssetId.fromString(assetId);

    // Check if association exists
    const association = await this.productMediaRepository.findAssociation(
      productIdVo,
      assetIdVo,
    );
    if (!association) {
      throw new InvalidOperationError("Media asset is not associated with this product");
    }

    if (newPosition < 1) {
      throw new DomainValidationError("Position must be greater than 0");
    }

    await this.productMediaRepository.moveMediaPosition(
      productIdVo,
      assetIdVo,
      newPosition,
    );
  }

  async setProductMedia(
    productId: string,
    mediaData: ProductMediaData[],
  ): Promise<void> {
    const productIdVo = ProductId.fromString(productId);

    // Validate product exists
    const product = await this.productRepository.findById(productIdVo);
    if (!product) {
      throw new ProductNotFoundError(productId);
    }

    // Validate all assets exist
    for (const item of mediaData) {
      const assetIdEntity = EntityMediaAssetId.fromString(item.assetId);
      const asset = await this.mediaAssetRepository.findById(assetIdEntity);
      if (!asset) {
        throw new MediaAssetNotFoundError(item.assetId);
      }
    }

    // Ensure only one cover image
    const coverImages = mediaData.filter((item) => item.isCover);
    if (coverImages.length > 1) {
      throw new InvalidOperationError("Only one media asset can be set as cover image");
    }

    // Convert to repository format
    const repositoryData = mediaData.map((item) => ({
      assetId: MediaAssetId.fromString(item.assetId),
      position: item.position,
      isCover: item.isCover || false,
    }));

    await this.productMediaRepository.setProductMedia(
      productIdVo,
      repositoryData,
    );
  }

  async duplicateProductMedia(
    sourceProductId: string,
    targetProductId: string,
  ): Promise<void> {
    const sourceProductIdVo = ProductId.fromString(sourceProductId);
    const targetProductIdVo = ProductId.fromString(targetProductId);

    // Validate both products exist
    const [sourceProduct, targetProduct] = await Promise.all([
      this.productRepository.findById(sourceProductIdVo),
      this.productRepository.findById(targetProductIdVo),
    ]);

    if (!sourceProduct) {
      throw new ProductNotFoundError(sourceProductId);
    }

    if (!targetProduct) {
      throw new ProductNotFoundError(targetProductId);
    }

    await this.productMediaRepository.duplicateProductMedia(
      sourceProductIdVo,
      targetProductIdVo,
    );
  }

  async getProductsUsingAsset(assetId: string): Promise<string[]> {
    const assetIdVo = MediaAssetId.fromString(assetId);

    // Validate asset exists
    const assetIdEntity = EntityMediaAssetId.fromString(assetId);
    const asset = await this.mediaAssetRepository.findById(assetIdEntity);
    if (!asset) {
      throw new MediaAssetNotFoundError(assetId);
    }

    const productIds =
      await this.productMediaRepository.getProductsUsingAsset(assetIdVo);
    return productIds.map((id) => id.toString());
  }

  async getAssetUsageCount(assetId: string): Promise<number> {
    const assetIdVo = MediaAssetId.fromString(assetId);

    // Validate asset exists
    const assetIdEntity = EntityMediaAssetId.fromString(assetId);
    const asset = await this.mediaAssetRepository.findById(assetIdEntity);
    if (!asset) {
      throw new MediaAssetNotFoundError(assetId);
    }

    return await this.productMediaRepository.countAssetUsage(assetIdVo);
  }

  async compactProductMediaPositions(productId: string): Promise<void> {
    const productIdVo = ProductId.fromString(productId);

    // Validate product exists
    const product = await this.productRepository.findById(productIdVo);
    if (!product) {
      throw new ProductNotFoundError(productId);
    }

    await this.productMediaRepository.compactPositions(productIdVo);
  }

  async validateProductMedia(productId: string): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const productIdVo = ProductId.fromString(productId);

    // Validate product exists
    const product = await this.productRepository.findById(productIdVo);
    if (!product) {
      return {
        isValid: false,
        issues: ["Product not found"],
      };
    }

    const issues: string[] = [];

    // Get all product media
    const productMedia =
      await this.productMediaRepository.findByProductId(productIdVo);

    // Check for duplicate positions
    const positions = productMedia
      .map((pm) => pm.getPosition())
      .filter((pos) => pos !== null);
    const uniquePositions = new Set(positions);
    if (positions.length !== uniquePositions.size) {
      issues.push("Duplicate positions found");
    }

    // Check for multiple cover images
    const coverImages = productMedia.filter((pm) => pm.getIsCover());
    if (coverImages.length > 1) {
      issues.push("Multiple cover images found");
    }

    // Check if all referenced assets exist
    for (const pm of productMedia) {
      const assetIdEntity = EntityMediaAssetId.fromString(
        pm.getAssetId().toString(),
      );
      const asset = await this.mediaAssetRepository.findById(assetIdEntity);
      if (!asset) {
        issues.push(
          `Referenced media asset ${pm.getAssetId().toString()} not found`,
        );
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  async getProductMediaStatistics(productId: string): Promise<{
    totalMedia: number;
    hasCoverImage: boolean;
    imageCount: number;
    videoCount: number;
    otherCount: number;
    totalSize: number;
    averageFileSize: number;
  }> {
    const productIdVo = ProductId.fromString(productId);

    // Validate product exists
    const product = await this.productRepository.findById(productIdVo);
    if (!product) {
      throw new ProductNotFoundError(productId);
    }

    const [productMedia, coverImage] = await Promise.all([
      this.productMediaRepository.findByProductId(productIdVo),
      this.productMediaRepository.getProductCoverImage(productIdVo),
    ]);

    let imageCount = 0;
    let videoCount = 0;
    let otherCount = 0;
    let totalSize = 0;

    for (const pm of productMedia) {
      const assetIdEntity = EntityMediaAssetId.fromString(
        pm.getAssetId().toString(),
      );
      const asset = await this.mediaAssetRepository.findById(assetIdEntity);
      if (asset) {
        const mime = asset.getMime();
        const bytes = asset.getBytes() || 0;
        totalSize += bytes;

        if (mime.startsWith("image/")) {
          imageCount++;
        } else if (mime.startsWith("video/")) {
          videoCount++;
        } else {
          otherCount++;
        }
      }
    }

    const averageFileSize =
      productMedia.length > 0 ? totalSize / productMedia.length : 0;

    return {
      totalMedia: productMedia.length,
      hasCoverImage: !!coverImage,
      imageCount,
      videoCount,
      otherCount,
      totalSize,
      averageFileSize,
    };
  }
}
