import { IVariantMediaRepository } from "../../domain/repositories/variant-media.repository";
import { IMediaAssetRepository } from "../../domain/repositories/media-asset.repository";
import { IProductVariantRepository } from "../../domain/repositories/product-variant.repository";
import { IProductRepository } from "../../domain/repositories/product.repository";
import { VariantMedia } from "../../domain/entities/variant-media.entity";
import { ProductVariant } from "../../domain/entities/product-variant.entity";
import { MediaAsset } from "../../domain/entities/media-asset.entity";
import { VariantId } from "../../domain/value-objects/variant-id.vo";
import { MediaAssetId } from "../../domain/value-objects/media-asset-id.vo";
import { ProductId } from "../../domain/value-objects/product-id.vo";
import {
  ProductNotFoundError,
  ProductVariantNotFoundError,
  MediaAssetNotFoundError,
  InvalidOperationError,
} from "../../domain/errors";

// ── Input / result types ─────────────────────────────────────────────

export interface VariantMediaServiceQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: "variantId" | "assetId";
  sortOrder?: "asc" | "desc";
  productId?: string;
}

export interface MediaAssetSummary {
  assetId: string;
  storageKey: string;
  mimeType: string;
  altText?: string;
}

export interface VariantMediaSummary {
  variantId: string;
  sku: string;
  color?: string;
  size?: string;
  totalMedia: number;
  mediaAssets: MediaAssetSummary[];
}

export interface ProductVariantMediaItem {
  variantId: string;
  sku: string;
  color?: string;
  size?: string;
  mediaCount: number;
  mediaAssets: MediaAssetSummary[];
}

export interface ProductVariantMediaSummary {
  productId: string;
  variants: ProductVariantMediaItem[];
}

export interface ColorVariantItem {
  variantId: string;
  sku: string;
  size?: string;
  mediaAssets: MediaAssetSummary[];
}

export interface ColorVariantMedia {
  color: string;
  variants: ColorVariantItem[];
}

export interface SizeVariantItem {
  variantId: string;
  sku: string;
  color?: string;
  mediaAssets: MediaAssetSummary[];
}

export interface SizeVariantMedia {
  size: string;
  variants: SizeVariantItem[];
}

export interface VariantMediaValidationResult {
  isValid: boolean;
  issues: string[];
}

export interface VariantMediaStatistics {
  totalMedia: number;
  imageCount: number;
  videoCount: number;
  otherCount: number;
  totalSize: number;
  averageFileSize: number;
}

// ── Service ───────────────────────────────────────────────────────────

export class VariantMediaManagementService {
  constructor(
    private readonly variantMediaRepository: IVariantMediaRepository,
    private readonly mediaAssetRepository: IMediaAssetRepository,
    private readonly productVariantRepository: IProductVariantRepository,
    private readonly productRepository: IProductRepository,
  ) {}

  // ── Mutations ────────────────────────────────────────────────────────

  async addMediaToVariant(variantId: string, assetId: string): Promise<void> {
    const variantIdVo = VariantId.fromString(variantId);
    const assetIdVo = MediaAssetId.fromString(assetId);

    await this.assertVariantExists(variantIdVo, variantId);
    await this.assertAssetExists(assetIdVo, assetId);

    const existing = await this.variantMediaRepository.findAssociation(variantIdVo, assetIdVo);
    if (existing) {
      throw new InvalidOperationError("Media asset is already associated with this variant");
    }

    await this.variantMediaRepository.addMediaToVariant(variantIdVo, assetIdVo);
  }

  async removeMediaFromVariant(variantId: string, assetId: string): Promise<void> {
    const variantIdVo = VariantId.fromString(variantId);
    const assetIdVo = MediaAssetId.fromString(assetId);

    const association = await this.variantMediaRepository.findAssociation(variantIdVo, assetIdVo);
    if (!association) {
      throw new InvalidOperationError("Media asset is not associated with this variant");
    }

    await this.variantMediaRepository.removeMediaFromVariant(variantIdVo, assetIdVo);
  }

  async removeAllVariantMedia(variantId: string): Promise<void> {
    const variantIdVo = VariantId.fromString(variantId);
    await this.assertVariantExists(variantIdVo, variantId);
    await this.variantMediaRepository.removeAllVariantMedia(variantIdVo);
  }

