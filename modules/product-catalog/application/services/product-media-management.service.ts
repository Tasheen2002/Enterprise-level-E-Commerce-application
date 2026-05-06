import {
  IProductMediaRepository,
  ProductMediaQueryOptions,
} from "../../domain/repositories/product-media.repository";
import { IMediaAssetRepository } from "../../domain/repositories/media-asset.repository";
import { IProductRepository } from "../../domain/repositories/product.repository";
import { MediaAsset } from "../../domain/entities/media-asset.entity";
import { ProductId } from "../../domain/value-objects/product-id.vo";
import { MediaAssetId } from "../../domain/value-objects/media-asset-id.vo";
import {
  ProductNotFoundError,
  MediaAssetNotFoundError,
  DomainValidationError,
  InvalidOperationError,
} from "../../domain/errors";

// ── Input / result types ─────────────────────────────────────────────

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
  alt?: string | null;
  caption?: string | null;
}

export interface ProductMediaReorderData {
  assetId: string;
  position: number;
}

export interface ProductMediaSummaryItem {
  assetId: string;
  position?: number;
  isCover: boolean;
  storageKey: string;
  mimeType: string;
  altText?: string;
}

export interface ProductMediaSummary {
  productId: string;
  totalMedia: number;
  hasCoverImage: boolean;
  coverImageAssetId?: string;
  mediaAssets: ProductMediaSummaryItem[];
}

export interface ProductMediaValidationResult {
  isValid: boolean;
  issues: string[];
}

export interface ProductMediaStatistics {
  totalMedia: number;
  hasCoverImage: boolean;
  imageCount: number;
  videoCount: number;
  otherCount: number;
  totalSize: number;
  averageFileSize: number;
}

// ── Service ───────────────────────────────────────────────────────────

export class ProductMediaManagementService {
  constructor(
    private readonly productMediaRepository: IProductMediaRepository,
    private readonly mediaAssetRepository: IMediaAssetRepository,
    private readonly productRepository: IProductRepository,
  ) {}

  // ── Mutations ────────────────────────────────────────────────────────

  async addMediaToProduct(
    productId: string,
    assetId: string,
    position?: number,
    isCover?: boolean,
    alt?: string | null,
    caption?: string | null,
  ): Promise<string> {
    const productIdVo = ProductId.fromString(productId);
    const assetIdVo = MediaAssetId.fromString(assetId);

    await this.assertProductExists(productIdVo, productId);
    await this.assertAssetExists(assetIdVo, assetId);
    await this.assertNoExistingAssociation(productIdVo, assetIdVo);

    if (isCover) {
      await this.productMediaRepository.removePrimaryMediaFlag(productIdVo);
    }

    const finalPosition =
      position ?? (await this.productMediaRepository.getNextPosition(productIdVo));

    const created = await this.productMediaRepository.addMediaToProduct(
      productIdVo,
      assetIdVo,
      finalPosition,
      isCover,
      alt,
      caption,
    );
    return created.id;
  }

  async removeMediaFromProduct(productId: string, assetId: string): Promise<void> {
    const productIdVo = ProductId.fromString(productId);
    const assetIdVo = MediaAssetId.fromString(assetId);

    const association = await this.productMediaRepository.findAssociation(productIdVo, assetIdVo);
    if (!association) {
      throw new InvalidOperationError("Media asset is not associated with this product");
    }

    await this.productMediaRepository.removeMediaFromProduct(productIdVo, assetIdVo);
    await this.productMediaRepository.compactPositions(productIdVo);
  }

  async removeAllProductMedia(productId: string): Promise<void> {
    const productIdVo = ProductId.fromString(productId);
    await this.assertProductExists(productIdVo, productId);
    await this.productMediaRepository.removeAllProductMedia(productIdVo);
  }

  async setProductCoverImage(productId: string, assetId: string): Promise<void> {
    const productIdVo = ProductId.fromString(productId);
    const assetIdVo = MediaAssetId.fromString(assetId);

    const association = await this.productMediaRepository.findAssociation(productIdVo, assetIdVo);
    if (!association) {
      throw new InvalidOperationError("Media asset is not associated with this product");
    }

    await this.productMediaRepository.setProductPrimaryMedia(productIdVo, assetIdVo);
  }

  async removeCoverImage(productId: string): Promise<void> {
    const productIdVo = ProductId.fromString(productId);
    await this.assertProductExists(productIdVo, productId);
    await this.productMediaRepository.removePrimaryMediaFlag(productIdVo);
  }

