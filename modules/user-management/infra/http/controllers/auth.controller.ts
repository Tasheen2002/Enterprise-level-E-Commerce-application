import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '@/api/src/shared/interfaces/authenticated-request.interface';
import { ResponseHelper } from '@/api/src/shared/response.helper';
import { AuthenticationService } from '../../../application/services/authentication.service';
import {
  RegisterUserHandler,
  LoginUserHandler,
  LogoutHandler,
  RefreshTokenHandler,
  ChangePasswordHandler,
  ChangeEmailHandler,
  InitiatePasswordResetHandler,
  ResetPasswordHandler,
  VerifyEmailHandler,
  VerifyPhoneHandler,
  DeleteAccountHandler,
  ResendVerificationHandler,
  LoginWithGoogleHandler,
  Setup2FAHandler,
  Enable2FAHandler,
  Disable2FAHandler,
  RegenerateBackupCodesHandler,
  Verify2FALoginHandler,
} from '../../../application';
import {
  RegisterBody,
  LoginBody,
  LogoutBody,
  RefreshTokenBody,
  ChangePasswordBody,
  ForgotPasswordBody,
  ResetPasswordBody,
  VerifyEmailBody,
  VerifyPhoneBody,
  ResendVerificationBody,
  ChangeEmailBody,
  DeleteAccountBody,
  GoogleLoginBody,
  Enable2FABody,
  Disable2FABody,
  RegenerateBackupCodesBody,
  Verify2FALoginBody,
} from '../validation/auth.schema';

export class AuthController {
  constructor(
    private readonly registerHandler: RegisterUserHandler,
    private readonly loginHandler: LoginUserHandler,
    private readonly logoutHandler: LogoutHandler,
    private readonly refreshTokenHandler: RefreshTokenHandler,
    private readonly changePasswordHandler: ChangePasswordHandler,
    private readonly changeEmailHandler: ChangeEmailHandler,
    private readonly initiatePasswordResetHandler: InitiatePasswordResetHandler,
    private readonly resetPasswordHandler: ResetPasswordHandler,
    private readonly verifyEmailHandler: VerifyEmailHandler,
    private readonly deleteAccountHandler: DeleteAccountHandler,
    private readonly resendVerificationHandler: ResendVerificationHandler,
    private readonly loginWithGoogleHandler: LoginWithGoogleHandler,
    private readonly verifyPhoneHandler: VerifyPhoneHandler,
    private readonly setup2FAHandler: Setup2FAHandler,
    private readonly enable2FAHandler: Enable2FAHandler,
    private readonly disable2FAHandler: Disable2FAHandler,
    private readonly regenerateBackupCodesHandler: RegenerateBackupCodesHandler,
    private readonly verify2FALoginHandler: Verify2FALoginHandler,
    // Used by `/auth/me` to look up live identity fields (twoFactorEnabled,
    // emailVerified, phoneVerified) that go stale on the JWT after a
    // toggle. Could be re-cast as a query handler later, but the read
    // is a single call and not worth its own command type.
    private readonly authService: AuthenticationService,
  ) { }

  // --- Queries ---

