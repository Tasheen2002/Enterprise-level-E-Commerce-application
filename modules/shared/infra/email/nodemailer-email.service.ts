import nodemailer from "nodemailer";
import {
  IEmailService,
  SendEmailOptions,
} from "../../domain/ports/email.service.port";

export class NodemailerEmailService implements IEmailService {
  private transporter: nodemailer.Transporter;
  private defaultFrom: string;

  constructor() {
    this.defaultFrom = process.env.SMTP_FROM || '"Modett" <noreply@modett.com>';

    // Initialize transporter with environment variables
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log(
        "[EMAIL SERVICE] Connection to SMTP server established successfully."
      );
      return true;
    } catch (error) {
      console.error("[EMAIL SERVICE] Failed to connect to SMTP server:", error);
      return false;
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn(
          "[EMAIL SERVICE] Skipping email send: SMTP credentials not provided."
        );
        return;
      }

      await this.transporter.sendMail({
        from: options.from || this.defaultFrom,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      console.log(`[EMAIL SERVICE] Email sent to ${options.to}`);
    } catch (error) {
      console.error(
        `[EMAIL SERVICE] Failed to send email to ${options.to}:`,
        error
      );
      // We don't throw here to avoid failing the main request flow (e.g. registration)
      // just because an operational email failed.
    }
  }

  async sendWelcomeEmail(to: string, userName?: string): Promise<void> {
    const subject = "Welcome to Modern Muse!";
    const html = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background-color: #3E5460; padding: 20px; text-align: center;">
             <h1 style="color: #ffffff; margin: 0; font-family: 'Playfair Display', serif;">MODETT</h1>
        </div>
        <div style="padding: 40px 20px; color: #333333;">
            <h2 style="font-family: 'Playfair Display', serif; color: #3E5460;">Welcome to our Community, ${userName || "Muse"}!</h2>
            <p style="line-height: 1.6; color: #555555;">
                Thank you for subscribing to the Modern Muse newsletter. We are thrilled to have you with us.
            </p>
            <p style="line-height: 1.6; color: #555555;">
                You'll now be the first to know about:
            </p>
            <ul style="color: #555555; line-height: 1.6;">
                <li>Exclusive new collection drops</li>
                <li>Behind-the-scenes content</li>
                <li>Special member-only offers</li>
            </ul>
            <div style="text-align: center; margin-top: 40px;">
                <a href="https://modett.com/collections/new-arrivals" style="display: inline-block; background-color: #3E5460; color: #ffffff; padding: 12px 30px; text-decoration: none; font-weight: bold; letter-spacing: 1px;">DISCOVER NEW ARRIVALS</a>
            </div>
        </div>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #888888;">
            <p>&copy; ${new Date().getFullYear()} Modett Fashion. All rights reserved.</p>
            <p>If you have any questions, feel free to reply to this email.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #888; text-align: center;">
          You received this email because you subscribed to the Modett newsletter.
          <br>
          <a href="${process.env.API_URL || "http://localhost:3001"}/api/v1/engagement/newsletter/unsubscribe?email=${to}" style="color: #888; text-decoration: underline;">Unsubscribe</a>
        </p>
      </div>
      </div>
    `;

    await this.sendEmail({
      to,
      subject,
      html,
      text: "Welcome to Modern Muse! Thank you for subscribing.",
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    // Placeholder for now
    const subject = "Reset Your Password";
    const resetLink = `https://modett.com/reset-password?token=${token}`;
    const text = `Click here to reset your password: ${resetLink}`;
    await this.sendEmail({ to, subject, text });
  }
}
