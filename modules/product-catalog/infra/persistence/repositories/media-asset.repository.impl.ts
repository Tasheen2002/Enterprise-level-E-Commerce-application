import { PrismaClient, Prisma } from "@prisma/client";
import {
  IMediaAssetRepository,
  MediaAssetFilters,
  MediaAssetQueryOptions,
  MediaAssetCountOptions,
} from "../../../domain/repositories/media-asset.repository";
import { MediaAsset } from "../../../domain/entities/media-asset.entity";
import { MediaAssetId } from "../../../domain/value-objects/media-asset-id.vo";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";

type MediaAssetRow = Prisma.MediaAssetGetPayload<object>;

export class MediaAssetRepositoryImpl
  extends PrismaRepository<MediaAsset>
  implements IMediaAssetRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private convertBigIntToNumber(value: bigint | null): number | null {
    if (value === null) return null;
    return Number(value);
  }

  private mapRow(row: MediaAssetRow): MediaAsset {
    return MediaAsset.fromPersistence({
      id: MediaAssetId.fromString(row.id),
      storageKey: row.storageKey,
      mime: row.mime,
      width: row.width,
      height: row.height,
      bytes: this.convertBigIntToNumber(row.bytes as bigint | null),
      altText: row.altText,
      focalX: row.focalX,
      focalY: row.focalY,
      renditions: (row.renditions ?? {}) as Record<string, unknown>,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: (row as any).updatedAt ?? row.createdAt,
    });
  }

  async save(asset: MediaAsset): Promise<void> {
    const updateData = {
      storageKey: asset.storageKey,
      mime: asset.mime,
      width: asset.width,
      height: asset.height,
      bytes: asset.bytes,
      altText: asset.altText,
      focalX: asset.focalX,
      focalY: asset.focalY,
      renditions: asset.renditions as Prisma.InputJsonValue,
      version: asset.version,
      updatedAt: asset.updatedAt,
    };
    await this.prisma.mediaAsset.upsert({
      where: { id: asset.id.getValue() },
      create: { id: asset.id.getValue(), createdAt: asset.createdAt, ...updateData },
      update: updateData,
    });
    await this.dispatchEvents(asset);
  }

  async findById(id: MediaAssetId): Promise<MediaAsset | null> {
    const row = await this.prisma.mediaAsset.findUnique({
      where: { id: id.getValue() },
    });
    return row ? this.mapRow(row) : null;
  }

  async findByStorageKey(storageKey: string): Promise<MediaAsset | null> {
    const row = await this.prisma.mediaAsset.findFirst({
      where: { storageKey },
    });
    return row ? this.mapRow(row) : null;
  }

  async findAll(options?: MediaAssetQueryOptions): Promise<MediaAsset[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
      hasRenditions,
    } = options || {};

    const where: Prisma.MediaAssetWhereInput = {};

    if (hasRenditions !== undefined) {
      where.renditions = hasRenditions
        ? { not: Prisma.JsonNull as unknown as Prisma.InputJsonValue }
        : { equals: Prisma.JsonNull };
    }

    const rows = await this.prisma.mediaAsset.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return rows.map((row) => this.mapRow(row));
  }

  async findByMimeType(
    mimeType: string,
    options?: MediaAssetQueryOptions,
  ): Promise<MediaAsset[]> {
    const { limit = 50, offset = 0, sortBy = "createdAt", sortOrder = "desc" } = options || {};

    const rows = await this.prisma.mediaAsset.findMany({
      where: { mime: mimeType },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return rows.map((row) => this.mapRow(row));
  }

  async findImages(options?: MediaAssetQueryOptions): Promise<MediaAsset[]> {
    const { limit = 50, offset = 0, sortBy = "createdAt", sortOrder = "desc" } = options || {};

    const rows = await this.prisma.mediaAsset.findMany({
      where: { mime: { startsWith: "image/" } },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return rows.map((row) => this.mapRow(row));
  }

  async findVideos(options?: MediaAssetQueryOptions): Promise<MediaAsset[]> {
    const { limit = 50, offset = 0, sortBy = "createdAt", sortOrder = "desc" } = options || {};

    const rows = await this.prisma.mediaAsset.findMany({
      where: { mime: { startsWith: "video/" } },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return rows.map((row) => this.mapRow(row));
  }

  async findByDimensions(
    width: number,
    height: number,
    options?: MediaAssetQueryOptions,
  ): Promise<MediaAsset[]> {
    const { limit = 50, offset = 0, sortBy = "createdAt", sortOrder = "desc" } = options || {};

    const rows = await this.prisma.mediaAsset.findMany({
      where: { width, height },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return rows.map((row) => this.mapRow(row));
  }

  async findBySizeRange(
    minBytes: number,
    maxBytes: number,
    options?: MediaAssetQueryOptions,
  ): Promise<MediaAsset[]> {
    const { limit = 50, offset = 0, sortBy = "bytes", sortOrder = "asc" } = options || {};

    const rows = await this.prisma.mediaAsset.findMany({
      where: { bytes: { gte: minBytes, lte: maxBytes } },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return rows.map((row) => this.mapRow(row));
  }

  async findOrphaned(): Promise<MediaAsset[]> {
    const rows = await this.prisma.mediaAsset.findMany({
      where: {
        AND: [
          { productMedia: { none: {} } },
          { variantMedia: { none: {} } },
          { editorialLooks: { none: {} } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((row) => this.mapRow(row));
  }

  async delete(id: MediaAssetId): Promise<void> {
    await this.prisma.mediaAsset.delete({
      where: { id: id.getValue() },
    });
  }

  async exists(id: MediaAssetId): Promise<boolean> {
    const count = await this.prisma.mediaAsset.count({
      where: { id: id.getValue() },
    });
    return count > 0;
  }

  async existsByStorageKey(storageKey: string): Promise<boolean> {
    const count = await this.prisma.mediaAsset.count({
      where: { storageKey },
    });
    return count > 0;
  }

  async count(options?: MediaAssetCountOptions): Promise<number> {
    const where: Prisma.MediaAssetWhereInput = {};

    // mimeType / isImage / isVideo are mutually exclusive — first one wins
    if (options?.mimeType) {
      where.mime = options.mimeType;
    } else if (options?.isImage) {
      where.mime = { startsWith: "image/" };
    } else if (options?.isVideo) {
      where.mime = { startsWith: "video/" };
    }

    if (options?.hasRenditions !== undefined) {
      where.renditions = options.hasRenditions
        ? { not: Prisma.JsonNull as unknown as Prisma.InputJsonValue }
        : { equals: Prisma.JsonNull };
    }

    return this.prisma.mediaAsset.count({ where });
  }

  async getTotalSize(): Promise<number> {
    const result = await this.prisma.mediaAsset.aggregate({
      _sum: { bytes: true },
    });

    return this.convertBigIntToNumber(result._sum.bytes as bigint | null) ?? 0;
  }

  async findWithFilters(
    filters: MediaAssetFilters,
    options?: MediaAssetQueryOptions,
  ): Promise<MediaAsset[]> {
    const { limit = 50, offset = 0, sortBy = "createdAt", sortOrder = "desc" } = options || {};

    const where: Prisma.MediaAssetWhereInput = {};

    // mimeType / isImage / isVideo are mutually exclusive — first one wins
    if (filters.mimeType) {
      where.mime = filters.mimeType;
    } else if (filters.isImage) {
      where.mime = { startsWith: "image/" };
    } else if (filters.isVideo) {
      where.mime = { startsWith: "video/" };
    }

    if (filters.minBytes !== undefined || filters.maxBytes !== undefined) {
      where.bytes = {};
      if (filters.minBytes !== undefined) (where.bytes as Prisma.IntNullableFilter).gte = filters.minBytes;
      if (filters.maxBytes !== undefined) (where.bytes as Prisma.IntNullableFilter).lte = filters.maxBytes;
    }

    if (filters.hasRenditions !== undefined) {
      where.renditions = filters.hasRenditions
        ? { not: Prisma.JsonNull as unknown as Prisma.InputJsonValue }
        : { equals: Prisma.JsonNull };
    }

    const rows = await this.prisma.mediaAsset.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return rows.map((row) => this.mapRow(row));
  }
}
