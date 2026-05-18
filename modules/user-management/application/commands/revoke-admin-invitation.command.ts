import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';
import { IAdminInvitationRepository } from '../../domain/repositories/iadmin-invitation.repository';

export interface RevokeAdminInvitationCommand extends ICommand {
  readonly invitationId: string;
}

export class RevokeAdminInvitationHandler implements ICommandHandler<
  RevokeAdminInvitationCommand,
  CommandResult<void>
> {
  constructor(
    private readonly invitationRepository: IAdminInvitationRepository,
  ) {}

  async handle(command: RevokeAdminInvitationCommand): Promise<CommandResult<void>> {
    const invitation = await this.invitationRepository.findById(command.invitationId);

    if (!invitation) {
      return CommandResult.failure('Invitation not found', undefined, 404);
    }

    invitation.revoke();
    await this.invitationRepository.save(invitation);

    return CommandResult.success(undefined);
  }
}
