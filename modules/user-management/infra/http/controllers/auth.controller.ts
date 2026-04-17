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
  GetUserByEmailHandler,
} from '../../../application';
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
    private readonly getUserByEmailHandler: GetUserByEmailHandler,
    private readonly deleteAccountHandler: DeleteAccountHandler,
  ) {}

  async register(
    request: FastifyRequest<{
      Body: {
        email: string;
        password: string;
        confirmPassword: string;
        phone?: string;
        firstName?: string;
        lastName?: string;
        acceptTerms: boolean;
        role?: UserRole;
      };
    }>,
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
        role,
      });

      return ResponseHelper.fromCommand(reply, result, 'Registration successful', 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async login(
    request: FastifyRequest<{
      Body: {
        email: string;
        password: string;
        rememberMe?: boolean;
      };
    }>,
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
    request: FastifyRequest<{ Body: { refreshToken: string } }>,
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
    request: FastifyRequest<{ Body: { email: string } }>,
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
    request: FastifyRequest<{ Body: { email: string } }>,
    reply: FastifyReply,
  ) {
    return this.forgotPassword(request, reply);
  }

  async resetPassword(
    request: FastifyRequest<{
      Body: { token: string; newPassword: string; confirmPassword: string };
    }>,
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
    request: FastifyRequest<{ Body: { token: string } }>,
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
    request: FastifyRequest<{ Body: { email: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { email } = request.body;

      let isAlreadyVerified = false;
      try {
        const queryResult = await this.getUserByEmailHandler.handle({ email });
        if (queryResult?.emailVerified) {
          isAlreadyVerified = true;
        }
      } catch {
        // Do not reveal whether the email exists
      }

      if (isAlreadyVerified) {
        return ResponseHelper.ok(
          reply,
          'If an account with that email exists, verification email has been sent.',
          { action: 'verification_sent' },
        );
      }

      await this.initiatePasswordResetHandler.handle({ email });

      return ResponseHelper.ok(reply, 'Verification email has been sent.', {
        action: 'verification_sent',
      });
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async changePassword(
    request: AuthenticatedRequest<{
      Body: { currentPassword: string; newPassword: string; confirmPassword: string };
    }>,
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
    request: AuthenticatedRequest<{ Body: { newEmail: string; password: string } }>,
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
    request: AuthenticatedRequest<{ Body: { password: string } }>,
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
