import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { Region } from "../../domain/value-objects";
import { SizeGuideManagementService } from "../services/size-guide-management.service";

export interface ValidateSizeGuideUniquenessQuery extends IQuery {
  readonly region: Region;
  readonly category?: string;
}

export interface SizeGuideUniquenessResult {
  readonly region: Region;
  readonly category: string | null;
  readonly isUnique: boolean;
  readonly available: boolean;
}

export class ValidateSizeGuideUniquenessHandler implements IQueryHandler<ValidateSizeGuideUniquenessQuery, SizeGuideUniquenessResult> {
  constructor(private readonly sizeGuideManagementService: SizeGuideManagementService) {}

  async handle(query: ValidateSizeGuideUniquenessQuery): Promise<SizeGuideUniquenessResult> {
    const category = query.category ?? null;
    const isUnique = await this.sizeGuideManagementService.validateSizeGuideUniqueness(query.region, category);
    return { region: query.region, category, isUnique, available: isUnique };
  }
}
