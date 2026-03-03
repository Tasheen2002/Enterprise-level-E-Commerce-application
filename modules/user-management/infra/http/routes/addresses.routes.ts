import { FastifyInstance } from "fastify";
import { AddressesController } from "../controllers/addresses.controller";
import { authenticate } from "@/api/src/shared/middleware";

const addressObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    type: { type: "string", enum: ["shipping", "billing"] },
    firstName: { type: "string" },
    lastName: { type: "string" },
    phone: { type: "string" },
    addressLine1: { type: "string" },
    addressLine2: { type: "string" },
    city: { type: "string" },
    state: { type: "string" },
    postalCode: { type: "string" },
    country: { type: "string" },
    isDefault: { type: "boolean" },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
  },
};

const addressBodyProperties = {
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
};

const addressIdParam = {
  type: "object",
  required: ["addressId"],
  properties: {
    addressId: { type: "string", format: "uuid" },
  },
};

export async function registerAddressRoutes(
  fastify: FastifyInstance,
  controller: AddressesController,
) {
  // GET /users/me/addresses
  fastify.get(
    "/users/me/addresses",
    {
      preHandler: [authenticate],
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
              data: { type: "array", items: addressObject },
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.getCurrentUserAddresses(request as any, reply),
  );

  // POST /users/me/addresses
  fastify.post(
    "/users/me/addresses",
    {
      preHandler: [authenticate],
      schema: {
        tags: ["Addresses"],
        summary: "Add a new address",
        description:
          "Save a new shipping or billing address for the authenticated user.",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: [
            "type",
            "firstName",
            "lastName",
            "addressLine1",
            "city",
            "postalCode",
            "country",
          ],
          properties: addressBodyProperties,
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: addressObject,
            },
          },
        },
      },
    },
    (request, reply) => controller.addCurrentUserAddress(request as any, reply),
  );

  // PATCH /users/me/addresses/:addressId
  fastify.patch(
    "/users/me/addresses/:addressId",
    {
      preHandler: [authenticate],
      schema: {
        tags: ["Addresses"],
        summary: "Update an address",
        description:
          "Partially update an existing address. All body fields are optional.",
        security: [{ bearerAuth: [] }],
        params: addressIdParam,
        body: {
          type: "object",
          properties: addressBodyProperties,
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: addressObject,
            },
          },
        },
      },
    },
    (request, reply) =>
      controller.updateCurrentUserAddress(request as any, reply),
  );

  // DELETE /users/me/addresses/:addressId
  fastify.delete(
    "/users/me/addresses/:addressId",
    {
      preHandler: [authenticate],
      schema: {
        tags: ["Addresses"],
        summary: "Delete an address",
        description:
          "Permanently remove an address belonging to the authenticated user.",
        security: [{ bearerAuth: [] }],
        params: addressIdParam,
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
    (request, reply) =>
      controller.deleteCurrentUserAddress(request as any, reply),
  );

  // POST /users/me/addresses/:addressId/set-default
  fastify.post(
    "/users/me/addresses/:addressId/set-default",
    {
      preHandler: [authenticate],
      schema: {
        tags: ["Addresses"],
        summary: "Set default address",
        description: "Mark an address as the user's default address.",
        security: [{ bearerAuth: [] }],
        params: addressIdParam,
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
    (request, reply) => controller.setDefaultAddress(request as any, reply),
  );
}
