import { IVariantMediaRepository } from "../../domain/repositories/variant-media.repository";
import { IMediaAssetRepository } from "../../domain/repositories/media-asset.repository";
import { IProductVariantRepository } from "../../domain/repositories/product-variant.repository";
import { IProductRepository } from "../../domain/repositories/product.repository";
import { VariantMedia } from "../../domain/entities/variant-media.entity";
import { MediaAssetId as EntityMediaAssetId } from "../../domain/entities/media-asset.entity";
import { VariantId } from "../../domain/value-objects/variant-id.vo";
import { MediaAssetId } from "../../domain/value-objects/media-asset-id.vo";
import { ProductId } from "../../domain/value-objects/product-id.vo";
import {
  ProductNotFoundError,
  ProductVariantNotFoundError,
  MediaAssetNotFoundError,
  InvalidOperationError,
} from "../../domain/errors";

export interface VariantMediaServiceQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: "variantId" | "assetId";
  sortOrder?: "asc" | "desc";
  productId?: string;
}

export interface VariantMediaSummary {
  variantId: string;
  sku: string;
  color?: string;
  size?: string;
  totalMedia: number;
  mediaAssets: Array<{
    assetId: string;
    storageKey: string;
    mimeType: string;
    altText?: string;
  }>;
}

export interface ProductVariantMediaSummary {
  productId: string;
  variants: Array<{
    variantId: string;
    sku: string;
    color?: string;
    size?: string;
    mediaCount: number;
    mediaAssets: Array<{
      assetId: string;
      storageKey: string;
      mimeType: string;
    }>;
  }>;
}

export interface ColorVariantMedia {
  color: string;
  variants: Array<{
    variantId: string;
    sku: string;
    size?: string;
    mediaAssets: Array<{
      assetId: string;
      storageKey: string;
      mimeType: string;
    }>;
  }>;
}

export class VariantMediaManagementService {
  constructor(
    private readonly variantMediaRepository: IVariantMediaRepository,
    private readonly mediaAssetRepository: IMediaAssetRepository,
    private readonly productVariantRepository: IProductVariantRepository,
    private readonly productRepository: IProductRepository,
  ) {}

  async addMediaToVariant(variantId: string, assetId: string): Promise<void> {
    const variantIdVo = VariantId.fromString(variantId);
    const assetIdVo = MediaAssetId.fromString(assetId);

    // Validate variant exists
    const variant = await this.productVariantRepository.findById(variantIdVo);
    if (!variant) {
      throw new ProductVariantNotFoundError(variantId);
    }

    // Validate asset exists
    const assetIdEntity = EntityMediaAssetId.fromString(assetId);
    const asset = await this.mediaAssetRepository.findById(assetIdEntity);
    if (!asset) {
      throw new MediaAssetNotFoundError(assetId);
    }

    // Check if association already exists
    const existingAssociation =
      await this.variantMediaRepository.findAssociation(variantIdVo, assetIdVo);
    if (existingAssociation) {
      throw new InvalidOperationError("Media asset is already associated with this variant");
    }

    await this.variantMediaRepository.addMediaToVariant(variantIdVo, assetIdVo);
  }

  async removeMediaFromVariant(
    variantId: string,
    assetId: string,
  ): Promise<void> {
    const variantIdVo = VariantId.fromString(variantId);
    const assetIdVo = MediaAssetId.fromString(assetId);

    // Check if association exists
    const association = await this.variantMediaRepository.findAssociation(
      variantIdVo,
      assetIdVo,
    );
    if (!association) {
      throw new InvalidOperationError("Media asset is not associated with this variant");
    }

    await this.variantMediaRepository.removeMediaFromVariant(
      variantIdVo,
      assetIdVo,
    );
  }

  async removeAllVariantMedia(variantId: string): Promise<void> {
    const variantIdVo = VariantId.fromString(variantId);

    // Validate variant exists
    const variant = await this.productVariantRepository.findById(variantIdVo);
    if (!variant) {
      throw new ProductVariantNotFoundError(variantId);
    }

    await this.variantMediaRepository.removeAllVariantMedia(variantIdVo);
  }

