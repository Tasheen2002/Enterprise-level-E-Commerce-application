import { FastifyInstance } from "fastify";
import {
  PreorderController,
  CreatePreorderRequest,
  GetPreorderRequest,
  ListPreordersRequest,
  UpdatePreorderReleaseDateRequest,
  MarkPreorderNotifiedRequest,
  DeletePreorderRequest,
} from "../controllers/preorder.controller";
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

const preorderDataSchema = {
  type: "object",
  properties: {
    orderItemId: { type: "string", format: "uuid" },
    releaseDate: { type: "string", format: "date-time", nullable: true },
    notifiedAt: { type: "string", format: "date-time", nullable: true },
    hasReleaseDate: { type: "boolean" },
    isCustomerNotified: { type: "boolean" },
    isReleased: { type: "boolean" },
  },
};

export async function registerPreorderRoutes(
  fastify: FastifyInstance,
  preorderController: PreorderController,
): Promise<void> {
  // Create preorder for an order item
  fastify.post<CreatePreorderRequest>(
    "/preorders",
    {
      preHandler: authenticateAdmin,
      schema: {
        description:
          "Create a new preorder for an order item. Used for items that will be available in the future (e.g., seasonal collections, upcoming releases).",
        tags: ["Preorders"],
        summary: "Create Preorder",
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
            releaseDate: {
              type: "string",
              format: "date-time",
              description: "Expected release date (must be in the future)",
            },
          },
        },
        response: {
          201: {
            description: "Preorder created successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: preorderDataSchema,
              message: {
                type: "string",
                example: "Preorder created successfully",
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    preorderController.createPreorder.bind(preorderController),
  );

  // Get preorder by order item ID
  fastify.get<GetPreorderRequest>(
    "/preorders/:orderItemId",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Get preorder details for a specific order item",
        tags: ["Preorders"],
        summary: "Get Preorder",
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
            description: "Preorder retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: preorderDataSchema,
            },
          },
          ...errorResponses,
        },
      },
    },
    preorderController.getPreorder.bind(preorderController),
  );

  // List preorders with filtering
  fastify.get<ListPreordersRequest>(
    "/preorders",
    {
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
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 20,
              description: "Maximum number of preorders to return",
            },
            offset: {
              type: "integer",
              minimum: 0,
              default: 0,
              description: "Number of preorders to skip",
            },
            sortBy: {
              type: "string",
              enum: ["releaseDate", "notifiedAt"],
              default: "releaseDate",
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
              enum: ["all", "notified", "unnotified", "released"],
              default: "all",
              description: "Filter preorders by type",
            },
          },
        },
        response: {
          200: {
            description: "Preorders retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: preorderDataSchema,
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
    preorderController.listPreorders.bind(preorderController),
  );

  // Update preorder release date
  fastify.patch<UpdatePreorderReleaseDateRequest>(
    "/preorders/:orderItemId/release-date",
    {
      preHandler: authenticateAdmin,
      schema: {
        description: "Update the expected release date for a preorder",
        tags: ["Preorders"],
        summary: "Update Preorder Release Date",
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
          required: ["releaseDate"],
          properties: {
            releaseDate: {
              type: "string",
              format: "date-time",
              description: "New release date (must be in the future)",
            },
          },
        },
        response: {
          200: {
            description: "Preorder release date updated successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: preorderDataSchema,
              message: {
                type: "string",
                example: "Preorder release date updated successfully",
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    preorderController.updateReleaseDate.bind(preorderController),
  );

  // Mark preorder customer as notified
  fastify.post<MarkPreorderNotifiedRequest>(
    "/preorders/:orderItemId/notify",
    {
      preHandler: authenticateAdmin,
      schema: {
        description:
          "Mark that the customer has been notified about the preorder availability",
        tags: ["Preorders"],
        summary: "Mark Preorder as Notified",
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
            description: "Preorder marked as notified successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: preorderDataSchema,
              message: {
                type: "string",
                example: "Preorder marked as notified successfully",
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    preorderController.markNotified.bind(preorderController),
  );

  // Delete preorder
  fastify.delete<DeletePreorderRequest>(
    "/preorders/:orderItemId",
    {
      preHandler: authenticateAdmin,
      schema: {
        description: "Delete a preorder",
        tags: ["Preorders"],
        summary: "Delete Preorder",
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
            description: "Preorder deleted successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: {
                type: "string",
                example: "Preorder deleted successfully",
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    preorderController.deletePreorder.bind(preorderController),
  );
}
