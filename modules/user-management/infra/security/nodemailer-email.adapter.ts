import nodemailer from "nodemailer";
import type {
  IEmailService,
  SendEmailOptions,
} from "../../../shared/domain/ports/email.service.port";

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (character) => entities[character]!);
}

function httpUrl(value: string): URL {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
      throw new Error("Invalid email URL");
    }
    return url;
  } catch {
    // Rejected values can contain tokens; do not attach them to errors.
    throw new Error("Email links must use a valid HTTP(S) URL without credentials");
  }
}

function appLink(base: string, path: string): string {
  return new URL(path, httpUrl(base.split(",")[0]!.trim()).origin).href;
}

export class NodemailerEmailService implements IEmailService {
  private transporterPromise: Promise<nodemailer.Transporter> | null = null;
  private readonly isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development";
  }

  private getTransporter(): Promise<nodemailer.Transporter> {
    if (!this.transporterPromise) {
      this.transporterPromise = this.createTransporter().catch((error: unknown) => {
        this.transporterPromise = null;
        throw error;
      });
    }
    return this.transporterPromise;
  }

  private async createTransporter(): Promise<nodemailer.Transporter> {
    if (this.isDevelopment) {
      // Ethereal account for development
      const testAccount = await nodemailer.createTestAccount();
      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } else {
      const host = process.env.SMTP_HOST?.trim();
      if (!host) throw new Error("SMTP host is not configured");
      return nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    const transporter = await this.getTransporter();

    const info = await transporter.sendMail({
      from: `"Slipperze Boutique" <${process.env.SMTP_FROM || "concierge@slipperze.com"}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    if (info.rejected?.length) {
      // Do not resend automatically: accepted recipients may already have the message.
      throw new Error("Email submission was rejected for one or more recipients");
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${appLink(process.env.FRONTEND_URL || "http://localhost:3000", "/reset-password")}?token=${encodeURIComponent(token)}`;

    await this.sendEmail({
      to: email,
      subject: "Commission your member security key",
      text: `A request to reset your Slipperze security key has been initiated. Please use this link: ${resetUrl}`,
      html: `
        <h1 style="font-family: serif; font-style: italic;">Heritage Portfolio Security</h1>
        <p>A request to reset your Slipperze artisanal security key has been initiated.</p>
        <p>Follow the link below to commission a new key:</p>
        <a href="${escapeHtml(resetUrl)}" style="color: #c5a059; text-decoration: none; font-weight: bold; letter-spacing: 0.1em;">RESET SECURITY KEY</a>
        <p style="font-size: 10px; color: #999;">If you did not initiate this request, your portfolio remains secure and no action is required.</p>
      `,
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    // Special case for admin invitation acceptance — we don't need a tokenised link
    // since the account is already verified.
    if (token === "WELCOME_ADMIN") {
      const loginUrl = appLink(process.env.ADMIN_APP_URL || "http://localhost:3002", "/login");
      await this.sendEmail({
        to: email,
        subject: "Welcome to the Atelier — Credentials Verified",
        text: `Your administrative access to the Slipperze Atelier has been activated.`,
        html: `
          <h1 style="font-family: serif; font-style: italic;">Welcome to the Atelier</h1>
          <p>Your administrative credentials have been successfully commissioned and verified.</p>
          <p>You may now access the administrative control suite:</p>
          <a href="${escapeHtml(loginUrl)}" style="color: #c5a059; text-decoration: none; font-weight: bold; letter-spacing: 0.1em;">ENTER ATELIER</a>
        `,
      });
      return;
    }

    const verifyUrl = `${appLink(process.env.FRONTEND_URL || "http://localhost:3000", "/verify-email")}?token=${encodeURIComponent(token)}`;

    await this.sendEmail({
      to: email,
      subject: "Verify your artisanal credentials",
      text: `Welcome to the Slipperze community! Please verify your identity using this link: ${verifyUrl}`,
      html: `
        <h1 style="font-family: serif; font-style: italic;">Welcome to Slipperze</h1>
        <p>To finalize your member portfolio and gain full boutique access, please verify your credentials:</p>
        <a href="${escapeHtml(verifyUrl)}" style="color: #c5a059; text-decoration: none; font-weight: bold; letter-spacing: 0.1em;">CONFIRM IDENTITY</a>
        <p style="font-size: 10px; color: #999; margin-top: 20px;">Artisanal Excellence since 2024</p>
      `,
    });
  }

  async sendInvitationEmail(email: string, inviteUrl: string, roleName: string): Promise<void> {
    const invitationUrl = httpUrl(inviteUrl).href;

    await this.sendEmail({
      to: email,
      subject: `Invitation: Join the Slipperze Atelier as ${roleName}`,
      text: `You have been invited to join the Slipperze Atelier team. Set up your account here: ${invitationUrl}`,
      html: `
        <h1 style="font-family: serif; font-style: italic;">Atelier Invitation</h1>
        <p>You have been personally invited to join the Slipperze administrative team as <strong>${escapeHtml(roleName)}</strong>.</p>
        <p>Please follow the link below to commission your secure credentials and activate your access:</p>
        <a href="${escapeHtml(invitationUrl)}" style="color: #c5a059; text-decoration: none; font-weight: bold; letter-spacing: 0.1em;">ACTIVATE ACCESS</a>
        <p style="font-size: 10px; color: #999; margin-top: 20px;">This invitation expires in 72 hours.</p>
      `,
    });
  }
}
