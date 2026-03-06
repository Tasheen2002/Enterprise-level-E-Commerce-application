import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { IUserRepository } from "../../../domain/repositories/iuser.repository";
import { UserId } from "../../../domain/value-objects/user-id.vo";
import { UserStatus } from "../../../domain/entities/user.entity";
import { UpdateUserStatusCommand, UpdateUserStatusResult } from "./update-user-status.command";

export class UpdateUserStatusHandler implements ICommandHandler<UpdateUserStatusCommand, CommandResult<UpdateUserStatusResult>> {
  constructor(private readonly userRepository: IUserRepository) {}

  async handle(command: UpdateUserStatusCommand): Promise<CommandResult<UpdateUserStatusResult>> {
    try {
      const userId = UserId.fromString(command.userId);
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return CommandResult.failure<UpdateUserStatusResult>("User not found");
      }
      switch (command.status) {
        case UserStatus.ACTIVE: user.activate(); break;
        case UserStatus.INACTIVE: user.deactivate(); break;
        case UserStatus.BLOCKED: user.block(); break;
      }
      await this.userRepository.update(user);
      return CommandResult.success<UpdateUserStatusResult>({
        userId: user.getId().getValue(),
        newStatus: user.getStatus(),
      });
    } catch (error) {
      return CommandResult.failure<UpdateUserStatusResult>(
        error instanceof Error ? error.message : "Failed to update user status",
      );
    }
  }
}
