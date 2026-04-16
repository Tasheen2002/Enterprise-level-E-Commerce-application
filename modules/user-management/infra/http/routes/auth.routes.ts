import { FastifyInstance } from "fastify";
import { AuthController } from "../controllers/auth.controller";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import { validateBody } from "../validation/validator";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  changeEmailSchema,
  deleteAccountSchema,
  authResultResponseSchema,
  successResponseSchema,
} from "../validation/auth.schema";
import {
  createRateLimiter,
  RateLimitPresets,
} from "@/api/src/shared/middleware/rate-limiter.middleware";

const authRateLimiter = createRateLimiter(RateLimitPresets.auth);


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
      preValidation: [validateBody(registerSchema)],
      schema: {
        tags: ["Authentication"],
        summary: "Register a new user",
        description:
          "Register a new user account. Returns JWT tokens on success.",
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 8, maxLength: 128 },
            phone: { type: "string" },
            firstName: { type: "string", maxLength: 100 },
            lastName: { type: "string", maxLength: 100 },
            role: { type: "string", enum: ["CUSTOMER", "ADMIN", "VENDOR"] },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: authResultResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.register(request as any, reply),
  );

  // POST /auth/login
  fastify.post(
    "/auth/login",
    {
      preValidation: [validateBody(loginSchema)],
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
              data: authResultResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.login(request as any, reply),
  );

  // POST /auth/refresh
  fastify.post(
    "/auth/refresh",
    {
      preValidation: [validateBody(refreshTokenSchema)],
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
    (request, reply) => controller.refreshToken(request as any, reply),
  );

  // POST /auth/logout
  fastify.post(
    "/auth/logout",
    {
      preHandler: [RolePermissions.AUTHENTICATED],
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
              data: { type: "object" },
            },
          },
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
      preHandler: [RolePermissions.AUTHENTICATED],
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
    (request, reply) =>
      controller.me(request as AuthenticatedRequest, reply),
  );

  // POST /auth/change-password
  fastify.post(
    "/auth/change-password",
    {
      preValidation: [validateBody(changePasswordSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
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
              data: { type: "object" },
            },
          },
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
      preValidation: [validateBody(forgotPasswordSchema)],
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
              data: { type: "object" },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.initiatePasswordReset(request as any, reply),
  );

  // POST /auth/reset-password
  fastify.post(
    "/auth/reset-password",
    {
      preValidation: [validateBody(resetPasswordSchema)],
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
              data: { type: "object" },
            },
          },
        },
      },
    },
    (request, reply) => controller.resetPassword(request as any, reply),
  );

  // POST /auth/verify-email
  fastify.post(
    "/auth/verify-email",
    {
      preValidation: [validateBody(verifyEmailSchema)],
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
              data: { type: "object" },
            },
          },
        },
      },
    },
    (request, reply) => controller.verifyEmail(request as any, reply),
  );

  // POST /auth/resend-verification
  fastify.post(
    "/auth/resend-verification",
    {
      preValidation: [validateBody(resendVerificationSchema)],
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
              data: { type: "object" },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.resendVerification(request as any, reply),
  );

  // POST /auth/change-email
  fastify.post(
    "/auth/change-email",
    {
      preValidation: [validateBody(changeEmailSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
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
              data: { type: "object" },
            },
          },
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
      preValidation: [validateBody(deleteAccountSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
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
              data: { type: "object" },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.deleteAccount(request as AuthenticatedRequest, reply),
  );
}
