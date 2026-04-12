import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface ValidateEditorialLookForPublicationQuery extends IQuery {
  id: string;
}

export interface EditorialLookPublicationValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ValidateEditorialLookForPublicationHandler implements IQueryHandler<ValidateEditorialLookForPublicationQuery, EditorialLookPublicationValidationResult> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(query: ValidateEditorialLookForPublicationQuery): Promise<EditorialLookPublicationValidationResult> {
    return await this.editorialLookManagementService.validateLookForPublication(query.id);
  }
}