  async getVariantMedia(variantId: string): Promise<VariantMediaSummary> {
    const variantIdVo = VariantId.fromString(variantId);

    // Validate variant exists
    const variant = await this.productVariantRepository.findById(variantIdVo);
    if (!variant) {
      throw new ProductVariantNotFoundError(variantId);
    }

    const variantMediaList =
      await this.variantMediaRepository.findByVariantId(variantIdVo);

    // Get asset details for each variant media
    const mediaAssets = await Promise.all(
      variantMediaList.map(async (variantMedia) => {
        const assetIdEntity = EntityMediaAssetId.fromString(
          variantMedia.getAssetId().toString(),
        );
        const asset = await this.mediaAssetRepository.findById(assetIdEntity);
        return {
          assetId: variantMedia.getAssetId().toString(),
          storageKey: asset?.getStorageKey() || "",
          mimeType: asset?.getMime() || "",
          altText: asset?.getAltText() ?? undefined,
        };
      }),
    );

    return {
      variantId,
      sku: variant.getSku().toString(),
      color: variant.getColor() ?? undefined,
      size: variant.getSize() ?? undefined,
      totalMedia: variantMediaList.length,
      mediaAssets,
    };
  }

  async setVariantMedia(variantId: string, assetIds: string[]): Promise<void> {
    const variantIdVo = VariantId.fromString(variantId);

    // Validate variant exists
    const variant = await this.productVariantRepository.findById(variantIdVo);
    if (!variant) {
      throw new ProductVariantNotFoundError(variantId);
    }

    // Validate all assets exist
    const assetIdVos = [];
    for (const assetId of assetIds) {
      const assetIdVo = MediaAssetId.fromString(assetId);
      const assetIdEntity = EntityMediaAssetId.fromString(assetId);
      const asset = await this.mediaAssetRepository.findById(assetIdEntity);
      if (!asset) {
        throw new MediaAssetNotFoundError(assetId);
      }
      assetIdVos.push(assetIdVo);
    }

    await this.variantMediaRepository.setVariantMedia(variantIdVo, assetIdVos);
  }

  async addMediaToMultipleVariants(
    variantIds: string[],
    assetId: string,
  ): Promise<void> {
    const assetIdVo = MediaAssetId.fromString(assetId);

    // Validate asset exists
    const assetIdEntity = EntityMediaAssetId.fromString(assetId);
    const asset = await this.mediaAssetRepository.findById(assetIdEntity);
    if (!asset) {
      throw new MediaAssetNotFoundError(assetId);
    }

    // Validate all variants exist
    const variantIdVos = [];
    for (const variantId of variantIds) {
      const variantIdVo = VariantId.fromString(variantId);
      const variant = await this.productVariantRepository.findById(variantIdVo);
      if (!variant) {
        throw new ProductVariantNotFoundError(variantId);
      }
      variantIdVos.push(variantIdVo);
    }

    await this.variantMediaRepository.addMediaToMultipleVariants(
      variantIdVos,
      assetIdVo,
    );
  }

  async addMultipleMediaToVariant(
    variantId: string,
    assetIds: string[],
  ): Promise<void> {
    const variantIdVo = VariantId.fromString(variantId);

    // Validate variant exists
    const variant = await this.productVariantRepository.findById(variantIdVo);
    if (!variant) {
      throw new ProductVariantNotFoundError(variantId);
    }

    // Validate all assets exist
    const assetIdVos = [];
    for (const assetId of assetIds) {
      const assetIdVo = MediaAssetId.fromString(assetId);
      const assetIdEntity = EntityMediaAssetId.fromString(assetId);
      const asset = await this.mediaAssetRepository.findById(assetIdEntity);
      if (!asset) {
        throw new MediaAssetNotFoundError(assetId);
      }
      assetIdVos.push(assetIdVo);
    }

    await this.variantMediaRepository.addMultipleMediaToVariant(
      variantIdVo,
      assetIdVos,
    );
  }

  async duplicateVariantMedia(
    sourceVariantId: string,
    targetVariantId: string,
  ): Promise<void> {
    const sourceVariantIdVo = VariantId.fromString(sourceVariantId);
    const targetVariantIdVo = VariantId.fromString(targetVariantId);

    // Validate both variants exist
    const [sourceVariant, targetVariant] = await Promise.all([
      this.productVariantRepository.findById(sourceVariantIdVo),
      this.productVariantRepository.findById(targetVariantIdVo),
    ]);

    if (!sourceVariant) {
      throw new ProductVariantNotFoundError(sourceVariantId);
    }

    if (!targetVariant) {
      throw new ProductVariantNotFoundError(targetVariantId);
    }

    await this.variantMediaRepository.duplicateVariantMedia(
      sourceVariantIdVo,
      targetVariantIdVo,
    );
  }

