import { PrismaClient, Prisma } from "@prisma/client";
import {
  IVariantMediaRepository,
  VariantMediaQueryOptions,
  ProductVariantMediaItem,
} from "../../../domain/repositories/variant-media.repository";
import { VariantMedia } from "../../../domain/entities/variant-media.entity";
import { VariantId } from "../../../domain/value-objects/variant-id.vo";
import { MediaAssetId } from "../../../domain/value-objects/media-asset-id.vo";
import { ProductId } from "../../../domain/value-objects/product-id.vo";

type VariantMediaRow = Prisma.VariantMediaGetPayload<object>;

// VariantMedia is a join-table entity, not an aggregate root — no domain events.
// No PrismaRepository base or dispatchEvents needed; plain Prisma access is correct.
export class VariantMediaRepositoryImpl implements IVariantMediaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Composite PK [variantId, assetId] — synthesize a string id for the entity.
  private toDomain(row: VariantMediaRow): VariantMedia {
    return VariantMedia.fromPersistence({
      id: `${row.variantId}:${row.assetId}`,
      variantId: VariantId.fromString(row.variantId),
      mediaAssetId: MediaAssetId.fromString(row.assetId),
      displayOrder: row.displayOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  // ── Core CRUD ────────────────────────────────────────────────────────

  async save(variantMedia: VariantMedia): Promise<void> {
    const updateData = {
      displayOrder: variantMedia.displayOrder,
      updatedAt: variantMedia.updatedAt,
    };
    await this.prisma.variantMedia.upsert({
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
    await this.prisma.variantMedia.deleteMany({
      where: { variantId: variantId.getValue() },
    });
  }

  async deleteByAssetId(assetId: MediaAssetId): Promise<void> {
    await this.prisma.variantMedia.deleteMany({
      where: { assetId: assetId.getValue() },
    });
  }

  // ── Association management ────────────────────────────────────────

  async addMediaToVariant(
    variantId: VariantId,
    assetId: MediaAssetId,
  ): Promise<void> {
    await this.prisma.variantMedia.upsert({
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
    await this.prisma.variantMedia.delete({
      where: {
        variantId_assetId: {
          variantId: variantId.getValue(),
          assetId: assetId.getValue(),
        },
      },
    });
  }

  async removeAllVariantMedia(variantId: VariantId): Promise<void> {
    await this.prisma.variantMedia.deleteMany({
      where: { variantId: variantId.getValue() },
    });
  }

  async setVariantMedia(
    variantId: VariantId,
    assetIds: MediaAssetId[],
  ): Promise<void> {
    const vid = variantId.getValue();
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.variantMedia.deleteMany({ where: { variantId: vid } }),
      ...assetIds.map((aid, index) =>
        this.prisma.variantMedia.create({
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
        this.prisma.variantMedia.upsert({
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
        this.prisma.variantMedia.upsert({
          where: { variantId_assetId: { variantId: vid, assetId: aid.getValue() } },
          create: { variantId: vid, assetId: aid.getValue(), createdAt: now, updatedAt: now },
          update: {},
        }),
      ),
    );
  }

  // ── Queries ─────────────────────────────────────────────────────────

  async findByVariantId(variantId: VariantId): Promise<VariantMedia[]> {
    const rows = await this.prisma.variantMedia.findMany({
      where: { variantId: variantId.getValue() },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByAssetId(assetId: MediaAssetId): Promise<VariantMedia[]> {
    const rows = await this.prisma.variantMedia.findMany({
      where: { assetId: assetId.getValue() },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findAssociation(
    variantId: VariantId,
    assetId: MediaAssetId,
  ): Promise<VariantMedia | null> {
    const row = await this.prisma.variantMedia.findUnique({
      where: {
        variantId_assetId: {
          variantId: variantId.getValue(),
          assetId: assetId.getValue(),
        },
      },
    });
    return row ? this.toDomain(row) : null;
  }

  // ── Variant-attribute filtered media (color/size) ───────────────────

  async findByVariantColor(
    color: string,
    options?: VariantMediaQueryOptions,
  ): Promise<VariantMedia[]> {
    const where: Record<string, unknown> = {
      variant: options?.productId
        ? { color, productId: options.productId.getValue() }
        : { color },
    };
    const rows = await this.prisma.variantMedia.findMany({
      where,
      take: options?.limit,
      skip: options?.offset,
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByVariantSize(
    size: string,
    options?: VariantMediaQueryOptions,
  ): Promise<VariantMedia[]> {
    const where: Record<string, unknown> = {
      variant: options?.productId
        ? { size, productId: options.productId.getValue() }
        : { size },
    };
    const rows = await this.prisma.variantMedia.findMany({
      where,
      take: options?.limit,
      skip: options?.offset,
    });
    return rows.map((r) => this.toDomain(r));
  }

  async getColorVariantMedia(
    productId: ProductId,
    color: string,
  ): Promise<VariantMedia[]> {
    const rows = await this.prisma.variantMedia.findMany({
      where: {
        variant: { productId: productId.getValue(), color },
      },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async getSizeVariantMedia(
    productId: ProductId,
    size: string,
  ): Promise<VariantMedia[]> {
    const rows = await this.prisma.variantMedia.findMany({
      where: {
        variant: { productId: productId.getValue(), size },
      },
    });
    return rows.map((r) => this.toDomain(r));
  }

  // ── Product-level variant media operations ────────────────────────

  async getProductVariantMedia(
    productId: ProductId,
  ): Promise<ProductVariantMediaItem[]> {
    const rows = await this.prisma.variantMedia.findMany({
      where: { variant: { productId: productId.getValue() } },
      orderBy: { variantId: "asc" },
    });

    const grouped = new Map<string, VariantMedia[]>();
    for (const row of rows) {
      const vid = row.variantId;
      if (!grouped.has(vid)) grouped.set(vid, []);
      grouped.get(vid)!.push(this.toDomain(row));
    }

    return Array.from(grouped.entries()).map(([vid, media]) => ({
      variantId: VariantId.fromString(vid),
      media,
    }));
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
          this.prisma.variantMedia.create({
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

  // variantMapping keys are source variant string IDs → target VariantId VOs.
  async copyProductVariantMedia(
    sourceProductId: ProductId,
    variantMapping: Map<string, VariantId>,
  ): Promise<void> {
    const sourceRows = await this.prisma.variantMedia.findMany({
      where: { variant: { productId: sourceProductId.getValue() } },
    });
    const sourceMedia = sourceRows.map((r) => this.toDomain(r));
    const creates: any[] = [];
    for (const m of sourceMedia) {
      const targetVid = variantMapping.get(m.variantId.getValue());
      if (targetVid) {
        const now = new Date();
        creates.push(
          this.prisma.variantMedia.create({
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

  // ── Counts / utilities ────────────────────────────────────────────

  async exists(variantId: VariantId, assetId: MediaAssetId): Promise<boolean> {
    const row = await this.prisma.variantMedia.findUnique({
      where: {
        variantId_assetId: {
          variantId: variantId.getValue(),
          assetId: assetId.getValue(),
        },
      },
    });
    return !!row;
  }

  async countByVariantId(variantId: VariantId): Promise<number> {
    return this.prisma.variantMedia.count({
      where: { variantId: variantId.getValue() },
    });
  }

  async countAssetUsage(assetId: MediaAssetId): Promise<number> {
    return this.prisma.variantMedia.count({
      where: { assetId: assetId.getValue() },
    });
  }

  async getVariantsUsingAsset(assetId: MediaAssetId): Promise<VariantId[]> {
    const rows = await this.prisma.variantMedia.findMany({
      where: { assetId: assetId.getValue() },
      select: { variantId: true },
      distinct: ["variantId"],
    });
    return rows.map((r: any) => VariantId.fromString(r.variantId));
  }

  // Not implemented — computing unused assets requires a full asset list to diff against.
  // That reconciliation belongs in a service (e.g., MediaManagementService.findOrphanedAssets).
  async getUnusedAssets(_productId?: ProductId): Promise<MediaAssetId[]> {
    throw new Error('getUnusedAssets is not implemented on VariantMediaRepository');
  }
}
