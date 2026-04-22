import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { BackorderController } from "../controllers/backorder.controller";
import { authenticateUser, RolePermissions } from "@/api/src/shared/middleware";
import { validateBody, validateParams, validateQuery } from "../validation/validator";
import {
  backorderParamsSchema,
  listBackordersQuerySchema,
  createBackorderSchema,
  updateBackorderEtaSchema,
  backorderResponseSchema,
} from "../validation/backorder.schema";

const authenticateAdmin = [authenticateUser, RolePermissions.ADMIN_ONLY];

export async function registerBackorderRoutes(
  fastify: FastifyInstance,
  backorderController: BackorderController,
): Promise<void> {
  // Create backorder for an order item
  fastify.post(
    "/backorders",
    {
      preValidation: [validateBody(createBackorderSchema)],
      preHandler: authenticateAdmin,
      schema: {
        description:
          "Create a new backorder for an order item. Used for items that are temporarily out of stock.",
        tags: ["Backorders"],
        summary: "Create Backorder",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["orderItemId"],
          properties: {
            orderItemId: { type: "string", format: "uuid" },
            promisedEta: { type: "string", format: "date-time" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: backorderResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      backorderController.createBackorder(request as AuthenticatedRequest, reply),
  );

  // Get backorder by order item ID
  fastify.get(
    "/backorders/:orderItemId",
    {
      preValidation: [validateParams(backorderParamsSchema)],
      preHandler: [authenticateUser],
      schema: {
        description: "Get backorder details for a specific order item",
        tags: ["Backorders"],
        summary: "Get Backorder",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["orderItemId"],
          properties: {
            orderItemId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: backorderResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      backorderController.getBackorder(request as AuthenticatedRequest, reply),
  );

  // List backorders with filtering
  fastify.get(
    "/backorders",
    {
      preValidation: [validateQuery(listBackordersQuerySchema)],
      preHandler: [authenticateUser],
      schema: {
        description:
          "Get paginated list of backorders with filtering options (all, notified, unnotified, overdue)",
        tags: ["Backorders"],
        summary: "List Backorders",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            offset: { type: "integer", minimum: 0, default: 0 },
            sortBy: { type: "string", enum: ["promisedEta", "notifiedAt"], default: "promisedEta" },
            sortOrder: { type: "string", enum: ["asc", "desc"], default: "asc" },
            filterType: { type: "string", enum: ["all", "notified", "unnotified", "overdue"], default: "all" },
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
                  items: { type: "array", items: backorderResponseSchema },
                  total: { type: "integer" },
                  limit: { type: "integer" },
                  offset: { type: "integer" },
                },
              },
            },
          },
        },
      },
    },
    (request, reply) =>
      backorderController.listBackorders(request as AuthenticatedRequest, reply),
  );

  // Update backorder promised ETA
  fastify.patch(
    "/backorders/:orderItemId/eta",
    {
      preValidation: [validateParams(backorderParamsSchema), validateBody(updateBackorderEtaSchema)],
      preHandler: authenticateAdmin,
      schema: {
        description: "Update the promised ETA for a backorder (Admin only)",
        tags: ["Backorders"],
        summary: "Update Backorder ETA",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["orderItemId"],
          properties: {
            orderItemId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          required: ["promisedEta"],
          properties: {
            promisedEta: { type: "string", format: "date-time" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: backorderResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      backorderController.updatePromisedEta(request as AuthenticatedRequest, reply),
  );

  // Mark backorder customer as notified
  fastify.post(
    "/backorders/:orderItemId/notify",
    {
      preValidation: [validateParams(backorderParamsSchema)],
      preHandler: authenticateAdmin,
      schema: {
        description: "Mark that the customer has been notified about the backorder (Admin only)",
        tags: ["Backorders"],
        summary: "Mark Backorder as Notified",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["orderItemId"],
          properties: {
            orderItemId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: backorderResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      backorderController.markNotified(request as AuthenticatedRequest, reply),
  );

  // Delete backorder
  fastify.delete(
    "/backorders/:orderItemId",
    {
      preValidation: [validateParams(backorderParamsSchema)],
      preHandler: authenticateAdmin,
      schema: {
        description: "Delete a backorder (Admin only)",
        tags: ["Backorders"],
        summary: "Delete Backorder",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["orderItemId"],
          properties: {
            orderItemId: { type: "string", format: "uuid" },
          },
        },
        response: {
          204: { type: "null", description: "No Content" },
        },
      },
    },
    (request, reply) =>
      backorderController.deleteBackorder(request as AuthenticatedRequest, reply),
  );
}