  async getProductVariantMedia(
    productId: string,
    options: VariantMediaServiceQueryOptions = {},
  ): Promise<ProductVariantMediaSummary> {
    const productIdVo = ProductId.fromString(productId);
    // Note: options parameter is available for future pagination/sorting implementation

    // Validate product exists
    const product = await this.productRepository.findById(productIdVo);
    if (!product) {
      throw new ProductNotFoundError(productId);
    }

    const productVariantMediaData =
      await this.variantMediaRepository.getProductVariantMedia(productIdVo);

    const variants = await Promise.all(
      productVariantMediaData.map(async (item) => {
        const variant = await this.productVariantRepository.findById(
          item.variantId,
        );
        const mediaAssets = await Promise.all(
          item.media.map(async (vm) => {
            const assetIdEntity = EntityMediaAssetId.fromString(
              vm.getAssetId().toString(),
            );
            const asset =
              await this.mediaAssetRepository.findById(assetIdEntity);
            return {
              assetId: vm.getAssetId().toString(),
              storageKey: asset?.getStorageKey() || "",
              mimeType: asset?.getMime() || "",
            };
          }),
        );

        return {
          variantId: item.variantId.toString(),
          sku: variant?.getSku().toString() || "",
          color: variant?.getColor() ?? undefined,
          size: variant?.getSize() ?? undefined,
          mediaCount: item.media.length,
          mediaAssets,
        };
      }),
    );

    return {
      productId,
      variants,
    };
  }

  async copyProductVariantMedia(
    sourceProductId: string,
    targetProductId: string,
    variantMapping: Record<string, string>,
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

    // Convert string mapping to VariantId mapping
    const variantIdMapping = new Map<VariantId, VariantId>();
    for (const [sourceVariantId, targetVariantId] of Object.entries(
      variantMapping,
    )) {
      variantIdMapping.set(
        VariantId.fromString(sourceVariantId),
        VariantId.fromString(targetVariantId),
      );
    }

    await this.variantMediaRepository.copyProductVariantMedia(
      sourceProductIdVo,
      targetProductIdVo,
      variantIdMapping,
    );
  }

  async getVariantsUsingAsset(assetId: string): Promise<string[]> {
    const assetIdVo = MediaAssetId.fromString(assetId);

    // Validate asset exists
    const assetIdEntity = EntityMediaAssetId.fromString(assetId);
    const asset = await this.mediaAssetRepository.findById(assetIdEntity);
    if (!asset) {
      throw new MediaAssetNotFoundError(assetId);
    }

    const variantIds =
      await this.variantMediaRepository.getVariantsUsingAsset(assetIdVo);
    return variantIds.map((id) => id.toString());
  }

  async getAssetUsageCount(assetId: string): Promise<number> {
    const assetIdVo = MediaAssetId.fromString(assetId);

    // Validate asset exists
    const assetIdEntity = EntityMediaAssetId.fromString(assetId);
    const asset = await this.mediaAssetRepository.findById(assetIdEntity);
    if (!asset) {
      throw new MediaAssetNotFoundError(assetId);
    }

    return await this.variantMediaRepository.countAssetUsage(assetIdVo);
  }

  async getColorVariantMedia(
    productId: string,
    color: string,
  ): Promise<ColorVariantMedia> {
    const productIdVo = ProductId.fromString(productId);

    // Validate product exists
    const product = await this.productRepository.findById(productIdVo);
    if (!product) {
      throw new ProductNotFoundError(productId);
    }

    const colorVariantMedia =
      await this.variantMediaRepository.getColorVariantMedia(
        productIdVo,
        color,
      );

    // Group by variant and get variant details
    const variantMediaMap = new Map<string, VariantMedia[]>();
    for (const vm of colorVariantMedia) {
      const variantIdStr = vm.getVariantId().toString();
      if (!variantMediaMap.has(variantIdStr)) {
        variantMediaMap.set(variantIdStr, []);
      }
      variantMediaMap.get(variantIdStr)!.push(vm);
    }

    const variants = await Promise.all(
      Array.from(variantMediaMap.entries()).map(
        async ([variantIdStr, mediaList]) => {
          const variantIdVo = VariantId.fromString(variantIdStr);
          const variant =
            await this.productVariantRepository.findById(variantIdVo);

          const mediaAssets = await Promise.all(
            mediaList.map(async (vm) => {
              const assetIdEntity = EntityMediaAssetId.fromString(
                vm.getAssetId().toString(),
              );
              const asset =
                await this.mediaAssetRepository.findById(assetIdEntity);
              return {
                assetId: vm.getAssetId().toString(),
                storageKey: asset?.getStorageKey() || "",
                mimeType: asset?.getMime() || "",
              };
            }),
          );

          return {
            variantId: variantIdStr,
            sku: variant?.getSku().toString() || "",
            size: variant?.getSize() ?? undefined,
            mediaAssets,
          };
        },
      ),
    );

    return {
      color,
      variants,
    };
  }

