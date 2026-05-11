import {
  AuthenticationService,
  AuthResult,
} from "../services/authentication.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { UserRole } from "../../domain/value-objects/user-role.vo";
import { ITokenBlacklistService } from "../services/itoken-blacklist.service";
import { IEmailService } from "../services/iemail.service";

export interface RegisterUserCommand extends ICommand {
  readonly email: string;
  readonly password: string;
  readonly phone?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly role?: UserRole;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

export class RegisterUserHandler implements ICommandHandler<
  RegisterUserCommand,
  CommandResult<AuthResult>
> {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly tokenBlacklistService: ITokenBlacklistService,
    private readonly emailService: IEmailService,
  ) { }

  async handle(command: RegisterUserCommand): Promise<CommandResult<AuthResult>> {
    const authResult = await this.authService.register({
      email: command.email,
      password: command.password,
      phone: command.phone,
      firstName: command.firstName,
      lastName: command.lastName,
      role: command.role,
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
    });

    // Trigger verification email automatically on registration
    // We don't await this to avoid blocking the registration response 
    // due to external email service latency (especially in dev with Ethereal)
    this.authService.resendEmailVerification(command.email).then(async (result) => {
      if (!result.alreadyVerified) {
        this.tokenBlacklistService.storeVerificationToken(
          result.verificationToken,
          result.userId,
          command.email,
        );
        await this.emailService.sendVerificationEmail(command.email, result.verificationToken);
      }
    }).catch(err => {
      console.error("[RegisterUserHandler] Background verification email failed:", err);
    });

    return CommandResult.success(authResult);
  }
}
