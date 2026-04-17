import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { SizeGuideDTO } from "../../domain/entities/size-guide.entity";
import { SizeGuideManagementService } from "../services/size-guide-management.service";

export interface GetSizeGuideQuery extends IQuery {
  readonly id: string;
}

export class GetSizeGuideHandler implements IQueryHandler<GetSizeGuideQuery, SizeGuideDTO> {
  constructor(private readonly sizeGuideManagementService: SizeGuideManagementService) {}

  async handle(query: GetSizeGuideQuery): Promise<SizeGuideDTO> {
    return this.sizeGuideManagementService.getSizeGuideById(query.id);
  }
}
