import { FastifyInstance, FastifyRequest } from "fastify";
import {
  AuthController,
  RegisterUserRequest,
  LoginUserRequest,
  RefreshTokenRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
  ChangeEmailRequest,
  DeleteAccountRequest,
} from "../controllers/auth.controller";
import { authenticate } from "@/api/src/shared/middleware";
import {
  createRateLimiter,
  RateLimitPresets,
} from "@/api/src/shared/middleware/rate-limiter.middleware";

const authRateLimiter = createRateLimiter(RateLimitPresets.auth);

const userObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    email: { type: "string", format: "email" },
    role: { type: "string" },
    isGuest: { type: "boolean" },
    emailVerified: { type: "boolean" },
    phoneVerified: { type: "boolean" },
  },
};

const authResultData = {
  type: "object",
  properties: {
    accessToken: { type: "string" },
    refreshToken: { type: "string" },
    expiresIn: { type: "number" },
    user: userObject,
  },
};

export async function registerAuthRoutes(
  fastify: FastifyInstance,
  controller: AuthController,
) {
  // POST /auth/register
  fastify.post(
    "/auth/register",
    {
      preHandler: [authRateLimiter],
      schema: {
        tags: ["Authentication"],
        summary: "Register a new user",
        description:
          "Register a new user account. Returns JWT tokens on success.",
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            firstName: { type: "string", minLength: 1, maxLength: 100 },
            lastName: { type: "string", minLength: 1, maxLength: 100 },
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 8, maxLength: 128 },
            phone: { type: "string" },
            role: { type: "string", enum: ["customer", "admin", "vendor"] },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: authResultData,
            },
          },
        },
      },
    },
    (request: FastifyRequest<{ Body: RegisterUserRequest }>, reply) =>
      controller.register(request, reply),
  );

  // POST /auth/login
  fastify.post(
    "/auth/login",
    {
      preHandler: [authRateLimiter],
      schema: {
        tags: ["Authentication"],
        summary: "Login",
        description:
          "Authenticate with email and password. Returns JWT tokens on success.",
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 1 },
            rememberMe: { type: "boolean" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: authResultData,
            },
          },
        },
      },
    },
    (request: FastifyRequest<{ Body: LoginUserRequest }>, reply) =>
      controller.login(request, reply),
  );

  // POST /auth/refresh
  fastify.post(
    "/auth/refresh",
    {
      schema: {
        tags: ["Authentication"],
        summary: "Refresh access token",
        description: "Exchange a valid refresh token for a new access token.",
        body: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: { type: "string", minLength: 1 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  accessToken: { type: "string" },
                  refreshToken: { type: "string" },
                  expiresIn: { type: "number" },
                },
              },
            },
          },
        },
      },
    },
    (request: FastifyRequest<{ Body: RefreshTokenRequest }>, reply) =>
      controller.refreshToken(request, reply),
  );

  // POST /auth/logout
  fastify.post(
    "/auth/logout",
    {
      preHandler: [authenticate],
      schema: {
        tags: ["Authentication"],
        summary: "Logout",
        description:
          "Invalidate the current session and revoke the refresh token.",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    (request, reply) => controller.logout(request, reply),
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
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  userId: { type: "string", format: "uuid" },
                  email: { type: "string", format: "email" },
                  role: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    (request, reply) => controller.me(request, reply),
  );

  // POST /auth/change-password
  fastify.post(
    "/auth/change-password",
    {
      preHandler: [authenticate],
      schema: {
        tags: ["Authentication"],
        summary: "Change password",
        description: "Change the authenticated user's account password.",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["currentPassword", "newPassword"],
          properties: {
            currentPassword: { type: "string", minLength: 1 },
            newPassword: { type: "string", minLength: 8, maxLength: 128 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    (request: FastifyRequest<{ Body: ChangePasswordRequest }>, reply) =>
      controller.changePassword(request, reply),
  );

  // POST /auth/forgot-password
  fastify.post(
    "/auth/forgot-password",
    {
      preHandler: [authRateLimiter],
      schema: {
        tags: ["Authentication"],
        summary: "Initiate password reset",
        description:
          "Send a password reset link to the given email. Always returns 200 to prevent email enumeration.",
        body: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", format: "email" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    (request: FastifyRequest<{ Body: ForgotPasswordRequest }>, reply) =>
      controller.initiatePasswordReset(request, reply),
  );

  // POST /auth/reset-password
  fastify.post(
    "/auth/reset-password",
    {
      schema: {
        tags: ["Authentication"],
        summary: "Reset password",
        description:
          "Set a new password using the reset token received by email.",
        body: {
          type: "object",
          required: ["token", "newPassword", "confirmPassword"],
          properties: {
            token: { type: "string", minLength: 1 },
            newPassword: { type: "string", minLength: 8, maxLength: 128 },
            confirmPassword: { type: "string", minLength: 8, maxLength: 128 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    (request: FastifyRequest<{ Body: ResetPasswordRequest }>, reply) =>
      controller.resetPassword(request, reply),
  );

  // POST /auth/verify-email
  fastify.post(
    "/auth/verify-email",
    {
      schema: {
        tags: ["Authentication"],
        summary: "Verify email address",
        description:
          "Verify a user's email address using the token sent to their inbox.",
        body: {
          type: "object",
          required: ["token"],
          properties: {
            token: { type: "string", minLength: 1 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    (request: FastifyRequest<{ Body: VerifyEmailRequest }>, reply) =>
      controller.verifyEmail(request, reply),
  );

  // POST /auth/resend-verification
  fastify.post(
    "/auth/resend-verification",
    {
      preHandler: [authRateLimiter],
      schema: {
        tags: ["Authentication"],
        summary: "Resend verification email",
        description:
          "Resend the email verification link to the user's email address.",
        body: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", format: "email" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    (request: FastifyRequest<{ Body: ResendVerificationRequest }>, reply) =>
      controller.resendVerification(request, reply),
  );

  // POST /auth/change-email
  fastify.post(
    "/auth/change-email",
    {
      preHandler: [authenticate],
      schema: {
        tags: ["Authentication"],
        summary: "Change email address",
        description:
          "Change the authenticated user's email. Requires password confirmation.",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["newEmail", "password"],
          properties: {
            newEmail: { type: "string", format: "email" },
            password: { type: "string", minLength: 1 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    (request: FastifyRequest<{ Body: ChangeEmailRequest }>, reply) =>
      controller.changeEmail(request, reply),
  );

  // POST /auth/delete-account
  fastify.post(
    "/auth/delete-account",
    {
      preHandler: [authenticate],
      schema: {
        tags: ["Authentication"],
        summary: "Delete account",
        description:
          "Permanently delete the authenticated user's account. Requires password confirmation.",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["password"],
          properties: {
            password: { type: "string", minLength: 1 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    (request: FastifyRequest<{ Body: DeleteAccountRequest }>, reply) =>
      controller.deleteAccount(request, reply),
  );
}
