import { FastifyInstance } from "fastify";
import { AddressesController } from "../controllers/addresses.controller";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { validateBody, validateParams, validateQuery, toJsonSchema } from "../validation/validator";
import {
  successResponse,
  noContentResponse,
} from "@/api/src/shared/http/response-schemas";
import {
  addAddressSchema,
  updateAddressSchema,
  addressIdParamsSchema,
  listAddressesQuerySchema,
  addressResponseSchema,
  addressListResponseSchema,
} from "../validation/address.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const addAddressBodyJson = toJsonSchema(addAddressSchema);
const updateAddressBodyJson = toJsonSchema(updateAddressSchema);
const addressIdParamsJson = toJsonSchema(addressIdParamsSchema);
const listAddressesQueryJson = toJsonSchema(listAddressesQuerySchema);

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
      preValidation: [validateQuery(listAddressesQuerySchema)],
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        tags: ["Addresses"],
        summary: "List addresses",
        description: "Retrieve a paginated list of saved addresses for the authenticated user.",
        security: [{ bearerAuth: [] }],
        querystring: listAddressesQueryJson,
        response: {
          200: successResponse(addressListResponseSchema),
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
      preHandler: [authenticate, RolePermissions.AUTHENTICATED, validateBody(addAddressSchema)],
      schema: {
        tags: ["Addresses"],
        summary: "Add a new address",
        description: "Save a new shipping or billing address for the authenticated user.",
        security: [{ bearerAuth: [] }],
        body: addAddressBodyJson,
        response: {
          201: successResponse(addressResponseSchema, 201),
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
      preValidation: [validateParams(addressIdParamsSchema)],
      preHandler: [authenticate, RolePermissions.AUTHENTICATED, validateBody(updateAddressSchema)],
      schema: {
        tags: ["Addresses"],
        summary: "Update an address",
        description: "Partially update an existing address. All body fields are optional.",
        security: [{ bearerAuth: [] }],
        params: addressIdParamsJson,
        body: updateAddressBodyJson,
        response: {
          200: successResponse(addressResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.updateCurrentUserAddress(request as AuthenticatedRequest, reply),
  );

  // PATCH /users/me/addresses/:addressId/default — set this address as default
  fastify.patch(
    "/users/me/addresses/:addressId/default",
    {
      preValidation: [validateParams(addressIdParamsSchema)],
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        tags: ["Addresses"],
        summary: "Set default address",
        description: "Mark an address as the user's default address.",
        security: [{ bearerAuth: [] }],
        params: addressIdParamsJson,
        response: {
          200: successResponse(addressResponseSchema),
        },
      },
    },
    (request, reply) =>
      controller.setDefaultAddress(request as AuthenticatedRequest, reply),
  );

  // DELETE /users/me/addresses/:addressId
  fastify.delete(
    "/users/me/addresses/:addressId",
    {
      preValidation: [validateParams(addressIdParamsSchema)],
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        tags: ["Addresses"],
        summary: "Delete an address",
        description: "Permanently remove an address belonging to the authenticated user.",
        security: [{ bearerAuth: [] }],
        params: addressIdParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) =>
      controller.deleteCurrentUserAddress(request as AuthenticatedRequest, reply),
  );
}
