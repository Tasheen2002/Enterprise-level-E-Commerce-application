import { FastifyInstance, FastifyRequest } from "fastify";
import { AuthController } from "../controllers/auth.controller";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import { validateBody, toJsonSchema } from "../validation/validator";
import {
  successResponse,
  actionSuccessResponse,
} from "@/api/src/shared/http/response-schemas";
import {
  registerSchema,
  loginSchema,
  googleLoginSchema,
  logoutSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  verifyPhoneSchema,
  resendVerificationSchema,
  changeEmailSchema,
  deleteAccountSchema,
  enable2FASchema,
  disable2FASchema,
  regenerateBackupCodesSchema,
  verify2FALoginSchema,
  authResultResponseSchema,
  refreshTokenResponseSchema,
  userIdentityResponseSchema,
  actionResponseSchema,
  verifyPhoneResponseSchema,
  setup2FAResponseSchema,
  backupCodesResponseSchema,
  loginResponseSchema,
  RegisterBody,
  LoginBody,
  GoogleLoginBody,
  RefreshTokenBody,
  ForgotPasswordBody,
  ResetPasswordBody,
  VerifyEmailBody,
  VerifyPhoneBody,
  ResendVerificationBody,
  Enable2FABody,
  Disable2FABody,
  RegenerateBackupCodesBody,
  Verify2FALoginBody,
} from "../validation/auth.schema";
import {
  createRateLimiter,
  RateLimitPresets,
} from "@/api/src/shared/middleware/rate-limiter.middleware";

const authRateLimiter = createRateLimiter(RateLimitPresets.auth);

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const registerBodyJson = toJsonSchema(registerSchema);
const loginBodyJson = toJsonSchema(loginSchema);
const googleLoginBodyJson = toJsonSchema(googleLoginSchema);
const logoutBodyJson = toJsonSchema(logoutSchema);
const refreshTokenBodyJson = toJsonSchema(refreshTokenSchema);
const changePasswordBodyJson = toJsonSchema(changePasswordSchema);
const forgotPasswordBodyJson = toJsonSchema(forgotPasswordSchema);
const resetPasswordBodyJson = toJsonSchema(resetPasswordSchema);
const verifyEmailBodyJson = toJsonSchema(verifyEmailSchema);
const verifyPhoneBodyJson = toJsonSchema(verifyPhoneSchema);
const enable2FABodyJson = toJsonSchema(enable2FASchema);
const disable2FABodyJson = toJsonSchema(disable2FASchema);
const regenerateBackupCodesBodyJson = toJsonSchema(regenerateBackupCodesSchema);
const verify2FALoginBodyJson = toJsonSchema(verify2FALoginSchema);
const resendVerificationBodyJson = toJsonSchema(resendVerificationSchema);
const changeEmailBodyJson = toJsonSchema(changeEmailSchema);
const deleteAccountBodyJson = toJsonSchema(deleteAccountSchema);

