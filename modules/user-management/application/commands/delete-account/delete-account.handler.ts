import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import {
  DeleteAccountCommand,
  DeleteAccountResult,
} from "./delete-account.command";
import { AuthenticationService } from "../../services/authentication.service";
import { IUserRepository } from "../../../domain/repositories/iuser.repository";
import { ITokenBlacklistService } from "../../services/itoken-blacklist.service";
import { UserId } from "../../../domain/value-objects/user-id.vo";

export class DeleteAccountHandler implements ICommandHandler<
  DeleteAccountCommand,
  CommandResult<DeleteAccountResult>
> {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly userRepository: IUserRepository,
    private readonly tokenBlacklistService: ITokenBlacklistService,
  ) {}

  async handle(
    command: DeleteAccountCommand,
  ): Promise<CommandResult<DeleteAccountResult>> {
    try {
      // Step 1: Verify password
      await this.authService.verifyUserPassword(
        command.userId,
        command.password,
      );

      // Step 2: Delete the user
      const userId = UserId.fromString(command.userId);
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return CommandResult.failure<DeleteAccountResult>("User not found");
      }
      await this.userRepository.delete(userId);

      // Step 3: Blacklist current access token
      if (command.currentAccessToken) {
        this.tokenBlacklistService.blacklistToken(command.currentAccessToken);
      }

      return CommandResult.success<DeleteAccountResult>({
        deleted: true,
        message: "Account has been deleted successfully",
      });
    } catch (error) {
      return CommandResult.failure<DeleteAccountResult>(
        error instanceof Error ? error.message : "Failed to delete account",
      );
    }
  }
}
