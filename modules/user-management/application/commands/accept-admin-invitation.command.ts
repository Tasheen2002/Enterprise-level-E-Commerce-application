import crypto from 'crypto';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';
import { IAdminInvitationRepository } from '../../domain/repositories/iadmin-invitation.repository';
import { IUserRepository } from '../../domain/repositories/iuser.repository';
import { AuthenticationService, AuthResult } from '../services/authentication.service';
import { Email } from '../../domain/value-objects/email.vo';
import { ITokenBlacklistService } from '../services/itoken-blacklist.service';
import { IEmailService } from '../services/iemail.service';

export interface AcceptAdminInvitationCommand extends ICommand {
  readonly token: string;
  readonly password: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

export class AcceptAdminInvitationHandler implements ICommandHandler<
  AcceptAdminInvitationCommand,
  CommandResult<AuthResult>
> {
  constructor(
    private readonly invitationRepository: IAdminInvitationRepository,
    private readonly userRepository: IUserRepository,
    private readonly authService: AuthenticationService,
    private readonly tokenBlacklistService: ITokenBlacklistService,
    private readonly emailService: IEmailService,
  ) {}

  async handle(command: AcceptAdminInvitationCommand): Promise<CommandResult<AuthResult>> {
    // 1. Hash the incoming token and look up the invitation
    const token = command.token.trim();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const invitation = await this.invitationRepository.findByTokenHash(tokenHash);

    if (!invitation) {
      return CommandResult.failure(
        'Invalid or expired invitation token',
        undefined,
        400,
      );
    }

    if (!invitation.isValid()) {
      return CommandResult.failure(
        'This invitation has expired or has already been used',
        undefined,
        410,
      );
    }

    // 2. Check if the user already exists
    const emailVo = Email.create(invitation.email.getValue());
    const existingUser = await this.userRepository.findByEmail(emailVo);
    if (existingUser && !existingUser.isGuest) {
      return CommandResult.failure(
        'An account with this email already exists. Please sign in instead.',
        undefined,
        409,
      );
    }

    // 3. Register the new admin user with the role from the invitation
    const authResult = await this.authService.register({
      email: invitation.email.getValue(),
      password: command.password,
      firstName: command.firstName,
      lastName: command.lastName,
      role: invitation.role,
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
    });

    // 4. Mark the invitation as accepted
    invitation.accept(authResult.user.id);
    await this.invitationRepository.save(invitation);

    // 5. Auto-verify the email (trusted — admin invited them)
    // We use the existing resendEmailVerification + verifyEmail path,
    // but since we trust the invitation, we just mark verified directly.
    await this.authService.verifyEmail(authResult.user.id).catch(() => {
      // If already verified or any issue, swallow — not critical
    });

    // 6. Send welcome email (fire-and-forget)
    this.emailService.sendVerificationEmail(
      invitation.email.getValue(),
      'WELCOME_ADMIN', // Special token value — the email adapter can distinguish
    ).catch(() => {
      // Non-critical
    });

    return CommandResult.success(authResult);
  }
}
