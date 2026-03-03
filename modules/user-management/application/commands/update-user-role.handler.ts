import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { IUserRepository } from "../../domain/repositories/iuser.repository";
import { UserId } from "../../domain/value-objects/user-id.vo";
import { UpdateUserRoleCommand, UpdateUserRoleResult } from "./update-user-role.command";

export class UpdateUserRoleHandler implements ICommandHandler<UpdateUserRoleCommand, CommandResult<UpdateUserRoleResult>> {
  constructor(private readonly userRepository: IUserRepository) {}

  async handle(command: UpdateUserRoleCommand): Promise<CommandResult<UpdateUserRoleResult>> {
    try {
      const userId = UserId.fromString(command.userId);
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return CommandResult.failure<UpdateUserRoleResult>("User not found");
      }
      user.updateRole(command.role);
      await this.userRepository.update(user);
      return CommandResult.success<UpdateUserRoleResult>({
        userId: user.getId().getValue(),
        newRole: user.getRole(),
      });
    } catch (error) {
      return CommandResult.failure<UpdateUserRoleResult>(
        error instanceof Error ? error.message : "Failed to update user role",
      );
    }
  }
}
