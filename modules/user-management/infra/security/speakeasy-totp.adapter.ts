import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { ITotpService } from "../../application/services/itotp.service";

export class SpeakeasyTotpService implements ITotpService {
  async generateSecret(params: {
    accountName: string;
    issuer: string;
  }): Promise<{ secret: string; otpAuthUrl: string }> {
    // `speakeasy.generateSecret` builds a 32-char base32 secret and an
    // `otpauth://` URL with the issuer/account label baked in — that
    // URL is what the authenticator app reads from the QR code.
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `${params.issuer}:${params.accountName}`,
      issuer: params.issuer,
    });

    if (!secret.base32 || !secret.otpauth_url) {
      throw new Error("Failed to generate TOTP secret");
    }

    return {
      secret: secret.base32,
      otpAuthUrl: secret.otpauth_url,
    };
  }

  async toQrCodeDataUrl(otpAuthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpAuthUrl, {
      // Authenticator apps cope fine with the default size, but bump
      // error-correction to M so a slightly blurry phone-camera scan
      // still works.
      errorCorrectionLevel: "M",
      margin: 1,
      width: 256,
    });
  }

  verifyCode(params: { secret: string; code: string }): boolean {
    // `window: 1` accepts the previous and next 30-second window in
    // addition to the current one — covers clock skew between the
    // server and the user's phone (typical drift is under a few
    // seconds, but cellphones aren't NTP-synced). 1 step is the
    // RFC 6238 recommendation.
    return speakeasy.totp.verify({
      secret: params.secret,
      encoding: "base32",
      token: params.code,
      window: 1,
    });
  }
}
