export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

export interface IEmailService {
  sendEmail(options: SendEmailOptions): Promise<void>;
  sendWelcomeEmail(to: string, userName?: string): Promise<void>;
  sendPasswordResetEmail(to: string, token: string): Promise<void>;
  verifyConnection(): Promise<boolean>;
}
