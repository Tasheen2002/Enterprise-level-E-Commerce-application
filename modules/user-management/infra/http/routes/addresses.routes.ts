import { FastifyInstance } from "fastify";
import { AddressesController } from "../controllers/addresses.controller";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { validateBody, validateParams } from "../validation/validator";
import {
  addAddressSchema,
  updateAddressSchema,
  addressIdParamsSchema,
  addressResponseSchema,
} from "../validation/address.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

export async function addressRoutes(
  fastify: FastifyInstance,
  controller: AddressesController,
) {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // GET /users/me/addresses
  fastify.get(
    "/users/me/addresses",
    {
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        tags: ["Addresses"],
        summary: "List addresses",
        description: "Retrieve all saved addresses for the authenticated user.",
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
                  userId: { type: "string" },
                  addresses: { type: "array", items: addressResponseSchema },
                  totalCount: { type: "number" },
                },
              },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getCurrentUserAddresses(request as AuthenticatedRequest, reply),
  );

  // POST /users/me/addresses
  fastify.post(
    "/users/me/addresses",
    {
      preValidation: [validateBody(addAddressSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        tags: ["Addresses"],
        summary: "Add a new address",
        description:
          "Save a new shipping or billing address for the authenticated user.",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["type", "firstName", "lastName", "addressLine1", "city", "postalCode", "country"],
          properties: {
            type: { type: "string", enum: ["shipping", "billing"] },
            firstName: { type: "string", minLength: 1, maxLength: 100 },
            lastName: { type: "string", minLength: 1, maxLength: 100 },
            phone: { type: "string" },
            addressLine1: { type: "string", minLength: 1, maxLength: 255 },
            addressLine2: { type: "string", maxLength: 255 },
            city: { type: "string", minLength: 1, maxLength: 100 },
            state: { type: "string", maxLength: 100 },
            postalCode: { type: "string", minLength: 1, maxLength: 20 },
            country: { type: "string", minLength: 2, maxLength: 2 },
            isDefault: { type: "boolean" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: addressResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.addCurrentUserAddress(request as AuthenticatedRequest, reply),
  );

  // PATCH /users/me/addresses/:addressId
  fastify.patch(
    "/users/me/addresses/:addressId",
    {
      preValidation: [validateParams(addressIdParamsSchema), validateBody(updateAddressSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        tags: ["Addresses"],
        summary: "Update an address",
        description:
          "Partially update an existing address. All body fields are optional.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["addressId"],
          properties: {
            addressId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["shipping", "billing"] },
            firstName: { type: "string", minLength: 1, maxLength: 100 },
            lastName: { type: "string", minLength: 1, maxLength: 100 },
            phone: { type: "string" },
            addressLine1: { type: "string", minLength: 1, maxLength: 255 },
            addressLine2: { type: "string", maxLength: 255 },
            city: { type: "string", minLength: 1, maxLength: 100 },
            state: { type: "string", maxLength: 100 },
            postalCode: { type: "string", minLength: 1, maxLength: 20 },
            country: { type: "string", minLength: 2, maxLength: 2 },
            isDefault: { type: "boolean" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: addressResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.updateCurrentUserAddress(request as AuthenticatedRequest, reply),
  );

  // DELETE /users/me/addresses/:addressId
  fastify.delete(
    "/users/me/addresses/:addressId",
    {
      preValidation: [validateParams(addressIdParamsSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        tags: ["Addresses"],
        summary: "Delete an address",
        description:
          "Permanently remove an address belonging to the authenticated user.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["addressId"],
          properties: {
            addressId: { type: "string", format: "uuid" },
          },
        },
        response: {
          204: {
            type: "null",
            description: "Address deleted successfully",
          },
        },
      },
    },
    (request, reply) =>
      controller.deleteCurrentUserAddress(request as AuthenticatedRequest, reply),
  );

  // POST /users/me/addresses/:addressId/set-default
  fastify.post(
    "/users/me/addresses/:addressId/set-default",
    {
      preValidation: [validateParams(addressIdParamsSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        tags: ["Addresses"],
        summary: "Set default address",
        description: "Mark an address as the user's default address.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["addressId"],
          properties: {
            addressId: { type: "string", format: "uuid" },
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
      controller.setDefaultAddress(request as AuthenticatedRequest, reply),
  );
}
