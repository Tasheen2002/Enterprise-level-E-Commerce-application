import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { PreorderController } from "../controllers/preorder.controller";
import { authenticateUser, RolePermissions } from "@/api/src/shared/middleware";
import { validateBody, validateParams, validateQuery } from "../validation/validator";
import {
  preorderParamsSchema,
  listPreordersQuerySchema,
  createPreorderSchema,
  updatePreorderReleaseDateSchema,
  preorderResponseSchema,
} from "../validation/preorder.schema";

const authenticateAdmin = [authenticateUser, RolePermissions.ADMIN_ONLY];

export async function registerPreorderRoutes(
  fastify: FastifyInstance,
  preorderController: PreorderController,
): Promise<void> {
  // Create preorder for an order item
  fastify.post(
    "/preorders",
    {
      preValidation: [validateBody(createPreorderSchema)],
      preHandler: authenticateAdmin,
      schema: {
        description:
          "Create a new preorder for an order item. Used for items that will be available in the future.",
        tags: ["Preorders"],
        summary: "Create Preorder",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["orderItemId"],
          properties: {
            orderItemId: { type: "string", format: "uuid" },
            releaseDate: { type: "string", format: "date-time" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: preorderResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      preorderController.createPreorder(request as AuthenticatedRequest, reply),
  );

  // Get preorder by order item ID
  fastify.get(
    "/preorders/:orderItemId",
    {
      preValidation: [validateParams(preorderParamsSchema)],
      preHandler: authenticateUser,
      schema: {
        description: "Get preorder details for a specific order item",
        tags: ["Preorders"],
        summary: "Get Preorder",
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
              data: preorderResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      preorderController.getPreorder(request as AuthenticatedRequest, reply),
  );

  // List preorders with filtering
  fastify.get(
    "/preorders",
    {
      preValidation: [validateQuery(listPreordersQuerySchema)],
      preHandler: authenticateUser,
      schema: {
        description:
          "Get paginated list of preorders with filtering options (all, notified, unnotified, released)",
        tags: ["Preorders"],
        summary: "List Preorders",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            offset: { type: "integer", minimum: 0, default: 0 },
            sortBy: { type: "string", enum: ["releaseDate", "notifiedAt"], default: "releaseDate" },
            sortOrder: { type: "string", enum: ["asc", "desc"], default: "asc" },
            filterType: { type: "string", enum: ["all", "notified", "unnotified", "released"], default: "all" },
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
                  items: { type: "array", items: preorderResponseSchema },
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
      preorderController.listPreorders(request as AuthenticatedRequest, reply),
  );

  // Update preorder release date
  fastify.patch(
    "/preorders/:orderItemId/release-date",
    {
      preValidation: [validateParams(preorderParamsSchema), validateBody(updatePreorderReleaseDateSchema)],
      preHandler: [...authenticateAdmin],
      schema: {
        description: "Update the expected release date for a preorder (Admin only)",
        tags: ["Preorders"],
        summary: "Update Preorder Release Date",
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
          required: ["releaseDate"],
          properties: {
            releaseDate: { type: "string", format: "date-time" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              statusCode: { type: "number" },
              message: { type: "string" },
              data: preorderResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      preorderController.updateReleaseDate(request as AuthenticatedRequest, reply),
  );

  // Mark preorder customer as notified
  fastify.post(
    "/preorders/:orderItemId/notify",
    {
      preValidation: [validateParams(preorderParamsSchema)],
      preHandler: authenticateAdmin,
      schema: {
        description: "Mark that the customer has been notified about the preorder (Admin only)",
        tags: ["Preorders"],
        summary: "Mark Preorder as Notified",
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
              data: preorderResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) =>
      preorderController.markNotified(request as AuthenticatedRequest, reply),
  );

  // Delete preorder
  fastify.delete(
    "/preorders/:orderItemId",
    {
      preValidation: [validateParams(preorderParamsSchema)],
      preHandler: authenticateAdmin,
      schema: {
        description: "Delete a preorder (Admin only)",
        tags: ["Preorders"],
        summary: "Delete Preorder",
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
      preorderController.deletePreorder(request as AuthenticatedRequest, reply),
  );
}
