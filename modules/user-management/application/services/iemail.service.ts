/**
 * Interface for email sending.
 * Application-layer port — implemented by infra-layer EmailService.
 */
export interface IEmailService {
  sendEmail(options: SendEmailOptions): Promise<void>;
  sendPasswordResetEmail(email: string, token: string): Promise<void>;
  sendVerificationEmail(email: string, token: string): Promise<void>;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}