  async getSizeVariantMedia(
    productId: string,
    size: string,
  ): Promise<
    Array<{
      size: string;
      variants: Array<{
        variantId: string;
        sku: string;
        color?: string;
        mediaAssets: Array<{
          assetId: string;
          storageKey: string;
          mimeType: string;
        }>;
      }>;
    }>
  > {
    const productIdVo = ProductId.fromString(productId);

    // Validate product exists
    const product = await this.productRepository.findById(productIdVo);
    if (!product) {
      throw new ProductNotFoundError(productId);
    }

    const sizeVariantMedia =
      await this.variantMediaRepository.getSizeVariantMedia(productIdVo, size);

    // Group by variant and get variant details
    const variantMediaMap = new Map<string, VariantMedia[]>();
    for (const vm of sizeVariantMedia) {
      const variantIdStr = vm.getVariantId().toString();
      if (!variantMediaMap.has(variantIdStr)) {
        variantMediaMap.set(variantIdStr, []);
      }
      variantMediaMap.get(variantIdStr)!.push(vm);
    }

    const variants = await Promise.all(
      Array.from(variantMediaMap.entries()).map(
        async ([variantIdStr, mediaList]) => {
          const variantIdVo = VariantId.fromString(variantIdStr);
          const variant =
            await this.productVariantRepository.findById(variantIdVo);

          const mediaAssets = await Promise.all(
            mediaList.map(async (vm) => {
              const assetIdEntity = EntityMediaAssetId.fromString(
                vm.getAssetId().toString(),
              );
              const asset =
                await this.mediaAssetRepository.findById(assetIdEntity);
              return {
                assetId: vm.getAssetId().toString(),
                storageKey: asset?.getStorageKey() || "",
                mimeType: asset?.getMime() || "",
              };
            }),
          );

          return {
            variantId: variantIdStr,
            sku: variant?.getSku().toString() || "",
            color: variant?.getColor() ?? undefined,
            mediaAssets,
          };
        },
      ),
    );

    return [
      {
        size,
        variants,
      },
    ];
  }

  async getUnusedAssets(productId?: string): Promise<string[]> {
    let productIdVo: ProductId | undefined;

    if (productId) {
      productIdVo = ProductId.fromString(productId);
      // Validate product exists
      const product = await this.productRepository.findById(productIdVo);
      if (!product) {
        throw new ProductNotFoundError(productId);
      }
    }

    const unusedAssetIds =
      await this.variantMediaRepository.getUnusedAssets(productIdVo);
    return unusedAssetIds.map((id) => id.toString());
  }

  async validateVariantMedia(variantId: string): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const variantIdVo = VariantId.fromString(variantId);

    // Validate variant exists
    const variant = await this.productVariantRepository.findById(variantIdVo);
    if (!variant) {
      return {
        isValid: false,
        issues: ["Product variant not found"],
      };
    }

    const issues: string[] = [];

    // Get all variant media
    const variantMedia =
      await this.variantMediaRepository.findByVariantId(variantIdVo);

    // Check if all referenced assets exist
    for (const vm of variantMedia) {
      const assetIdEntity = EntityMediaAssetId.fromString(
        vm.getAssetId().toString(),
      );
      const asset = await this.mediaAssetRepository.findById(assetIdEntity);
      if (!asset) {
        issues.push(
          `Referenced media asset ${vm.getAssetId().toString()} not found`,
        );
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  async getVariantMediaStatistics(variantId: string): Promise<{
    totalMedia: number;
    imageCount: number;
    videoCount: number;
    otherCount: number;
    totalSize: number;
    averageFileSize: number;
  }> {
    const variantIdVo = VariantId.fromString(variantId);

    // Validate variant exists
    const variant = await this.productVariantRepository.findById(variantIdVo);
    if (!variant) {
      throw new ProductVariantNotFoundError(variantId);
    }

    const variantMedia =
      await this.variantMediaRepository.findByVariantId(variantIdVo);

    let imageCount = 0;
    let videoCount = 0;
    let otherCount = 0;
    let totalSize = 0;

    for (const vm of variantMedia) {
      const assetIdEntity = EntityMediaAssetId.fromString(
        vm.getAssetId().toString(),
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
      variantMedia.length > 0 ? totalSize / variantMedia.length : 0;

    return {
      totalMedia: variantMedia.length,
      imageCount,
      videoCount,
      otherCount,
      totalSize,
      averageFileSize,
    };
  }
}
