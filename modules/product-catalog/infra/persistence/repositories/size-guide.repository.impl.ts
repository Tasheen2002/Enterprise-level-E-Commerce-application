import { PrismaClient } from "@prisma/client";
import {
  ISizeGuideRepository,
  SizeGuideQueryOptions,
  SizeGuideCountOptions,
} from "../../../domain/repositories/size-guide.repository";
import {
  SizeGuide,
  SizeGuideId,
} from "../../../domain/entities/size-guide.entity";
import { Region } from "../../../domain/enums/product-catalog.enums";

export class SizeGuideRepositoryImpl implements ISizeGuideRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private hydrate(row: {
    id: string;
    title: string;
    bodyHtml: string | null;
    region: string;
    category: string | null;
  }): SizeGuide {
    return SizeGuide.fromPersistence({
      id: SizeGuideId.fromString(row.id),
      title: row.title,
      bodyHtml: row.bodyHtml,
      region: row.region as Region,
      category: row.category,
    });
  }

  async save(sizeGuide: SizeGuide): Promise<void> {
    const data = {
      title: sizeGuide.title,
      bodyHtml: sizeGuide.bodyHtml,
      region: sizeGuide.region,
      category: sizeGuide.category,
    };
    await this.prisma.sizeGuide.upsert({
      where: { id: sizeGuide.id.getValue() },
      create: { id: sizeGuide.id.getValue(), ...data },
      update: data,
    });
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

    const whereClause: any = {};

    if (hasContent !== undefined) {
      whereClause.bodyHtml = hasContent ? { not: null } : null;
    }

    const rows = await this.prisma.sizeGuide.findMany({
      where: whereClause,
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

    const whereClause: any = { region };

    if (hasContent !== undefined) {
      whereClause.bodyHtml = hasContent ? { not: null } : null;
    }

    const rows = await this.prisma.sizeGuide.findMany({
      where: whereClause,
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

    const whereClause: any = { category };

    if (hasContent !== undefined) {
      whereClause.bodyHtml = hasContent ? { not: null } : null;
    }

    const rows = await this.prisma.sizeGuide.findMany({
      where: whereClause,
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
    const whereClause: any = {};

    if (options?.region) {
      whereClause.region = options.region;
    }

    if (options?.category) {
      whereClause.category = options.category;
    }

    if (options?.hasContent !== undefined) {
      whereClause.bodyHtml = options.hasContent ? { not: null } : null;
    }

    return await this.prisma.sizeGuide.count({ where: whereClause });
  }
}