  async reorderProductMedia(
    productId: string,
    reorderData: ProductMediaReorderData[],
  ): Promise<void> {
    const productIdVo = ProductId.fromString(productId);
    await this.assertProductExists(productIdVo, productId);

    // Single batched validation: fetch all current associations, check that
    // every assetId in reorderData appears.
    const existing = await this.productMediaRepository.findByProductId(productIdVo);
    const existingAssetIds = new Set(existing.map((pm) => pm.mediaAssetId.getValue()));

    for (const item of reorderData) {
      if (!existingAssetIds.has(item.assetId)) {
        throw new InvalidOperationError(
          `Media asset ${item.assetId} is not associated with this product`,
        );
      }
    }

    const mediaOrdering = reorderData.map((item) => ({
      assetId: MediaAssetId.fromString(item.assetId),
      position: item.position,
    }));

    await this.productMediaRepository.reorderProductMedia(productIdVo, mediaOrdering);
  }

  async moveMediaPosition(
    productId: string,
    assetId: string,
    newPosition: number,
  ): Promise<void> {
    if (newPosition < 1) {
      throw new DomainValidationError("Position must be greater than 0");
    }

    const productIdVo = ProductId.fromString(productId);
    const assetIdVo = MediaAssetId.fromString(assetId);

    const association = await this.productMediaRepository.findAssociation(productIdVo, assetIdVo);
    if (!association) {
      throw new InvalidOperationError("Media asset is not associated with this product");
    }

    await this.productMediaRepository.moveMediaPosition(productIdVo, assetIdVo, newPosition);
  }

  async setProductMedia(productId: string, mediaData: ProductMediaData[]): Promise<void> {
    const productIdVo = ProductId.fromString(productId);
    await this.assertProductExists(productIdVo, productId);

    // Single batched asset existence check (was N findById calls).
    const assetIdVos = mediaData.map((item) => MediaAssetId.fromString(item.assetId));
    await this.assertAllAssetsExist(assetIdVos, mediaData.map((item) => item.assetId));

    const coverCount = mediaData.filter((item) => item.isCover).length;
    if (coverCount > 1) {
      throw new InvalidOperationError("Only one media asset can be set as cover image");
    }

    // Translate wire term `isCover` → domain term `isPrimary`. Pass alt/caption through.
    const repositoryData = mediaData.map((item) => ({
      assetId: MediaAssetId.fromString(item.assetId),
      position: item.position,
      isPrimary: item.isCover ?? false,
      alt: item.alt,
      caption: item.caption,
    }));

    await this.productMediaRepository.setProductMedia(productIdVo, repositoryData);
  }

  async duplicateProductMedia(
    sourceProductId: string,
    targetProductId: string,
  ): Promise<void> {
    const sourceProductIdVo = ProductId.fromString(sourceProductId);
    const targetProductIdVo = ProductId.fromString(targetProductId);

    const [sourceProduct, targetProduct] = await Promise.all([
      this.productRepository.findById(sourceProductIdVo),
      this.productRepository.findById(targetProductIdVo),
    ]);

    if (!sourceProduct) throw new ProductNotFoundError(sourceProductId);
    if (!targetProduct) throw new ProductNotFoundError(targetProductId);

    await this.productMediaRepository.duplicateProductMedia(sourceProductIdVo, targetProductIdVo);
  }

  async compactProductMediaPositions(productId: string): Promise<void> {
    const productIdVo = ProductId.fromString(productId);
    await this.assertProductExists(productIdVo, productId);
    await this.productMediaRepository.compactPositions(productIdVo);
  }

  // ── Queries ─────────────────────────────────────────────────────────

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

    await this.assertProductExists(productIdVo, productId);

    const repositoryOptions: ProductMediaQueryOptions = {
      limit,
      offset: (page - 1) * limit,
      sortBy: mapServiceSortToRepoSort(sortBy),
      sortOrder,
      primaryOnly: coverOnly,
    };

    const [productMediaList, totalCount, coverImage] = await Promise.all([
      this.productMediaRepository.findByProductId(productIdVo, repositoryOptions),
      this.productMediaRepository.countByProductId(productIdVo),
      this.productMediaRepository.getProductPrimaryMedia(productIdVo),
    ]);

    // Single batched asset fetch (was N findById calls).
    const assets = await this.mediaAssetRepository.findByIds(
      productMediaList.map((pm) => pm.mediaAssetId),
    );
    const assetById = new Map(assets.map((a) => [a.id.getValue(), a]));

    const mediaAssets: ProductMediaSummaryItem[] = productMediaList.map((pm) => {
      const asset = assetById.get(pm.mediaAssetId.getValue());
      return {
        assetId: pm.mediaAssetId.getValue(),
        position: pm.displayOrder ?? undefined,
        isCover: pm.isPrimary,
        storageKey: asset?.storageKey ?? "",
        mimeType: asset?.mime ?? "",
        altText: asset?.altText ?? undefined,
      };
    });

