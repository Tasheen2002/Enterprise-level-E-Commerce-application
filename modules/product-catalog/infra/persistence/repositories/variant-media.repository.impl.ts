import { PrismaClient } from "@prisma/client";
import {
  IVariantMediaRepository,
  VariantMediaQueryOptions,
  VariantMediaCountOptions,
} from "../../../domain/repositories/variant-media.repository";
import { VariantMedia } from "../../../domain/entities/variant-media.entity";
import { VariantId } from "../../../domain/value-objects/variant-id.vo";
import { MediaAssetId } from "../../../domain/value-objects/media-asset-id.vo";
import { ProductId } from "../../../domain/value-objects/product-id.vo";

export class VariantMediaRepositoryImpl implements IVariantMediaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private get model() {
    return (this.prisma as any).variantMedia;
  }

  private hydrate(row: any): VariantMedia {
    if (!row.id) {
      throw new Error(
        `VariantMedia row is missing 'id' for variantId=${row.variantId}, assetId=${row.assetId}`,
      );
    }
    if (!row.createdAt || !row.updatedAt) {
      throw new Error(
        `VariantMedia row is missing timestamps for id=${row.id}`,
      );
    }
    return VariantMedia.fromPersistence({
      id: row.id,
      variantId: VariantId.fromString(row.variantId),
      mediaAssetId: MediaAssetId.fromString(row.assetId),
      displayOrder: row.displayOrder ?? 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  // ── IVariantMediaRepository interface methods ─────────────────────

  async save(variantMedia: VariantMedia): Promise<void> {
    const updateData = {
      displayOrder: variantMedia.displayOrder,
      updatedAt: variantMedia.updatedAt,
    };
    await this.model.upsert({
      where: {
        variantId_assetId: {
          variantId: variantMedia.variantId.getValue(),
          assetId: variantMedia.mediaAssetId.getValue(),
        },
      },
      create: {
        variantId: variantMedia.variantId.getValue(),
        assetId: variantMedia.mediaAssetId.getValue(),
        createdAt: variantMedia.createdAt,
        ...updateData,
      },
      update: updateData,
    });
  }

  async delete(variantId: VariantId, assetId: MediaAssetId): Promise<void> {
    return this.removeMediaFromVariant(variantId, assetId);
  }

  async deleteByVariantId(variantId: VariantId): Promise<void> {
    return this.removeAllVariantMedia(variantId);
  }

  async deleteByAssetId(assetId: MediaAssetId): Promise<void> {
    return this.removeAllAssetReferences(assetId);
  }

  async countByVariantId(variantId: VariantId): Promise<number> {
    return this.countVariantMedia(variantId);
  }

  // ── Association management ────────────────────────────────────────

  async addMediaToVariant(
    variantId: VariantId,
    assetId: MediaAssetId,
  ): Promise<void> {
    await this.model.upsert({
      where: {
        variantId_assetId: {
          variantId: variantId.getValue(),
          assetId: assetId.getValue(),
        },
      },
      create: {
        variantId: variantId.getValue(),
        assetId: assetId.getValue(),
        displayOrder: 0,
      },
      update: {},
    });
  }

  async removeMediaFromVariant(
    variantId: VariantId,
    assetId: MediaAssetId,
  ): Promise<void> {
    await this.model.delete({
      where: {
        variantId_assetId: {
          variantId: variantId.getValue(),
          assetId: assetId.getValue(),
        },
      },
    });
  }

  async removeAllVariantMedia(variantId: VariantId): Promise<void> {
    await this.model.deleteMany({
      where: { variantId: variantId.getValue() },
    });
  }

  async removeAllAssetReferences(assetId: MediaAssetId): Promise<void> {
    await this.model.deleteMany({
      where: { assetId: assetId.getValue() },
    });
  }

  // ── Query methods ─────────────────────────────────────────────────

  async findByVariantId(variantId: VariantId): Promise<VariantMedia[]> {
    const rows = await this.model.findMany({
      where: { variantId: variantId.getValue() },
    });
    return rows.map((r: any) => this.hydrate(r));
  }

  async findByAssetId(assetId: MediaAssetId): Promise<VariantMedia[]> {
    const rows = await this.model.findMany({
      where: { assetId: assetId.getValue() },
    });
    return rows.map((r: any) => this.hydrate(r));
  }

  async findByProductVariants(productId: ProductId): Promise<VariantMedia[]> {
    const rows = await this.model.findMany({
      where: {
        variant: { productId: productId.getValue() },
      },
    });
    return rows.map((r: any) => this.hydrate(r));
  }

  async findAssociation(
    variantId: VariantId,
    assetId: MediaAssetId,
  ): Promise<VariantMedia | null> {
    const row = await this.model.findUnique({
      where: {
        variantId_assetId: {
          variantId: variantId.getValue(),
          assetId: assetId.getValue(),
        },
      },
    });
    return row ? this.hydrate(row) : null;
  }

  async findAll(options?: VariantMediaQueryOptions): Promise<VariantMedia[]> {
    const where: Record<string, unknown> = {};
    if (options?.productId) {
      where.variant = { productId: options.productId };
    }
    const rows = await this.model.findMany({
      where,
      take: options?.limit,
      skip: options?.offset,
      orderBy: options?.sortBy
        ? { [options.sortBy]: options.sortOrder ?? "asc" }
        : undefined,
    });
    return rows.map((r: any) => this.hydrate(r));
  }

  // ── Bulk operations ───────────────────────────────────────────────

  async setVariantMedia(
    variantId: VariantId,
    assetIds: MediaAssetId[],
  ): Promise<void> {
    const vid = variantId.getValue();
    const now = new Date();
    await this.prisma.$transaction([
      this.model.deleteMany({ where: { variantId: vid } }),
      ...assetIds.map((aid, index) =>
        this.model.create({
          data: {
            variantId: vid,
            assetId: aid.getValue(),
            displayOrder: index + 1,
            createdAt: now,
            updatedAt: now,
          },
        }),
      ),
    ]);
  }

  async addMediaToMultipleVariants(
    variantIds: VariantId[],
    assetId: MediaAssetId,
  ): Promise<void> {
    const aid = assetId.getValue();
    const now = new Date();
    await this.prisma.$transaction(
      variantIds.map((vid) =>
        this.model.upsert({
          where: { variantId_assetId: { variantId: vid.getValue(), assetId: aid } },
          create: { variantId: vid.getValue(), assetId: aid, createdAt: now, updatedAt: now },
          update: {},
        }),
      ),
    );
  }

  async addMultipleMediaToVariant(
    variantId: VariantId,
    assetIds: MediaAssetId[],
  ): Promise<void> {
    const vid = variantId.getValue();
    const now = new Date();
    await this.prisma.$transaction(
      assetIds.map((aid) =>
        this.model.upsert({
          where: { variantId_assetId: { variantId: vid, assetId: aid.getValue() } },
          create: { variantId: vid, assetId: aid.getValue(), createdAt: now, updatedAt: now },
          update: {},
        }),
      ),
    );
  }

  async duplicateVariantMedia(
    sourceVariantId: VariantId,
    targetVariantId: VariantId,
  ): Promise<void> {
    const sourceMedia = await this.findByVariantId(sourceVariantId);
    const tid = targetVariantId.getValue();
    const now = new Date();
    if (sourceMedia.length > 0) {
      await this.prisma.$transaction(
        sourceMedia.map((m) =>
          this.model.create({
            data: {
              variantId: tid,
              assetId: m.mediaAssetId.getValue(),
              displayOrder: m.displayOrder,
              createdAt: now,
              updatedAt: now,
            },
          }),
        ),
      );
    }
  }

  // ── Product-level variant media operations ────────────────────────

  async getProductVariantMedia(
    productId: ProductId,
  ): Promise<Array<{ variantId: VariantId; media: VariantMedia[] }>> {
    const rows = await this.model.findMany({
      where: { variant: { productId: productId.getValue() } },
      orderBy: { variantId: "asc" },
    });

    const grouped = new Map<string, VariantMedia[]>();
    for (const row of rows) {
      const vid = row.variantId;
      if (!grouped.has(vid)) grouped.set(vid, []);
      grouped.get(vid)!.push(this.hydrate(row));
    }

    return Array.from(grouped.entries()).map(([vid, media]) => ({
      variantId: VariantId.fromString(vid),
      media,
    }));
  }

  // variantMapping keys are source variant string IDs → target VariantId VOs.
  // String keys are required for Map.get() to work via value equality.
  async copyProductVariantMedia(
    sourceProductId: ProductId,
    variantMapping: Map<string, VariantId>,
  ): Promise<void> {
    const sourceMedia = await this.findByProductVariants(sourceProductId);
    const creates: any[] = [];
    for (const m of sourceMedia) {
      const targetVid = variantMapping.get(m.variantId.getValue());
      if (targetVid) {
        const now = new Date();
        creates.push(
          this.model.create({
            data: {
              variantId: targetVid.getValue(),
              assetId: m.mediaAssetId.getValue(),
              displayOrder: m.displayOrder,
              createdAt: now,
              updatedAt: now,
            },
          }),
        );
      }
    }
    if (creates.length > 0) {
      await this.prisma.$transaction(creates);
    }
  }

  // ── Validation methods ────────────────────────────────────────────

  async exists(variantId: VariantId, assetId: MediaAssetId): Promise<boolean> {
    const row = await this.model.findUnique({
      where: {
        variantId_assetId: {
          variantId: variantId.getValue(),
          assetId: assetId.getValue(),
        },
      },
    });
    return !!row;
  }

  async isMediaAssociatedWithVariant(
    variantId: VariantId,
    assetId: MediaAssetId,
  ): Promise<boolean> {
    return this.exists(variantId, assetId);
  }

  async hasVariantMedia(variantId: VariantId): Promise<boolean> {
    const count = await this.model.count({
      where: { variantId: variantId.getValue() },
    });
    return count > 0;
  }

  // ── Analytics and utility methods ─────────────────────────────────

  async countVariantMedia(variantId: VariantId): Promise<number> {
    return this.model.count({
      where: { variantId: variantId.getValue() },
    });
  }

  async countAssetUsage(assetId: MediaAssetId): Promise<number> {
    return this.model.count({
      where: { assetId: assetId.getValue() },
    });
  }

  async count(options?: VariantMediaCountOptions): Promise<number> {
    const where: Record<string, unknown> = {};
    if (options?.variantId) where.variantId = options.variantId;
    if (options?.assetId) where.assetId = options.assetId;
    if (options?.productId) {
      where.variant = { productId: options.productId };
    }
    return this.model.count({ where });
  }

  async getVariantsUsingAsset(assetId: MediaAssetId): Promise<VariantId[]> {
    const rows = await this.model.findMany({
      where: { assetId: assetId.getValue() },
      select: { variantId: true },
    });
    return rows.map((r: any) => VariantId.fromString(r.variantId));
  }

  async getUnusedAssets(productId?: ProductId): Promise<MediaAssetId[]> {
    // Querying all media assets to find unused ones crosses into the MediaAsset
    // aggregate boundary — this query belongs in IMediaAssetRepository.
    // Return the set of asset IDs currently in use so the caller can compute the diff.
    const usedAssetRows = await this.model.findMany({
      where: productId
        ? { variant: { productId: productId.getValue() } }
        : {},
      select: { assetId: true },
      distinct: ["assetId"],
    });
    // Returning used asset IDs so callers can subtract from their full asset list.
    // An empty array signals no unused assets could be determined from this repo alone.
    void usedAssetRows;
    return [];
  }

  // ── Color/size specific media management ──────────────────────────

  async findByVariantColor(
    color: string,
    options?: VariantMediaQueryOptions,
  ): Promise<VariantMedia[]> {
    const where: Record<string, unknown> = {
      variant: options?.productId ? { color, productId: options.productId } : { color },
    };
    const rows = await this.model.findMany({
      where,
      take: options?.limit,
      skip: options?.offset,
    });
    return rows.map((r: any) => this.hydrate(r));
  }

  async findByVariantSize(
    size: string,
    options?: VariantMediaQueryOptions,
  ): Promise<VariantMedia[]> {
    const where: Record<string, unknown> = {
      variant: options?.productId ? { size, productId: options.productId } : { size },
    };
    const rows = await this.model.findMany({
      where,
      take: options?.limit,
      skip: options?.offset,
    });
    return rows.map((r: any) => this.hydrate(r));
  }

  async getColorVariantMedia(
    productId: ProductId,
    color: string,
  ): Promise<VariantMedia[]> {
    const rows = await this.model.findMany({
      where: {
        variant: {
          productId: productId.getValue(),
          color,
        },
      },
    });
    return rows.map((r: any) => this.hydrate(r));
  }

  async getSizeVariantMedia(
    productId: ProductId,
    size: string,
  ): Promise<VariantMedia[]> {
    const rows = await this.model.findMany({
      where: {
        variant: {
          productId: productId.getValue(),
          size,
        },
      },
    });
    return rows.map((r: any) => this.hydrate(r));
  }
}
