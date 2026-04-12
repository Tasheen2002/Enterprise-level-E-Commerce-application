import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { Region } from "../../domain/entities/size-guide.entity";
import { SizeGuideManagementService } from "../services/size-guide-management.service";

export interface ValidateSizeGuideUniquenessQuery extends IQuery {
  region: Region;
  category?: string;
}

export interface SizeGuideUniquenessResult {
  region: Region;
  category: string | null;
  isUnique: boolean;
  available: boolean;
}

export class ValidateSizeGuideUniquenessHandler implements IQueryHandler<ValidateSizeGuideUniquenessQuery, SizeGuideUniquenessResult> {
  constructor(private readonly sizeGuideManagementService: SizeGuideManagementService) {}

  async handle(query: ValidateSizeGuideUniquenessQuery): Promise<SizeGuideUniquenessResult> {
    const category = query.category ?? null;
    const isUnique = await this.sizeGuideManagementService.validateSizeGuideUniqueness(query.region, category);
    return { region: query.region, category, isUnique, available: isUnique };
  }
}