export async function authRoutes(
  fastify: FastifyInstance,
  controller: AuthController,
) {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await authRateLimiter(request, reply);
    }
  });

  // POST /auth/register
  fastify.post(
    "/auth/register",
    {
      preHandler: [validateBody(registerSchema)],
      schema: {
        tags: ["Authentication"],
        summary: "Register a new user",
        description:
          "Register a new user account. Returns JWT tokens on success. New accounts are always created with the CUSTOMER role; staff/admin roles are assigned via separate admin endpoints.",
        body: registerBodyJson,
        response: {
          201: successResponse(authResultResponseSchema, 201),
        },
      },
    },
    (request, reply) =>
      controller.register(
        request as FastifyRequest<{ Body: RegisterBody }>,
        reply,
      ),
  );

  // POST /auth/login
  fastify.post(
    "/auth/login",
    {
      preHandler: [validateBody(loginSchema)],
      schema: {
        tags: ["Authentication"],
        summary: "Login",
        description:
          "Authenticate with email and password. Returns either the full JWT pair (`kind: 'success'`) or — when the account has 2FA enabled — a short-lived pending token (`kind: 'two_factor_required'`) that the client exchanges via `/auth/2fa/verify`.",
        body: loginBodyJson,
        response: {
          200: successResponse(loginResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.login(
        request as FastifyRequest<{ Body: LoginBody }>,
        reply,
      ),
  );

  // POST /auth/google
  fastify.post(
    "/auth/google",
    {
      preHandler: [validateBody(googleLoginSchema)],
      schema: {
        tags: ["Authentication"],
        summary: "Sign in with Google",
        description:
          "Verify a Firebase ID token from a Google sign-in and exchange it for the app's own JWTs. Auto-creates a CUSTOMER account on first use; subsequent calls log into the same account by verified email match.",
        body: googleLoginBodyJson,
        response: {
          200: successResponse(authResultResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.googleLogin(
        request as FastifyRequest<{ Body: GoogleLoginBody }>,
        reply,
      ),
  );

  // POST /auth/refresh
  fastify.post(
    "/auth/refresh",
    {
      preHandler: [validateBody(refreshTokenSchema)],
      schema: {
        tags: ["Authentication"],
        summary: "Refresh access token",
        description: "Exchange a valid refresh token for a new access token.",
        body: refreshTokenBodyJson,
        response: {
          200: successResponse(refreshTokenResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.refreshToken(
        request as FastifyRequest<{ Body: RefreshTokenBody }>,
        reply,
      ),
  );

  // POST /auth/logout
  fastify.post(
    "/auth/logout",
    {
      preHandler: [authenticate, validateBody(logoutSchema)],
      schema: {
        tags: ["Authentication"],
        summary: "Logout",
        description:
          "Invalidate the current session and revoke the refresh token. " +
          "Clients SHOULD send their refreshToken in the body so it can be " +
          "blacklisted; otherwise the refresh token remains valid until expiry.",
        security: [{ bearerAuth: [] }],
        body: logoutBodyJson,
        response: {
          200: actionSuccessResponse(),
        },
      },
    },
    (request, reply) =>
      controller.logout(request as AuthenticatedRequest, reply),
  );

  // GET /auth/me
  fastify.get(
    "/auth/me",
    {
      preHandler: [authenticate],
      schema: {
        tags: ["Authentication"],
        summary: "Get current user",
        description:
          "Returns the authenticated user's basic identity from the JWT payload.",
        security: [{ bearerAuth: [] }],
        response: {
          200: successResponse(userIdentityResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.me(request as AuthenticatedRequest, reply),
  );

  // POST /auth/change-password
  fastify.post(
    "/auth/change-password",
    {
      preHandler: [
        authenticate,
        validateBody(changePasswordSchema),
      ],
      schema: {
        tags: ["Authentication"],
        summary: "Change password",
        description: "Change the authenticated user's account password.",
        security: [{ bearerAuth: [] }],
        body: changePasswordBodyJson,
        response: {
          200: successResponse(actionResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.changePassword(request as AuthenticatedRequest, reply),
  );

  // POST /auth/forgot-password
  fastify.post(
    "/auth/forgot-password",
    {
      preHandler: [validateBody(forgotPasswordSchema)],
      schema: {
        tags: ["Authentication"],
        summary: "Initiate password reset",
        description:
          "Send a password reset link to the given email. Always returns 200 to prevent email enumeration.",
        body: forgotPasswordBodyJson,
        response: {
          200: successResponse(actionResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.forgotPassword(
        request as FastifyRequest<{ Body: ForgotPasswordBody }>,
        reply,
      ),
  );

  // POST /auth/reset-password
  fastify.post(
    "/auth/reset-password",
    {
      preHandler: [validateBody(resetPasswordSchema)],
      schema: {
        tags: ["Authentication"],
        summary: "Reset password",
        description:
          "Set a new password using the reset token received by email.",
        body: resetPasswordBodyJson,
        response: {
          200: successResponse(actionResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.resetPassword(
        request as FastifyRequest<{ Body: ResetPasswordBody }>,
        reply,
      ),
  );

  // POST /auth/verify-email
  fastify.post(
    "/auth/verify-email",
    {
      preHandler: [validateBody(verifyEmailSchema)],
      schema: {
        tags: ["Authentication"],
        summary: "Verify email address",
        description:
          "Verify a user's email address using the token sent to their inbox.",
        body: verifyEmailBodyJson,
        response: {
          200: successResponse(actionResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.verifyEmail(
        request as FastifyRequest<{ Body: VerifyEmailBody }>,
        reply,
      ),
  );

  // POST /auth/resend-verification
  fastify.post(
    "/auth/resend-verification",
    {
      preHandler: [validateBody(resendVerificationSchema)],
      schema: {
        tags: ["Authentication"],
        summary: "Resend verification email",
        description:
          "Resend the email verification link to the user's email address. Always returns 200 to prevent email enumeration.",
        body: resendVerificationBodyJson,
        response: {
          200: successResponse(actionResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.resendVerification(
        request as FastifyRequest<{ Body: ResendVerificationBody }>,
        reply,
      ),
  );

  // POST /auth/change-email
  fastify.post(
    "/auth/change-email",
    {
      preHandler: [
        authenticate,
        validateBody(changeEmailSchema),
      ],
      schema: {
        tags: ["Authentication"],
        summary: "Change email address",
        description:
          "Change the authenticated user's email. Requires password confirmation.",
        security: [{ bearerAuth: [] }],
        body: changeEmailBodyJson,
        response: {
          200: successResponse(actionResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.changeEmail(request as AuthenticatedRequest, reply),
  );

  // POST /auth/2fa/setup
  fastify.post(
    "/auth/2fa/setup",
    {
      preHandler: [authenticate],
      schema: {
        tags: ["Authentication"],
        summary: "Begin 2FA enrolment",
        description:
          "Generate a TOTP secret + QR-code data URL for the authenticated user. The secret is staged on the user record but 2FA is NOT activated yet — the client must follow up with `/auth/2fa/enable` and a valid TOTP code to flip the enforcement flag.",
        security: [{ bearerAuth: [] }],
        response: {
          200: successResponse(setup2FAResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.setup2FA(request as AuthenticatedRequest, reply),
  );

  // POST /auth/2fa/enable
  fastify.post(
    "/auth/2fa/enable",
    {
      preHandler: [authenticate, validateBody(enable2FASchema)],
      schema: {
        tags: ["Authentication"],
        summary: "Activate 2FA after enrolment",
        description:
          "Verify a TOTP code against the staged secret, flip `twoFactorEnabled = true`, and issue a fresh batch of single-use backup codes. The plaintext codes are returned ONLY here — they are never re-emitted.",
        security: [{ bearerAuth: [] }],
        body: enable2FABodyJson,
        response: {
          200: successResponse(backupCodesResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.enable2FA(
        request as AuthenticatedRequest<{ Body: Enable2FABody }>,
        reply,
      ),
  );

  // POST /auth/2fa/disable
  fastify.post(
    "/auth/2fa/disable",
    {
      preHandler: [authenticate, validateBody(disable2FASchema)],
      schema: {
        tags: ["Authentication"],
        summary: "Disable 2FA",
        description:
          "Turn 2FA off, wipe the TOTP secret, and delete all backup codes. Requires password confirmation — losing the password alone must not let an attacker downgrade the account's security profile.",
        security: [{ bearerAuth: [] }],
        body: disable2FABodyJson,
        response: {
          200: successResponse(actionResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.disable2FA(
        request as AuthenticatedRequest<{ Body: Disable2FABody }>,
        reply,
      ),
  );

  // POST /auth/2fa/backup-codes/regenerate
  fastify.post(
    "/auth/2fa/backup-codes/regenerate",
    {
      preHandler: [authenticate, validateBody(regenerateBackupCodesSchema)],
      schema: {
        tags: ["Authentication"],
        summary: "Regenerate 2FA backup codes",
        description:
          "Replace the user's set of backup codes with a fresh batch. Old codes are invalidated atomically. Same password gate as `/auth/2fa/disable`.",
        security: [{ bearerAuth: [] }],
        body: regenerateBackupCodesBodyJson,
        response: {
          200: successResponse(backupCodesResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.regenerateBackupCodes(
        request as AuthenticatedRequest<{ Body: RegenerateBackupCodesBody }>,
        reply,
      ),
  );

  // POST /auth/2fa/verify  (no auth — the pending token IS the auth)
  fastify.post(
    "/auth/2fa/verify",
    {
      preHandler: [validateBody(verify2FALoginSchema)],
      schema: {
        tags: ["Authentication"],
        summary: "Complete 2FA login",
        description:
          "Step 2 of the email/password + 2FA login. Exchange a pending token (issued by `/auth/login`) plus a TOTP code OR a backup code for a real session. Backup codes are single-use and consumed on success.",
        body: verify2FALoginBodyJson,
        response: {
          200: successResponse(authResultResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.verify2FALogin(
        request as FastifyRequest<{ Body: Verify2FALoginBody }>,
        reply,
      ),
  );

  // POST /auth/verify-phone
  fastify.post(
    "/auth/verify-phone",
    {
      preHandler: [
        authenticate,
        validateBody(verifyPhoneSchema),
      ],
      schema: {
        tags: ["Authentication"],
        summary: "Verify phone number",
        description:
          "Confirm ownership of a phone number using a Firebase ID token issued by `signInWithPhoneNumber` + OTP confirm on the client. The phone number is taken from the verified `phone_number` claim on the token — clients cannot pass it separately.",
        security: [{ bearerAuth: [] }],
        body: verifyPhoneBodyJson,
        response: {
          200: successResponse(verifyPhoneResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.verifyPhone(
        request as AuthenticatedRequest<{ Body: VerifyPhoneBody }>,
        reply,
      ),
  );

  // POST /auth/delete-account
  fastify.post(
    "/auth/delete-account",
    {
      preHandler: [
        authenticate,
        validateBody(deleteAccountSchema),
      ],
      schema: {
        tags: ["Authentication"],
        summary: "Delete account",
        description:
          "Permanently delete the authenticated user's account. Requires password confirmation.",
        security: [{ bearerAuth: [] }],
        body: deleteAccountBodyJson,
        response: {
          200: actionSuccessResponse(),
        },
      },
    },
    (request, reply) =>
      controller.deleteAccount(request as AuthenticatedRequest, reply),
  );
}
