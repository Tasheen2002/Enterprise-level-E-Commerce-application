import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '@/api/src/shared/interfaces/authenticated-request.interface';
import { ResponseHelper } from '@/api/src/shared/response.helper';
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
  DeleteAccountHandler,
  ResendVerificationHandler,
  LoginWithGoogleHandler,
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
  ResendVerificationBody,
  ChangeEmailBody,
  DeleteAccountBody,
  GoogleLoginBody,
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
  ) { }

  // --- Queries ---

  async me(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      return ResponseHelper.ok(reply, 'User retrieved', {
        userId: request.user.userId,
        email: request.user.email,
        role: request.user.role,
        updatedAt: request.user.updatedAt,
        createdAt: request.user.createdAt,
      });
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
      const result = await this.registerHandler.handle(request.body);
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

      // Lockout key is composite (email + IP) — see LoginUserCommand.
      const result = await this.loginHandler.handle({
        email,
        password,
        rememberMe,
        ipAddress: request.ip,
      });

      if (result.success && result.data) {
        const auth = result.data;
        return ResponseHelper.ok(reply, 'Login successful', {
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
      const result = await this.loginWithGoogleHandler.handle({
        idToken: request.body.idToken,
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
      const result = await this.refreshTokenHandler.handle({
        refreshToken: request.body.refreshToken,
        currentAccessToken: this.extractBearerToken(request),
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
