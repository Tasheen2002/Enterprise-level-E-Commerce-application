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
  logoutSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  changeEmailSchema,
  deleteAccountSchema,
  authResultResponseSchema,
  refreshTokenResponseSchema,
  userIdentityResponseSchema,
  actionResponseSchema,
  RegisterBody,
  LoginBody,
  RefreshTokenBody,
  ForgotPasswordBody,
  ResetPasswordBody,
  VerifyEmailBody,
  ResendVerificationBody,
} from "../validation/auth.schema";
import {
  createRateLimiter,
  RateLimitPresets,
} from "@/api/src/shared/middleware/rate-limiter.middleware";

const authRateLimiter = createRateLimiter(RateLimitPresets.auth);

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const registerBodyJson = toJsonSchema(registerSchema);
const loginBodyJson = toJsonSchema(loginSchema);
const logoutBodyJson = toJsonSchema(logoutSchema);
const refreshTokenBodyJson = toJsonSchema(refreshTokenSchema);
const changePasswordBodyJson = toJsonSchema(changePasswordSchema);
const forgotPasswordBodyJson = toJsonSchema(forgotPasswordSchema);
const resetPasswordBodyJson = toJsonSchema(resetPasswordSchema);
const verifyEmailBodyJson = toJsonSchema(verifyEmailSchema);
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
          "Authenticate with email and password. Returns JWT tokens on success.",
        body: loginBodyJson,
        response: {
          200: successResponse(authResultResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.login(
        request as FastifyRequest<{ Body: LoginBody }>,
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
