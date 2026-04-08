import { FastifyInstance } from "fastify";
import {
  BackorderController,
  CreateBackorderRequest,
  GetBackorderRequest,
  ListBackordersRequest,
  UpdateBackorderEtaRequest,
  MarkBackorderNotifiedRequest,
  DeleteBackorderRequest,
} from "../controllers/backorder.controller";
import { authenticateUser, RolePermissions } from "@/api/src/shared/middleware";

const authenticateAdmin = [authenticateUser, RolePermissions.ADMIN_ONLY];

const errorResponses = {
  400: {
    description: "Bad request - validation failed",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Validation failed" },
      errors: { type: "array", items: { type: "string" } },
    },
  },
  401: {
    description: "Unauthorized - authentication required",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Authentication required" },
    },
  },
  403: {
    description: "Forbidden - insufficient permissions",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Insufficient permissions" },
    },
  },
  404: {
    description: "Not found",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Resource not found" },
    },
  },
  500: {
    description: "Internal server error",
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: { type: "string", example: "Internal server error" },
    },
  },
};

const backorderDataSchema = {
  type: "object",
  properties: {
    orderItemId: { type: "string", format: "uuid" },
    promisedEta: { type: "string", format: "date-time", nullable: true },
    notifiedAt: { type: "string", format: "date-time", nullable: true },
    hasPromisedEta: { type: "boolean" },
    isCustomerNotified: { type: "boolean" },
  },
};

export async function registerBackorderRoutes(
  fastify: FastifyInstance,
  backorderController: BackorderController,
): Promise<void> {
  // Create backorder for an order item
  fastify.post<CreateBackorderRequest>(
    "/backorders",
    {
      preHandler: authenticateAdmin,
      schema: {
        description:
          "Create a new backorder for an order item. Used for items that are temporarily out of stock but will be restocked soon.",
        tags: ["Backorders"],
        summary: "Create Backorder",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["orderItemId"],
          properties: {
            orderItemId: {
              type: "string",
              format: "uuid",
              description: "Order item ID",
            },
            promisedEta: {
              type: "string",
              format: "date-time",
              description:
                "Promised ETA for restocking (must be in the future)",
            },
          },
        },
        response: {
          201: {
            description: "Backorder created successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: backorderDataSchema,
              message: {
                type: "string",
                example: "Backorder created successfully",
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    backorderController.createBackorder.bind(backorderController),
  );

  // Get backorder by order item ID
  fastify.get<GetBackorderRequest>(
    "/backorders/:orderItemId",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Get backorder details for a specific order item",
        tags: ["Backorders"],
        summary: "Get Backorder",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            orderItemId: { type: "string", format: "uuid" },
          },
          required: ["orderItemId"],
        },
        response: {
          200: {
            description: "Backorder retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: backorderDataSchema,
            },
          },
          ...errorResponses,
        },
      },
    },
    backorderController.getBackorder.bind(backorderController),
  );

  // List backorders with filtering
  fastify.get<ListBackordersRequest>(
    "/backorders",
    {
      preHandler: authenticateUser,
      schema: {
        description:
          "Get paginated list of backorders with filtering options (all, notified, unnotified, overdue)",
        tags: ["Backorders"],
        summary: "List Backorders",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 20,
              description: "Maximum number of backorders to return",
            },
            offset: {
              type: "integer",
              minimum: 0,
              default: 0,
              description: "Number of backorders to skip",
            },
            sortBy: {
              type: "string",
              enum: ["promisedEta", "notifiedAt"],
              default: "promisedEta",
              description: "Sort by field",
            },
            sortOrder: {
              type: "string",
              enum: ["asc", "desc"],
              default: "asc",
              description: "Sort order",
            },
            filterType: {
              type: "string",
              enum: ["all", "notified", "unnotified", "overdue"],
              default: "all",
              description: "Filter backorders by type",
            },
          },
        },
        response: {
          200: {
            description: "Backorders retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: backorderDataSchema,
                  },
                  total: { type: "integer" },
                  limit: { type: "integer" },
                  offset: { type: "integer" },
                },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    backorderController.listBackorders.bind(backorderController),
  );

  // Update backorder promised ETA
  fastify.patch<UpdateBackorderEtaRequest>(
    "/backorders/:orderItemId/eta",
    {
      preHandler: authenticateAdmin,
      schema: {
        description: "Update the promised ETA for a backorder",
        tags: ["Backorders"],
        summary: "Update Backorder ETA",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            orderItemId: { type: "string", format: "uuid" },
          },
          required: ["orderItemId"],
        },
        body: {
          type: "object",
          required: ["promisedEta"],
          properties: {
            promisedEta: {
              type: "string",
              format: "date-time",
              description: "New promised ETA (must be in the future)",
            },
          },
        },
        response: {
          200: {
            description: "Backorder ETA updated successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: backorderDataSchema,
              message: {
                type: "string",
                example: "Backorder promised ETA updated successfully",
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    backorderController.updatePromisedEta.bind(backorderController),
  );

  // Mark backorder customer as notified
  fastify.post<MarkBackorderNotifiedRequest>(
    "/backorders/:orderItemId/notify",
    {
      preHandler: authenticateAdmin,
      schema: {
        description:
          "Mark that the customer has been notified about the backorder availability",
        tags: ["Backorders"],
        summary: "Mark Backorder as Notified",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            orderItemId: { type: "string", format: "uuid" },
          },
          required: ["orderItemId"],
        },
        response: {
          200: {
            description: "Backorder marked as notified successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: backorderDataSchema,
              message: {
                type: "string",
                example: "Backorder marked as notified successfully",
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    backorderController.markNotified.bind(backorderController),
  );

  // Delete backorder
  fastify.delete<DeleteBackorderRequest>(
    "/backorders/:orderItemId",
    {
      preHandler: authenticateAdmin,
      schema: {
        description: "Delete a backorder",
        tags: ["Backorders"],
        summary: "Delete Backorder",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            orderItemId: { type: "string", format: "uuid" },
          },
          required: ["orderItemId"],
        },
        response: {
          200: {
            description: "Backorder deleted successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: {
                type: "string",
                example: "Backorder deleted successfully",
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    backorderController.deleteBackorder.bind(backorderController),
  );
}
