import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { IUserRepository } from "../../../domain/repositories/iuser.repository";
import { UserId } from "../../../domain/value-objects/user-id.vo";
import { ToggleUserEmailVerifiedCommand, ToggleUserEmailVerifiedResult } from "./toggle-user-email-verified.command";

export class ToggleUserEmailVerifiedHandler implements ICommandHandler<ToggleUserEmailVerifiedCommand, CommandResult<ToggleUserEmailVerifiedResult>> {
  constructor(private readonly userRepository: IUserRepository) {}

  async handle(command: ToggleUserEmailVerifiedCommand): Promise<CommandResult<ToggleUserEmailVerifiedResult>> {
    try {
      const userId = UserId.fromString(command.userId);
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return CommandResult.failure<ToggleUserEmailVerifiedResult>("User not found");
      }
      user.setEmailVerified(command.isVerified);
      await this.userRepository.update(user);
      return CommandResult.success<ToggleUserEmailVerifiedResult>({
        userId: user.getId().getValue(),
        isVerified: user.isEmailVerified(),
      });
    } catch (error) {
      return CommandResult.failure<ToggleUserEmailVerifiedResult>(
        error instanceof Error ? error.message : "Failed to toggle email verification",
      );
    }
  }
}
