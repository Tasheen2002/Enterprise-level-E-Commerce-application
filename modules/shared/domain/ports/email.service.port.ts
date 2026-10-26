export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/** Resolves after transport submission; rejects failures. This does not prove inbox delivery. */
export interface IEmailSender {
  sendEmail(options: SendEmailOptions): Promise<void>;
}

export interface IEmailService extends IEmailSender {
  sendPasswordResetEmail(to: string, token: string): Promise<void>;
  sendVerificationEmail(to: string, token: string): Promise<void>;
  sendInvitationEmail?(email: string, inviteUrl: string, roleName: string): Promise<void>;
}
