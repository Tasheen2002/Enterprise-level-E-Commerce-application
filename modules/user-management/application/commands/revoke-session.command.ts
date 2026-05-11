import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ISessionRepository } from "../../domain/repositories/isession.repository";
import { UserId } from "../../domain/value-objects/user-id.vo";

export interface RevokeSessionCommand extends ICommand {
  userId: string;
  sessionId: string;
}

export class RevokeSessionHandler implements ICommandHandler<RevokeSessionCommand, CommandResult<void>> {
  constructor(private readonly sessionRepository: ISessionRepository) {}

  async handle(command: RevokeSessionCommand): Promise<CommandResult<void>> {
    const userIdVo = UserId.fromString(command.userId);
    
    // Validate the session belongs to the user
    const sessions = await this.sessionRepository.findByUserId(userIdVo);
    const session = sessions.find(s => s.id === command.sessionId);
    
    if (!session) {
      return CommandResult.failure("Session not found or already revoked", undefined, 404);
    }

    await this.sessionRepository.revoke(command.sessionId);
    // Ideally, we would add the token to the TokenBlacklistService if we had access to the raw token,
    // but the JWT layer will check the DB on refresh anyway because it's stateful now.
    
    return CommandResult.success();
  }
}
