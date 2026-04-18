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
} from '../../../application';
import {
  RegisterBody,
  LoginBody,
  RefreshTokenBody,
  ChangePasswordBody,
  ForgotPasswordBody,
  ResetPasswordBody,
  VerifyEmailBody,
  ResendVerificationBody,
  ChangeEmailBody,
  DeleteAccountBody,
} from '../validation/auth.schema';
import { UserRole } from '../../../domain/enums/user-role.enum';

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
  ) {}

  async register(
    request: FastifyRequest<{ Body: RegisterBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { email, password, phone, firstName, lastName, role } = request.body;

      const result = await this.registerHandler.handle({
        email,
        password,
        phone,
        firstName,
        lastName,
        role: role as UserRole | undefined,
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

      const result = await this.loginHandler.handle({ email, password, rememberMe });

      if (result.success && result.data) {
        const auth = result.data;
        return ResponseHelper.ok(reply, 'Login successful', {
          accessToken: auth.accessToken,
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

  async logout(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const authHeader = request.headers.authorization;
      const token = authHeader?.match(/^Bearer\s+(.+)$/)?.[1];

      const result = await this.logoutHandler.handle({
        userId: request.user.userId,
        token,
      });

      return ResponseHelper.ok(reply, 'Logged out successfully', result.data || {});
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async refreshToken(
    request: FastifyRequest<{ Body: RefreshTokenBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { refreshToken } = request.body;
      const currentAccessToken = request.headers.authorization?.match(/^Bearer\s+(.+)$/)?.[1];

      const result = await this.refreshTokenHandler.handle({
        refreshToken,
        currentAccessToken,
      });

      if (result.success && result.data) {
        return ResponseHelper.ok(reply, 'Token refreshed', result.data);
      }

      return ResponseHelper.fromCommand(reply, result, 'Token refresh failed');
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async forgotPassword(
    request: FastifyRequest<{ Body: ForgotPasswordBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { email } = request.body;

      await this.initiatePasswordResetHandler.handle({ email });

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

  async initiatePasswordReset(
    request: FastifyRequest<{ Body: ForgotPasswordBody }>,
    reply: FastifyReply,
  ) {
    return this.forgotPassword(request, reply);
  }

  async resetPassword(
    request: FastifyRequest<{ Body: ResetPasswordBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { token, newPassword } = request.body;

      const result = await this.resetPasswordHandler.handle({ token, newPassword });

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

  async verifyEmail(
    request: FastifyRequest<{ Body: VerifyEmailBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { token } = request.body;

      const result = await this.verifyEmailHandler.handle({ token });

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
      const { email } = request.body;

      // Silently handle all cases to prevent email enumeration
      try {
        await this.resendVerificationHandler.handle({ email });
      } catch {
        // Do not reveal whether the email exists or any other error
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

  async changePassword(
    request: AuthenticatedRequest<{ Body: ChangePasswordBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { currentPassword, newPassword } = request.body;

      const result = await this.changePasswordHandler.handle({
        userId: request.user.userId,
        currentPassword,
        newPassword,
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
      const { newEmail, password } = request.body;

      const result = await this.changeEmailHandler.handle({
        userId: request.user.userId,
        newEmail,
        password,
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

  async deleteAccount(
    request: AuthenticatedRequest<{ Body: DeleteAccountBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { password } = request.body;
      const currentAccessToken = request.headers.authorization?.match(/^Bearer\s+(.+)$/)?.[1];

      const result = await this.deleteAccountHandler.handle({
        userId: request.user.userId,
        password,
        currentAccessToken,
      });

      if (result.success) {
        return ResponseHelper.ok(reply, 'Account has been deleted successfully.');
      }

      return ResponseHelper.fromCommand(reply, result, '');
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async me(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      return ResponseHelper.ok(reply, 'User retrieved', {
        userId: request.user.userId,
        email: request.user.email,
        role: request.user.role,
      });
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