  async me(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      // DB lookup (not JWT-only) so live fields like twoFactorEnabled
      // and phoneVerified reflect the current user state — the JWT is
      // signed once at login and never refreshed mid-session.
      const identity = await this.authService.getUserIdentity(
        request.user.userId,
      );
      return ResponseHelper.ok(reply, 'User retrieved', identity);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  // --- Authentication commands ---

  async register(
    request: FastifyRequest<{ Body: RegisterBody }>,
    reply: FastifyReply,
  ) {
    try {
      const userAgent = request.headers["user-agent"] as string;
      const secChUa = request.headers["sec-ch-ua"] as string;
      const finalUserAgent = (secChUa && secChUa.includes("Brave")) ? `${userAgent} Brave` : userAgent;

      const result = await this.registerHandler.handle({
        ...request.body,
        ipAddress: request.ip,
        userAgent: finalUserAgent,
      });
      return ResponseHelper.fromCommand(reply, result, 'Registration successful', 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async login(
    request: FastifyRequest<{ Body: LoginBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { email, password, rememberMe } = request.body;

      const userAgent = request.headers["user-agent"] as string;
      const secChUa = request.headers["sec-ch-ua"] as string;
      const finalUserAgent = (secChUa && secChUa.includes("Brave")) ? `${userAgent} Brave` : userAgent;

      const result = await this.loginHandler.handle({
        email,
        password,
        rememberMe,
        ipAddress: request.ip,
        userAgent: finalUserAgent,
      });

      if (result.success && result.data) {
        const outcome = result.data;
        // 2FA-on accounts get a short-lived "I owe a code" token. The
        // client redirects to a second-step page that POSTs to
        // /auth/2fa/verify with the code from the authenticator app
        // (or a backup code) to exchange it for the real session.
        if (outcome.kind === 'two_factor_required') {
          return ResponseHelper.ok(
            reply,
            'Two-factor authentication required',
            {
              kind: 'two_factor_required',
              pendingToken: outcome.pendingToken,
            },
          );
        }
        const auth = outcome.authResult;
        return ResponseHelper.ok(reply, 'Login successful', {
          kind: 'success',
          accessToken: auth.accessToken,
          // Refresh token only persisted when client opted into "remember me"
          refreshToken: rememberMe ? auth.refreshToken : undefined,
          user: auth.user,
          expiresIn: auth.expiresIn,
          tokenType: 'Bearer',
        });
      }

      return ResponseHelper.fromCommand(reply, result, 'Login failed');
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async googleLogin(
    request: FastifyRequest<{ Body: GoogleLoginBody }>,
    reply: FastifyReply,
  ) {
    try {
      const userAgent = request.headers["user-agent"] as string;
      const secChUa = request.headers["sec-ch-ua"] as string;
      const finalUserAgent = (secChUa && secChUa.includes("Brave")) ? `${userAgent} Brave` : userAgent;

      const result = await this.loginWithGoogleHandler.handle({
        idToken: request.body.idToken,
        ipAddress: request.ip,
        userAgent: finalUserAgent,
      });

      if (result.success && result.data) {
        const auth = result.data;
        return ResponseHelper.ok(reply, 'Login successful', {
          accessToken: auth.accessToken,
          // Social sign-in always returns a refresh token — there is no
          // "remember me" toggle on the popup, and users expect persistence
          // across browser sessions for OAuth-style flows.
          refreshToken: auth.refreshToken,
          user: auth.user,
          expiresIn: auth.expiresIn,
          tokenType: 'Bearer',
        });
      }

      return ResponseHelper.fromCommand(reply, result, 'Google sign-in failed');
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async logout(
    request: AuthenticatedRequest<{ Body: LogoutBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.logoutHandler.handle({
        userId: request.user.userId,
        token: this.extractBearerToken(request),
        // Optional in the schema for backwards compatibility, but clients
        // SHOULD send it — without it, the refresh token survives logout
        // and /auth/refresh will still issue new access tokens.
        refreshToken: request.body?.refreshToken,
      });

      return ResponseHelper.ok(reply, 'Logged out successfully', result.data ?? {});
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async refreshToken(
    request: FastifyRequest<{ Body: RefreshTokenBody }>,
    reply: FastifyReply,
  ) {
    try {
      const userAgent = request.headers["user-agent"] as string;
      const secChUa = request.headers["sec-ch-ua"] as string;
      const finalUserAgent = (secChUa && secChUa.includes("Brave")) ? `${userAgent} Brave` : userAgent;

      const result = await this.refreshTokenHandler.handle({
        refreshToken: request.body.refreshToken,
        currentAccessToken: this.extractBearerToken(request),
        ipAddress: request.ip,
        userAgent: finalUserAgent,
      });

      if (result.success && result.data) {
        return ResponseHelper.ok(reply, 'Token refreshed', result.data);
      }

      return ResponseHelper.fromCommand(reply, result, 'Token refresh failed');
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  // --- Password / email management commands ---

  async forgotPassword(
    request: FastifyRequest<{ Body: ForgotPasswordBody }>,
    reply: FastifyReply,
  ) {
    try {
      await this.initiatePasswordResetHandler.handle({ email: request.body.email });

      // Always return success to prevent email enumeration
      return ResponseHelper.ok(
        reply,
        'If an account with that email exists, password reset instructions have been sent.',
        { action: 'password_reset_sent' },
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async resetPassword(
    request: FastifyRequest<{ Body: ResetPasswordBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.resetPasswordHandler.handle(request.body);

      if (!result.success) {
        return ResponseHelper.fromCommand(reply, result, '');
      }

      return ResponseHelper.ok(
        reply,
        'Password has been reset successfully. Please log in with your new password.',
        { action: 'password_reset_complete' },
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async changePassword(
    request: AuthenticatedRequest<{ Body: ChangePasswordBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.changePasswordHandler.handle({
        userId: request.user.userId,
        currentPassword: request.body.currentPassword,
        newPassword: request.body.newPassword,
      });

      if (!result.success) {
        return ResponseHelper.fromCommand(reply, result, '');
      }

      return ResponseHelper.ok(reply, 'Password has been changed successfully.', {
        action: 'password_changed',
      });
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async changeEmail(
    request: AuthenticatedRequest<{ Body: ChangeEmailBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.changeEmailHandler.handle({
        userId: request.user.userId,
        newEmail: request.body.newEmail,
        password: request.body.password,
      });

      if (!result.success) {
        return ResponseHelper.fromCommand(reply, result, '');
      }

      return ResponseHelper.ok(
        reply,
        'Email has been changed successfully. Please verify your new email address.',
        { action: 'email_changed' },
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  // --- Email verification commands ---

  async verifyEmail(
    request: FastifyRequest<{ Body: VerifyEmailBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.verifyEmailHandler.handle({ token: request.body.token });

      if (result.success) {
        return ResponseHelper.ok(reply, 'Email has been verified successfully.', {
          action: 'email_verified',
        });
      }

      return ResponseHelper.fromCommand(reply, result, 'Email verification failed');
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  // --- Two-factor authentication ---

  async setup2FA(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const result = await this.setup2FAHandler.handle({
        userId: request.user.userId,
      });
      return ResponseHelper.fromCommand(reply, result, '');
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async enable2FA(
    request: AuthenticatedRequest<{ Body: Enable2FABody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.enable2FAHandler.handle({
        userId: request.user.userId,
        code: request.body.code,
      });
      return ResponseHelper.fromCommand(reply, result, '');
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async disable2FA(
    request: AuthenticatedRequest<{ Body: Disable2FABody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.disable2FAHandler.handle({
        userId: request.user.userId,
        password: request.body.password,
      });
      if (!result.success) {
        return ResponseHelper.fromCommand(reply, result, '');
      }
      return ResponseHelper.ok(
        reply,
        'Two-factor authentication has been disabled.',
        { action: '2fa_disabled' },
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async regenerateBackupCodes(
    request: AuthenticatedRequest<{ Body: RegenerateBackupCodesBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.regenerateBackupCodesHandler.handle({
        userId: request.user.userId,
        password: request.body.password,
      });
      return ResponseHelper.fromCommand(reply, result, '');
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async verify2FALogin(
    request: FastifyRequest<{ Body: Verify2FALoginBody }>,
    reply: FastifyReply,
  ) {
    try {
      const userAgent = request.headers["user-agent"] as string;
      const secChUa = request.headers["sec-ch-ua"] as string;
      const finalUserAgent = (secChUa && secChUa.includes("Brave")) ? `${userAgent} Brave` : userAgent;

      const result = await this.verify2FALoginHandler.handle({
        pendingToken: request.body.pendingToken,
        code: request.body.code,
        ipAddress: request.ip,
        userAgent: finalUserAgent,
      });
      if (!result.success || !result.data) {
        return ResponseHelper.fromCommand(reply, result, '');
      }
      const auth = result.data;
      return ResponseHelper.ok(reply, 'Login successful', {
        kind: 'success',
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        user: auth.user,
        expiresIn: auth.expiresIn,
        tokenType: 'Bearer',
      });
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async verifyPhone(
    request: AuthenticatedRequest<{ Body: VerifyPhoneBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.verifyPhoneHandler.handle({
        userId: request.user.userId,
        idToken: request.body.idToken,
      });

      if (!result.success) {
        return ResponseHelper.fromCommand(reply, result, 'Phone verification failed');
      }

      return ResponseHelper.ok(
        reply,
        'Phone number has been verified successfully.',
        { action: 'phone_verified', phoneNumber: result.data?.phoneNumber },
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async resendVerification(
    request: FastifyRequest<{ Body: ResendVerificationBody }>,
    reply: FastifyReply,
  ) {
    try {
      // Silently swallow handler errors to prevent email enumeration —
      // response is identical whether the email exists or not.
      try {
        await this.resendVerificationHandler.handle({ email: request.body.email });
      } catch {
        // Intentional no-op — see comment above
      }

      return ResponseHelper.ok(
        reply,
        'If an account with that email exists and is unverified, a verification email has been sent.',
        { action: 'verification_sent' },
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  // --- Account lifecycle commands ---

  async deleteAccount(
    request: AuthenticatedRequest<{ Body: DeleteAccountBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.deleteAccountHandler.handle({
        userId: request.user.userId,
        password: request.body.password,
        currentAccessToken: this.extractBearerToken(request),
      });

      if (result.success) {
        return ResponseHelper.ok(reply, 'Account has been deleted successfully.');
      }

      return ResponseHelper.fromCommand(reply, result, '');
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  // --- Private helpers ---

  private extractBearerToken(
    request: FastifyRequest | AuthenticatedRequest,
  ): string | undefined {
    return request.headers.authorization?.match(/^Bearer\s+(.+)$/)?.[1];
  }
}
