/**
 * Port for time-based one-time password generation/verification. Lives
 * in the application layer so the domain stays free of `speakeasy` /
 * clock dependencies. The infrastructure adapter is wired in the DI
 * container.
 */
export interface ITotpService {
  /**
   * Issue a fresh secret + a pre-formatted `otpauth://` URL that
   * authenticator apps consume directly (used to build the QR code).
   */
  generateSecret(params: {
    /** Account label shown in the authenticator app, e.g. an email. */
    accountName: string;
    /** Issuer label, e.g. "Slipperze". */
    issuer: string;
  }): Promise<{ secret: string; otpAuthUrl: string }>;

  /** Render an `otpauth://` URL as a base64 data-URL PNG. */
  toQrCodeDataUrl(otpAuthUrl: string): Promise<string>;

  /**
   * Verify a 6-digit code against the user's stored secret. Returns
   * `true` if the code matches the current 30-second window (or the
   * one immediately before — adapters may allow a small drift to
   * tolerate clock skew between server and authenticator app).
   */
  verifyCode(params: { secret: string; code: string }): boolean;
}
