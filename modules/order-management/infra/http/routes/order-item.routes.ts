import { FastifyInstance } from "fastify";
import { OrderItemController } from "../controllers/order-item.controller";
import { authenticateUser } from "@/api/src/shared/middleware";

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

const orderItemSchema = {
  type: "object",
  properties: {
    orderItemId: { type: "string", format: "uuid" },
    orderId: { type: "string", format: "uuid" },
    variantId: { type: "string", format: "uuid" },
    quantity: { type: "integer", minimum: 1 },
    productSnapshot: {
      type: "object",
      properties: {
        productId: { type: "string", format: "uuid" },
        variantId: { type: "string", format: "uuid" },
        sku: { type: "string" },
        name: { type: "string" },
        variantName: { type: "string" },
        price: { type: "number" },
        imageUrl: { type: "string" },
        weight: { type: "number" },
        dimensions: { type: "object" },
        attributes: { type: "object" },
      },
    },
    isGift: { type: "boolean" },
    giftMessage: { type: "string", nullable: true },
    subtotal: { type: "number" },
  },
};

export async function registerOrderItemRoutes(
  fastify: FastifyInstance,
  orderItemController: OrderItemController,
): Promise<void> {
  // Add item to order
  fastify.post(
    "/orders/:orderId/items",
    {
      preHandler: authenticateUser,
      schema: {
        description:
          "Add an item to an existing order. Order must be in 'created' status. Product details are automatically fetched from the database.",
        tags: ["Order Items"],
        summary: "Add Order Item",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            orderId: { type: "string", format: "uuid" },
          },
          required: ["orderId"],
        },
        body: {
          type: "object",
          required: ["variantId", "quantity"],
          properties: {
            variantId: {
              type: "string",
              format: "uuid",
              description: "Product variant ID",
            },
            quantity: {
              type: "integer",
              minimum: 1,
              description: "Quantity of items",
            },
            isGift: {
              type: "boolean",
              default: false,
              description: "Whether this item is a gift",
            },
            giftMessage: {
              type: "string",
              maxLength: 500,
              description: "Gift message (if isGift is true)",
            },
          },
        },
        response: {
          201: {
            description: "Item added successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string", example: "Item added successfully" },
            },
          },
          ...errorResponses,
        },
      },
    },
    orderItemController.addItem.bind(orderItemController) as any,
  );

  // Get all items for an order
  fastify.get(
    "/orders/:orderId/items",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Get all items for a specific order",
        tags: ["Order Items"],
        summary: "Get Order Items",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            orderId: { type: "string", format: "uuid" },
          },
          required: ["orderId"],
        },
        response: {
          200: {
            description: "Order items retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "array",
                items: orderItemSchema,
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    orderItemController.getItems.bind(orderItemController) as any,
  );

  // Get single order item by ID
  fastify.get(
    "/items/:itemId",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Get a specific order item by its ID",
        tags: ["Order Items"],
        summary: "Get Order Item",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            itemId: { type: "string", format: "uuid" },
          },
          required: ["itemId"],
        },
        response: {
          200: {
            description: "Order item retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: orderItemSchema,
            },
          },
          ...errorResponses,
        },
      },
    },
    orderItemController.getItem.bind(orderItemController) as any,
  );

  // Update order item
  fastify.patch(
    "/orders/:orderId/items/:itemId",
    {
      preHandler: authenticateUser,
      schema: {
        description:
          "Update an order item. Can update quantity and/or gift status. Order must be in 'created' status.",
        tags: ["Order Items"],
        summary: "Update Order Item",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            orderId: { type: "string", format: "uuid" },
            itemId: { type: "string", format: "uuid" },
          },
          required: ["orderId", "itemId"],
        },
        body: {
          type: "object",
          properties: {
            quantity: {
              type: "integer",
              minimum: 1,
              description: "New quantity",
            },
            isGift: {
              type: "boolean",
              description: "Whether this item is a gift",
            },
            giftMessage: {
              type: "string",
              maxLength: 500,
              description: "Gift message",
            },
          },
        },
        response: {
          200: {
            description: "Item updated successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string", example: "Item updated successfully" },
            },
          },
          ...errorResponses,
        },
      },
    },
    orderItemController.updateItem.bind(orderItemController) as any,
  );

  // Remove item from order
  fastify.delete(
    "/orders/:orderId/items/:itemId",
    {
      preHandler: authenticateUser,
      schema: {
        description:
          "Remove an item from an order. Order must be in 'created' status and must have at least one other item.",
        tags: ["Order Items"],
        summary: "Remove Order Item",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            orderId: { type: "string", format: "uuid" },
            itemId: { type: "string", format: "uuid" },
          },
          required: ["orderId", "itemId"],
        },
        response: {
          200: {
            description: "Item removed successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: {
                type: "string",
                example: "Item removed successfully",
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    orderItemController.removeItem.bind(orderItemController) as any,
  );
}