  async setVariantMedia(variantId: string, assetIds: string[]): Promise<void> {
    const variantIdVo = VariantId.fromString(variantId);
    await this.assertVariantExists(variantIdVo, variantId);

    const assetIdVos = assetIds.map((id) => MediaAssetId.fromString(id));
    await this.assertAllAssetsExist(assetIdVos, assetIds);

    await this.variantMediaRepository.setVariantMedia(variantIdVo, assetIdVos);
  }

  async addMediaToMultipleVariants(variantIds: string[], assetId: string): Promise<void> {
    const assetIdVo = MediaAssetId.fromString(assetId);
    await this.assertAssetExists(assetIdVo, assetId);

    const variantIdVos = variantIds.map((id) => VariantId.fromString(id));
    await this.assertAllVariantsExist(variantIdVos, variantIds);

    await this.variantMediaRepository.addMediaToMultipleVariants(variantIdVos, assetIdVo);
  }

  async addMultipleMediaToVariant(variantId: string, assetIds: string[]): Promise<void> {
    const variantIdVo = VariantId.fromString(variantId);
    await this.assertVariantExists(variantIdVo, variantId);

    const assetIdVos = assetIds.map((id) => MediaAssetId.fromString(id));
    await this.assertAllAssetsExist(assetIdVos, assetIds);

    await this.variantMediaRepository.addMultipleMediaToVariant(variantIdVo, assetIdVos);
  }

  async duplicateVariantMedia(
    sourceVariantId: string,
    targetVariantId: string,
  ): Promise<void> {
    const sourceIdVo = VariantId.fromString(sourceVariantId);
    const targetIdVo = VariantId.fromString(targetVariantId);

    const [source, target] = await Promise.all([
      this.productVariantRepository.findById(sourceIdVo),
      this.productVariantRepository.findById(targetIdVo),
    ]);

    if (!source) throw new ProductVariantNotFoundError(sourceVariantId);
    if (!target) throw new ProductVariantNotFoundError(targetVariantId);

    await this.variantMediaRepository.duplicateVariantMedia(sourceIdVo, targetIdVo);
  }

  async copyProductVariantMedia(
    sourceProductId: string,
    targetProductId: string,
    variantMapping: Record<string, string>,
  ): Promise<void> {
    const sourceProductIdVo = ProductId.fromString(sourceProductId);
    const targetProductIdVo = ProductId.fromString(targetProductId);

    const [source, target] = await Promise.all([
      this.productRepository.findById(sourceProductIdVo),
      this.productRepository.findById(targetProductIdVo),
    ]);

    if (!source) throw new ProductNotFoundError(sourceProductId);
    if (!target) throw new ProductNotFoundError(targetProductId);

    // Map keys are raw source variant ID strings so Map.get() works by value equality.
    const variantIdMapping = new Map<string, VariantId>();
    for (const [src, tgt] of Object.entries(variantMapping)) {
      variantIdMapping.set(src, VariantId.fromString(tgt));
    }

    await this.variantMediaRepository.copyProductVariantMedia(sourceProductIdVo, variantIdMapping);
  }

  // ── Queries ─────────────────────────────────────────────────────────

  async getVariantMedia(variantId: string): Promise<VariantMediaSummary> {
    const variantIdVo = VariantId.fromString(variantId);
    const variant = await this.assertVariantExists(variantIdVo, variantId);

    const variantMediaList = await this.variantMediaRepository.findByVariantId(variantIdVo);
    const assetById = await this.batchFetchAssets(variantMediaList.map((vm) => vm.mediaAssetId));

    return {
      variantId,
      sku: variant.sku.getValue(),
      color: variant.color ?? undefined,
      size: variant.size ?? undefined,
      totalMedia: variantMediaList.length,
      mediaAssets: variantMediaList.map((vm) =>
        toAssetSummary(vm.mediaAssetId, assetById.get(vm.mediaAssetId.getValue())),
      ),
    };
  }

