import { SizeGuide, SizeGuideId, Region } from "../entities/size-guide.entity";

export interface ISizeGuideRepository {
  save(sizeGuide: SizeGuide): Promise<void>;
  findById(id: SizeGuideId): Promise<SizeGuide | null>;
  findAll(options?: SizeGuideQueryOptions): Promise<SizeGuide[]>;
  findByRegion(
    region: Region,
    options?: SizeGuideQueryOptions,
  ): Promise<SizeGuide[]>;
  findByCategory(
    category: string,
    options?: SizeGuideQueryOptions,
  ): Promise<SizeGuide[]>;
  findByRegionAndCategory(
    region: Region,
    category: string,
  ): Promise<SizeGuide | null>;
  findGeneral(region: Region): Promise<SizeGuide[]>;
  update(sizeGuide: SizeGuide): Promise<void>;
  delete(id: SizeGuideId): Promise<void>;
  exists(id: SizeGuideId): Promise<boolean>;
  count(options?: SizeGuideCountOptions): Promise<number>;
}

export interface SizeGuideQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "title" | "region" | "category";
  sortOrder?: "asc" | "desc";
  hasContent?: boolean;
}

export interface SizeGuideCountOptions {
  region?: Region;
  category?: string;
  hasContent?: boolean;
}
