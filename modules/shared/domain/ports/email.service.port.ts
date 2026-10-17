export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface IEmailService {
  sendEmail(options: SendEmailOptions): Promise<void>;
  sendPasswordResetEmail(to: string, token: string): Promise<void>;
  sendVerificationEmail(to: string, token: string): Promise<void>;
  sendInvitationEmail?(email: string, inviteUrl: string, roleName: string): Promise<void>;
}