  async getProductVariantMedia(
    productId: string,
    _options: VariantMediaServiceQueryOptions = {},
  ): Promise<ProductVariantMediaSummary> {
    const productIdVo = ProductId.fromString(productId);
    await this.assertProductExists(productIdVo, productId);

    const variantMediaGroups = await this.variantMediaRepository.getProductVariantMedia(productIdVo);

    // Single batched variant fetch + single batched asset fetch.
    const variantIds = variantMediaGroups.map((g) => g.variantId);
    const allAssetIds = variantMediaGroups.flatMap((g) => g.media.map((vm) => vm.mediaAssetId));

    const [variants, assetById] = await Promise.all([
      this.productVariantRepository.findByIds(variantIds),
      this.batchFetchAssets(allAssetIds),
    ]);
    const variantById = new Map(variants.map((v) => [v.id.getValue(), v]));

    const variantsResult: ProductVariantMediaItem[] = variantMediaGroups.map((group) => {
      const variant = variantById.get(group.variantId.getValue());
      return {
        variantId: group.variantId.getValue(),
        sku: variant?.sku.getValue() ?? "",
        color: variant?.color ?? undefined,
        size: variant?.size ?? undefined,
        mediaCount: group.media.length,
        mediaAssets: group.media.map((vm) =>
          toAssetSummary(vm.mediaAssetId, assetById.get(vm.mediaAssetId.getValue())),
        ),
      };
    });

    return { productId, variants: variantsResult };
  }

  async getColorVariantMedia(productId: string, color: string): Promise<ColorVariantMedia> {
    const productIdVo = ProductId.fromString(productId);
    await this.assertProductExists(productIdVo, productId);

    const colorVariantMedia = await this.variantMediaRepository.getColorVariantMedia(productIdVo, color);
    const enriched = await this.enrichByVariant(colorVariantMedia);

    const variants: ColorVariantItem[] = enriched.map(({ variant, variantIdStr, mediaAssets }) => ({
      variantId: variantIdStr,
      sku: variant?.sku.getValue() ?? "",
      size: variant?.size ?? undefined,
      mediaAssets,
    }));

    return { color, variants };
  }

  async getSizeVariantMedia(productId: string, size: string): Promise<SizeVariantMedia> {
    const productIdVo = ProductId.fromString(productId);
    await this.assertProductExists(productIdVo, productId);

    const sizeVariantMedia = await this.variantMediaRepository.getSizeVariantMedia(productIdVo, size);
    const enriched = await this.enrichByVariant(sizeVariantMedia);

    const variants: SizeVariantItem[] = enriched.map(({ variant, variantIdStr, mediaAssets }) => ({
      variantId: variantIdStr,
      sku: variant?.sku.getValue() ?? "",
      color: variant?.color ?? undefined,
      mediaAssets,
    }));

    return { size, variants };
  }

  async getVariantsUsingAsset(assetId: string): Promise<string[]> {
    const assetIdVo = MediaAssetId.fromString(assetId);
    await this.assertAssetExists(assetIdVo, assetId);

    const variantIds = await this.variantMediaRepository.getVariantsUsingAsset(assetIdVo);
    return variantIds.map((id) => id.getValue());
  }

  async getAssetUsageCount(assetId: string): Promise<number> {
    const assetIdVo = MediaAssetId.fromString(assetId);
    await this.assertAssetExists(assetIdVo, assetId);
    return this.variantMediaRepository.countAssetUsage(assetIdVo);
  }

  async getUnusedAssets(productId?: string): Promise<string[]> {
    let productIdVo: ProductId | undefined;
    if (productId) {
      productIdVo = ProductId.fromString(productId);
      await this.assertProductExists(productIdVo, productId);
    }

    const unusedAssetIds = await this.variantMediaRepository.getUnusedAssets(productIdVo);
    return unusedAssetIds.map((id) => id.getValue());
  }

