import { PrismaClient } from "@prisma/client";
import {
  ISizeGuideRepository,
  SizeGuideQueryOptions,
  SizeGuideCountOptions,
} from "../../../domain/repositories/size-guide.repository";
import { SizeGuide } from "../../../domain/entities/size-guide.entity";
import { SizeGuideId } from "../../../domain/value-objects/size-guide-id.vo";
import { Region } from "../../../domain/enums/product-catalog.enums";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";

export class SizeGuideRepositoryImpl
  extends PrismaRepository<SizeGuide>
  implements ISizeGuideRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private hydrate(row: {
    id: string;
    title: string;
    bodyHtml: string | null;
    region: string;
    category: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  }): SizeGuide {
    if (!row.createdAt || !row.updatedAt) {
      throw new Error(`SizeGuide row is missing timestamps for id=${row.id}`);
    }
    return SizeGuide.fromPersistence({
      id: SizeGuideId.fromString(row.id),
      title: row.title,
      bodyHtml: row.bodyHtml,
      region: row.region as Region,
      category: row.category,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async save(sizeGuide: SizeGuide): Promise<void> {
    const updateData = {
      title: sizeGuide.title,
      bodyHtml: sizeGuide.bodyHtml,
      region: sizeGuide.region,
      category: sizeGuide.category,
      updatedAt: sizeGuide.updatedAt,
    };
    await this.prisma.sizeGuide.upsert({
      where: { id: sizeGuide.id.getValue() },
      create: { id: sizeGuide.id.getValue(), createdAt: sizeGuide.createdAt, ...updateData },
      update: updateData,
    });
    await this.dispatchEvents(sizeGuide);
  }

  async findById(id: SizeGuideId): Promise<SizeGuide | null> {
    const row = await this.prisma.sizeGuide.findUnique({
      where: { id: id.getValue() },
    });
    return row ? this.hydrate(row) : null;
  }

  async findAll(options?: SizeGuideQueryOptions): Promise<SizeGuide[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "title",
      sortOrder = "asc",
      hasContent,
    } = options || {};

    const where: Record<string, unknown> = {};

    if (hasContent !== undefined) {
      where.bodyHtml = hasContent ? { not: null } : null;
    }

    const rows = await this.prisma.sizeGuide.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return rows.map((row) => this.hydrate(row));
  }

  async findByRegion(
    region: Region,
    options?: SizeGuideQueryOptions,
  ): Promise<SizeGuide[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "title",
      sortOrder = "asc",
      hasContent,
    } = options || {};

    const where: Record<string, unknown> = { region };

    if (hasContent !== undefined) {
      where.bodyHtml = hasContent ? { not: null } : null;
    }

    const rows = await this.prisma.sizeGuide.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return rows.map((row) => this.hydrate(row));
  }

  async findByCategory(
    category: string,
    options?: SizeGuideQueryOptions,
  ): Promise<SizeGuide[]> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "title",
      sortOrder = "asc",
      hasContent,
    } = options || {};

    const where: Record<string, unknown> = { category };

    if (hasContent !== undefined) {
      where.bodyHtml = hasContent ? { not: null } : null;
    }

    const rows = await this.prisma.sizeGuide.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return rows.map((row) => this.hydrate(row));
  }

  async findByRegionAndCategory(
    region: Region,
    category: string,
  ): Promise<SizeGuide | null> {
    const row = await this.prisma.sizeGuide.findFirst({
      where: { region, category },
    });
    return row ? this.hydrate(row) : null;
  }

  async findGeneral(region: Region): Promise<SizeGuide[]> {
    const rows = await this.prisma.sizeGuide.findMany({
      where: { region, category: null },
      orderBy: { title: "asc" },
    });
    return rows.map((row) => this.hydrate(row));
  }

  async delete(id: SizeGuideId): Promise<void> {
    await this.prisma.sizeGuide.delete({
      where: { id: id.getValue() },
    });
  }

  async exists(id: SizeGuideId): Promise<boolean> {
    const count = await this.prisma.sizeGuide.count({
      where: { id: id.getValue() },
    });
    return count > 0;
  }

  async count(options?: SizeGuideCountOptions): Promise<number> {
    const where: Record<string, unknown> = {};

    if (options?.region) {
      where.region = options.region;
    }

    if (options?.category) {
      where.category = options.category;
    }

    if (options?.hasContent !== undefined) {
      where.bodyHtml = options.hasContent ? { not: null } : null;
    }

    return this.prisma.sizeGuide.count({ where });
  }
}
