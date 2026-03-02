import { PrismaClient } from "@prisma/client";
import {
  ISizeGuideRepository,
  SizeGuideQueryOptions,
  SizeGuideCountOptions,
} from "../../../domain/repositories/size-guide.repository";
import {
  SizeGuide,
  SizeGuideId,
  Region,
} from "../../../domain/entities/size-guide.entity";

export class SizeGuideRepository implements ISizeGuideRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(sizeGuide: SizeGuide): Promise<void> {
    const data = sizeGuide.toDatabaseRow();

    await this.prisma.sizeGuide.create({
      data: {
        id: data.size_guide_id,
        title: data.title,
        bodyHtml: data.body_html,
        region: data.region,
        category: data.category,
      },
    });
  }

  async findById(id: SizeGuideId): Promise<SizeGuide | null> {
    const sizeGuideData = await this.prisma.sizeGuide.findUnique({
      where: { id: id.getValue() },
    });

    if (!sizeGuideData) {
      return null;
    }

    return SizeGuide.fromDatabaseRow({
      size_guide_id: sizeGuideData.id,
      title: sizeGuideData.title,
      body_html: sizeGuideData.bodyHtml,
      region: sizeGuideData.region as Region,
      category: sizeGuideData.category,
    });
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
      if (hasContent) {
        whereClause.bodyHtml = { not: null };
      } else {
        whereClause.bodyHtml = null;
      }
    }

    const sizeGuides = await this.prisma.sizeGuide.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return sizeGuides.map((sizeGuideData) =>
      SizeGuide.fromDatabaseRow({
        size_guide_id: sizeGuideData.id,
        title: sizeGuideData.title,
        body_html: sizeGuideData.bodyHtml,
        region: sizeGuideData.region as Region,
        category: sizeGuideData.category,
      }),
    );
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

    const whereClause: any = { region: region };

    if (hasContent !== undefined) {
      if (hasContent) {
        whereClause.bodyHtml = { not: null };
      } else {
        whereClause.bodyHtml = null;
      }
    }

    const sizeGuides = await this.prisma.sizeGuide.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return sizeGuides.map((sizeGuideData) =>
      SizeGuide.fromDatabaseRow({
        size_guide_id: sizeGuideData.id,
        title: sizeGuideData.title,
        body_html: sizeGuideData.bodyHtml,
        region: sizeGuideData.region as Region,
        category: sizeGuideData.category,
      }),
    );
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
      if (hasContent) {
        whereClause.bodyHtml = { not: null };
      } else {
        whereClause.bodyHtml = null;
      }
    }

    const sizeGuides = await this.prisma.sizeGuide.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return sizeGuides.map((sizeGuideData) =>
      SizeGuide.fromDatabaseRow({
        size_guide_id: sizeGuideData.id,
        title: sizeGuideData.title,
        body_html: sizeGuideData.bodyHtml,
        region: sizeGuideData.region as Region,
        category: sizeGuideData.category,
      }),
    );
  }

  async findByRegionAndCategory(
    region: Region,
    category: string,
  ): Promise<SizeGuide | null> {
    const sizeGuideData = await this.prisma.sizeGuide.findFirst({
      where: {
        region: region,
        category: category,
      },
    });

    if (!sizeGuideData) {
      return null;
    }

    return SizeGuide.fromDatabaseRow({
      size_guide_id: sizeGuideData.id,
      title: sizeGuideData.title,
      body_html: sizeGuideData.bodyHtml,
      region: sizeGuideData.region as Region,
      category: sizeGuideData.category,
    });
  }

  async findGeneral(region: Region): Promise<SizeGuide[]> {
    const sizeGuides = await this.prisma.sizeGuide.findMany({
      where: {
        region: region,
        category: null,
      },
      orderBy: { title: "asc" },
    });

    return sizeGuides.map((sizeGuideData) =>
      SizeGuide.fromDatabaseRow({
        size_guide_id: sizeGuideData.id,
        title: sizeGuideData.title,
        body_html: sizeGuideData.bodyHtml,
        region: sizeGuideData.region as Region,
        category: sizeGuideData.category,
      }),
    );
  }

  async update(sizeGuide: SizeGuide): Promise<void> {
    const data = sizeGuide.toDatabaseRow();

    await this.prisma.sizeGuide.update({
      where: { id: data.size_guide_id },
      data: {
        title: data.title,
        bodyHtml: data.body_html,
        region: data.region,
        category: data.category,
      },
    });
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
      if (options.hasContent) {
        whereClause.bodyHtml = { not: null };
      } else {
        whereClause.bodyHtml = null;
      }
    }

    return await this.prisma.sizeGuide.count({
      where: whereClause,
    });
  }
}