  async validateVariantMedia(variantId: string): Promise<VariantMediaValidationResult> {
    const variantIdVo = VariantId.fromString(variantId);
    const variant = await this.productVariantRepository.findById(variantIdVo);
    if (!variant) {
      return { isValid: false, issues: ["Product variant not found"] };
    }

    const variantMedia = await this.variantMediaRepository.findByVariantId(variantIdVo);
    const assetIds = variantMedia.map((vm) => vm.mediaAssetId);
    const assets = await this.mediaAssetRepository.findByIds(assetIds);
    const foundAssetIds = new Set(assets.map((a) => a.id.getValue()));

    const issues: string[] = [];
    for (const vm of variantMedia) {
      if (!foundAssetIds.has(vm.mediaAssetId.getValue())) {
        issues.push(`Referenced media asset ${vm.mediaAssetId.getValue()} not found`);
      }
    }

    return { isValid: issues.length === 0, issues };
  }

  async getVariantMediaStatistics(variantId: string): Promise<VariantMediaStatistics> {
    const variantIdVo = VariantId.fromString(variantId);
    await this.assertVariantExists(variantIdVo, variantId);

    const variantMedia = await this.variantMediaRepository.findByVariantId(variantIdVo);
    const assets = await this.mediaAssetRepository.findByIds(variantMedia.map((vm) => vm.mediaAssetId));

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

    const averageFileSize = variantMedia.length > 0 ? totalSize / variantMedia.length : 0;

    return {
      totalMedia: variantMedia.length,
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
    if (!product) throw new ProductNotFoundError(productId);
  }

  private async assertVariantExists(
    variantIdVo: VariantId,
    variantId: string,
  ): Promise<ProductVariant> {
    const variant = await this.productVariantRepository.findById(variantIdVo);
    if (!variant) throw new ProductVariantNotFoundError(variantId);
    return variant;
  }

  private async assertAssetExists(assetIdVo: MediaAssetId, assetId: string): Promise<MediaAsset> {
    const asset = await this.mediaAssetRepository.findById(assetIdVo);
    if (!asset) throw new MediaAssetNotFoundError(assetId);
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

  private async assertAllVariantsExist(
    variantIdVos: VariantId[],
    variantIds: string[],
  ): Promise<void> {
    if (variantIdVos.length === 0) return;
    const found = await this.productVariantRepository.findByIds(variantIdVos);
    if (found.length === variantIdVos.length) return;
    const foundIds = new Set(found.map((v) => v.id.getValue()));
    const missing = variantIds.find((id) => !foundIds.has(id));
    throw new ProductVariantNotFoundError(missing ?? variantIds[0]);
  }

  private async batchFetchAssets(assetIds: MediaAssetId[]): Promise<Map<string, MediaAsset>> {
    if (assetIds.length === 0) return new Map();
    const assets = await this.mediaAssetRepository.findByIds(assetIds);
    return new Map(assets.map((a) => [a.id.getValue(), a]));
  }

  private async enrichByVariant(
    variantMedia: VariantMedia[],
  ): Promise<Array<{
    variantIdStr: string;
    variant: ProductVariant | undefined;
    mediaAssets: MediaAssetSummary[];
  }>> {
    const grouped = new Map<string, VariantMedia[]>();
    for (const vm of variantMedia) {
      const key = vm.variantId.getValue();
      const list = grouped.get(key);
      if (list) list.push(vm);
      else grouped.set(key, [vm]);
    }

    const variantIds = Array.from(grouped.keys()).map((id) => VariantId.fromString(id));
    const allAssetIds = variantMedia.map((vm) => vm.mediaAssetId);

    const [variants, assetById] = await Promise.all([
      this.productVariantRepository.findByIds(variantIds),
      this.batchFetchAssets(allAssetIds),
    ]);
    const variantById = new Map(variants.map((v) => [v.id.getValue(), v]));

    return Array.from(grouped.entries()).map(([variantIdStr, mediaList]) => ({
      variantIdStr,
      variant: variantById.get(variantIdStr),
      mediaAssets: mediaList.map((vm) =>
        toAssetSummary(vm.mediaAssetId, assetById.get(vm.mediaAssetId.getValue())),
      ),
    }));
  }
}

// ── Module-private helpers ─────────────────────────────────────────

function toAssetSummary(
  assetId: MediaAssetId,
  asset: MediaAsset | undefined,
): MediaAssetSummary {
  return {
    assetId: assetId.getValue(),
    storageKey: asset?.storageKey ?? "",
    mimeType: asset?.mime ?? "",
    altText: asset?.altText ?? undefined,
  };
}
