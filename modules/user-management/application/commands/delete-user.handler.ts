import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { IUserRepository } from "../../domain/repositories/iuser.repository";
import { UserId } from "../../domain/value-objects/user-id.vo";
import { DeleteUserCommand, DeleteUserResult } from "./delete-user.command";

export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand, CommandResult<DeleteUserResult>> {
  constructor(private readonly userRepository: IUserRepository) {}

  async handle(command: DeleteUserCommand): Promise<CommandResult<DeleteUserResult>> {
    try {
      const userId = UserId.fromString(command.userId);
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return CommandResult.failure<DeleteUserResult>("User not found");
      }
      await this.userRepository.delete(userId);
      return CommandResult.success<DeleteUserResult>({ userId: userId.getValue() });
    } catch (error) {
      return CommandResult.failure<DeleteUserResult>(
        error instanceof Error ? error.message : "Failed to delete user",
      );
    }
  }
}
