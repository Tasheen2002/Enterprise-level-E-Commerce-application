import nodemailer from "nodemailer";
import { IEmailService, SendEmailOptions } from "../../application/services/iemail.service";

export class NodemailerEmailService implements IEmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development";
  }

  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    if (this.isDevelopment) {
      // Ethereal account for development
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[EmailService] Ethereal account created: ${testAccount.user}`);
    } else {
      // Real SMTP for production (placeholders for now, should come from config)
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    return this.transporter;
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    const transporter = await this.getTransporter();

    try {
      const info = await transporter.sendMail({
        from: `"Slipperze Boutique" <${process.env.SMTP_FROM || "concierge@slipperze.com"}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      if (this.isDevelopment) {
        console.log(`[EmailService] Email sent: ${info.messageId}`);
        console.log(`[EmailService] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }

    } catch (err: any) {
      if (this.isDevelopment) {
        console.warn(`[EmailService] SMTP delivery failed but link was logged. (Reason: ${err.message})`);
      } else {
        throw err;
      }
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;
    
    await this.sendEmail({
      to: email,
      subject: "Commission your member security key",
      text: `A request to reset your Slipperze security key has been initiated. Please use this link: ${resetUrl}`,
      html: `
        <h1 style="font-family: serif; font-style: italic;">Heritage Portfolio Security</h1>
        <p>A request to reset your Slipperze artisanal security key has been initiated.</p>
        <p>Follow the link below to commission a new key:</p>
        <a href="${resetUrl}" style="color: #c5a059; text-decoration: none; font-weight: bold; letter-spacing: 0.1em;">RESET SECURITY KEY</a>
        <p style="font-size: 10px; color: #999;">If you did not initiate this request, your portfolio remains secure and no action is required.</p>
      `,
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${token}`;
    
    if (this.isDevelopment) {
      console.log("----------------------------------------------------------------");
      console.log(`[EmailService] VERIFICATION LINK GENERATED:`);
      console.log(`${verifyUrl}`);
      console.log("----------------------------------------------------------------");
    }

    await this.sendEmail({
      to: email,
      subject: "Verify your artisanal credentials",
      text: `Welcome to the Slipperze community! Please verify your identity using this link: ${verifyUrl}`,
      html: `
        <h1 style="font-family: serif; font-style: italic;">Welcome to Slipperze</h1>
        <p>To finalize your member portfolio and gain full boutique access, please verify your credentials:</p>
        <a href="${verifyUrl}" style="color: #c5a059; text-decoration: none; font-weight: bold; letter-spacing: 0.1em;">CONFIRM IDENTITY</a>
        <p style="font-size: 10px; color: #999; margin-top: 20px;">Artisanal Excellence since 2024</p>
      `,
    });
  }
}
