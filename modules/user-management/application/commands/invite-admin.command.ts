import crypto from 'crypto';
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';
import { IAdminInvitationRepository } from '../../domain/repositories/iadmin-invitation.repository';
import { IUserRepository } from '../../domain/repositories/iuser.repository';
import { AdminInvitation, AdminInvitationDTO } from '../../domain/entities/admin-invitation.entity';
import { UserRole } from '../../domain/value-objects/user-role.vo';
import { Email } from '../../domain/value-objects/email.vo';
import { IEmailService } from '../services/iemail.service';

export interface InviteAdminCommand extends ICommand {
  readonly email: string;
  readonly role: UserRole;
  /** The userId of the admin creating this invitation. */
  readonly invitedById: string;
}

export interface InviteAdminResult {
  invitation: AdminInvitationDTO;
  /** Plaintext token — included so the controller can build the invitation URL
   *  or (in dev) return it for testing. NEVER persisted in this form. */
  plainToken: string;
}

export class InviteAdminHandler implements ICommandHandler<
  InviteAdminCommand,
  CommandResult<InviteAdminResult>
> {
  constructor(
    private readonly invitationRepository: IAdminInvitationRepository,
    private readonly userRepository: IUserRepository,
    private readonly emailService: IEmailService,
  ) {}

  async handle(command: InviteAdminCommand): Promise<CommandResult<InviteAdminResult>> {
    // 1. Check if the email already belongs to an active user
    const emailVo = Email.create(command.email);
    const existingUser = await this.userRepository.findByEmail(emailVo);
    if (existingUser && !existingUser.isGuest) {
      return CommandResult.failure(
        `A user with email '${command.email}' already exists`,
        undefined,
        409,
      );
    }

    // 2. Check for existing pending invitations for this email
    const existingInvitations = await this.invitationRepository.findByEmail(command.email);
    const pendingInvitation = existingInvitations.find(inv => inv.isValid());
    if (pendingInvitation) {
      return CommandResult.failure(
        `A pending invitation already exists for '${command.email}'`,
        undefined,
        409,
      );
    }

    // 3. Generate a secure random token and hash it
    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');

    // 4. Create the invitation aggregate
    const invitation = AdminInvitation.create({
      email: command.email,
      role: command.role,
      tokenHash,
      invitedById: command.invitedById,
    });

    await this.invitationRepository.save(invitation);

    // 5. Send the invitation email (fire-and-forget in dev)
    const inviteUrl = `${process.env.ADMIN_APP_URL || 'http://localhost:3002'}/setup-account?token=${plainToken}`;
    this.emailService.sendInvitationEmail?.(command.email, inviteUrl, UserRole.getDisplayName(command.role))
      .catch(err => {
        console.error('[InviteAdminHandler] Failed to send invitation email:', err);
      });

    return CommandResult.success({
      invitation: AdminInvitation.toDTO(invitation),
      plainToken,
    });
  }
}
