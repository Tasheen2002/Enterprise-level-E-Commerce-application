import { IQuery, IQueryHandler, QueryResult } from '../../../../packages/core/src/application/cqrs';
import { IAdminInvitationRepository } from '../../domain/repositories/iadmin-invitation.repository';
import { AdminInvitation, AdminInvitationDTO } from '../../domain/entities/admin-invitation.entity';

export interface ListAdminInvitationsQuery extends IQuery {
  // No filter params needed for now — list all pending
}

export class ListAdminInvitationsHandler implements IQueryHandler<
  ListAdminInvitationsQuery,
  QueryResult<AdminInvitationDTO[]>
> {
  constructor(
    private readonly invitationRepository: IAdminInvitationRepository,
  ) {}

  async handle(_query: ListAdminInvitationsQuery): Promise<QueryResult<AdminInvitationDTO[]>> {
    const invitations = await this.invitationRepository.findAllPending();
    const dtos = invitations.map(inv => AdminInvitation.toDTO(inv));
    return QueryResult.success(dtos);
  }
}