    return {
      productId,
      totalMedia: totalCount,
      hasCoverImage: !!coverImage,
      coverImageAssetId: coverImage?.mediaAssetId.getValue(),
      mediaAssets,
    };
  }

  async getProductsUsingAsset(assetId: string): Promise<string[]> {
    const assetIdVo = MediaAssetId.fromString(assetId);
    await this.assertAssetExists(assetIdVo, assetId);

    const productIds = await this.productMediaRepository.getProductsUsingAsset(assetIdVo);
    return productIds.map((id) => id.getValue());
  }

  async getAssetUsageCount(assetId: string): Promise<number> {
    const assetIdVo = MediaAssetId.fromString(assetId);
    await this.assertAssetExists(assetIdVo, assetId);
    return this.productMediaRepository.countAssetUsage(assetIdVo);
  }

  async validateProductMedia(productId: string): Promise<ProductMediaValidationResult> {
    const productIdVo = ProductId.fromString(productId);

    const product = await this.productRepository.findById(productIdVo);
    if (!product) {
      return { isValid: false, issues: ["Product not found"] };
    }

    const issues: string[] = [];
    const productMedia = await this.productMediaRepository.findByProductId(productIdVo);

    const positions = productMedia
      .map((pm) => pm.displayOrder)
      .filter((pos) => pos !== null);
    if (new Set(positions).size !== positions.length) {
      issues.push("Duplicate positions found");
    }

    const coverImages = productMedia.filter((pm) => pm.isPrimary);
    if (coverImages.length > 1) {
      issues.push("Multiple cover images found");
    }

    // Single batched asset existence check (was N findById calls).
    const assetIdVos = productMedia.map((pm) => pm.mediaAssetId);
    const assets = await this.mediaAssetRepository.findByIds(assetIdVos);
    const foundAssetIds = new Set(assets.map((a) => a.id.getValue()));
    for (const pm of productMedia) {
      if (!foundAssetIds.has(pm.mediaAssetId.getValue())) {
        issues.push(`Referenced media asset ${pm.mediaAssetId.getValue()} not found`);
      }
    }

    return { isValid: issues.length === 0, issues };
  }

  async getProductMediaStatistics(productId: string): Promise<ProductMediaStatistics> {
    const productIdVo = ProductId.fromString(productId);
    await this.assertProductExists(productIdVo, productId);

    const [productMedia, coverImage] = await Promise.all([
      this.productMediaRepository.findByProductId(productIdVo),
      this.productMediaRepository.getProductPrimaryMedia(productIdVo),
    ]);

    // Single batched asset fetch (was N findById calls).
    const assets = await this.mediaAssetRepository.findByIds(
      productMedia.map((pm) => pm.mediaAssetId),
    );

    let imageCount = 0;
    let videoCount = 0;
    let otherCount = 0;
    let totalSize = 0;

    for (const asset of assets) {
      totalSize += asset.bytes ?? 0;
      if (asset.mime.startsWith("image/")) imageCount++;
      else if (asset.mime.startsWith("video/")) videoCount++;
      else otherCount++;
    }

    const averageFileSize = productMedia.length > 0 ? totalSize / productMedia.length : 0;

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

  // ── Private helpers ────────────────────────────────────────────────

  private async assertProductExists(productIdVo: ProductId, productId: string): Promise<void> {
    const product = await this.productRepository.findById(productIdVo);
    if (!product) {
      throw new ProductNotFoundError(productId);
    }
  }

  private async assertAssetExists(assetIdVo: MediaAssetId, assetId: string): Promise<MediaAsset> {
    const asset = await this.mediaAssetRepository.findById(assetIdVo);
    if (!asset) {
      throw new MediaAssetNotFoundError(assetId);
    }
    return asset;
  }

  private async assertAllAssetsExist(
    assetIdVos: MediaAssetId[],
    assetIds: string[],
  ): Promise<void> {
    if (assetIdVos.length === 0) return;
    const found = await this.mediaAssetRepository.findByIds(assetIdVos);
    if (found.length === assetIdVos.length) return;
    const foundIds = new Set(found.map((a) => a.id.getValue()));
    const missing = assetIds.find((id) => !foundIds.has(id));
    throw new MediaAssetNotFoundError(missing ?? assetIds[0]);
  }

  private async assertNoExistingAssociation(
    productIdVo: ProductId,
    assetIdVo: MediaAssetId,
  ): Promise<void> {
    const existing = await this.productMediaRepository.findAssociation(productIdVo, assetIdVo);
    if (existing) {
      throw new InvalidOperationError("Media asset is already associated with this product");
    }
  }

}

// Service-level "wire" sort term → domain repo sort term.
function mapServiceSortToRepoSort(
  sortBy: NonNullable<ProductMediaServiceQueryOptions["sortBy"]>,
): NonNullable<ProductMediaQueryOptions["sortBy"]> {
  switch (sortBy) {
    case "isCover": return "isPrimary";
    case "position": return "displayOrder";
    case "createdAt": return "createdAt";
  }
}
