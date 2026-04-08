import { FastifyInstance } from "fastify";
import {
  OrderShipmentController,
  CreateShipmentRequest,
  GetShipmentsRequest,
  GetShipmentRequest,
  MarkShippedRequest,
  UpdateTrackingRequest,
  MarkDeliveredRequest,
} from "../controllers/order-shipment.controller";
import { authenticateUser, RolePermissions } from "@/api/src/shared/middleware";

const authenticateStaff = [authenticateUser, RolePermissions.STAFF_LEVEL];

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

const shipmentDataSchema = {
  type: "object",
  additionalProperties: true,
  properties: {
    shipmentId: { type: "string", format: "uuid" },
    orderId: { type: "string", format: "uuid" },
    carrier: { type: "string" },
    service: { type: "string" },
    trackingNumber: { type: "string" },
    giftReceipt: { type: "boolean" },
    pickupLocationId: { type: "string", format: "uuid" },
    shippedAt: { type: "string", format: "date-time", nullable: true },
    deliveredAt: { type: "string", format: "date-time", nullable: true },
    isShipped: { type: "boolean" },
    isDelivered: { type: "boolean" },
  },
};

export async function registerOrderShipmentRoutes(
  fastify: FastifyInstance,
  orderShipmentController: OrderShipmentController,
): Promise<void> {
  // Create shipment for an order
  fastify.post<CreateShipmentRequest>(
    "/orders/:orderId/shipments",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Create a new shipment for an order",
        tags: ["Order Shipments"],
        summary: "Create Shipment",
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
          properties: {
            carrier: {
              type: "string",
              description: "Carrier name (e.g., FedEx, UPS)",
            },
            service: {
              type: "string",
              description: "Service type (e.g., Express, Ground)",
            },
            trackingNumber: { type: "string", description: "Tracking number" },
            giftReceipt: {
              type: "boolean",
              default: false,
              description: "Include gift receipt",
            },
            pickupLocationId: {
              type: "string",
              format: "uuid",
              description: "Pickup location ID",
            },
          },
        },
        response: {
          201: {
            description: "Shipment created successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: shipmentDataSchema,
              message: {
                type: "string",
                example: "Shipment created successfully",
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    orderShipmentController.createShipment.bind(orderShipmentController),
  );

  // Get all shipments for an order
  fastify.get<GetShipmentsRequest>(
    "/orders/:orderId/shipments",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Get all shipments for an order",
        tags: ["Order Shipments"],
        summary: "Get Order Shipments",
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
            description: "Shipments retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "array",
                items: { type: "object", additionalProperties: true },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    orderShipmentController.getShipments.bind(orderShipmentController),
  );

  // Get single shipment
  fastify.get<GetShipmentRequest>(
    "/orders/:orderId/shipments/:shipmentId",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Get a specific shipment by ID",
        tags: ["Order Shipments"],
        summary: "Get Shipment",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            orderId: { type: "string", format: "uuid" },
            shipmentId: { type: "string", format: "uuid" },
          },
          required: ["orderId", "shipmentId"],
        },
        response: {
          200: {
            description: "Shipment retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
            },
          },
          ...errorResponses,
        },
      },
    },
    orderShipmentController.getShipment.bind(orderShipmentController),
  );

  // Mark shipment as shipped
  fastify.post<MarkShippedRequest>(
    "/orders/:orderId/shipments/:shipmentId/mark-shipped",
    {
      preHandler: authenticateUser,
      schema: {
        description:
          "Mark a shipment as shipped with carrier and tracking details (User/Staff/Admin)",
        tags: ["Order Shipments"],
        summary: "Mark Shipment as Shipped",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            orderId: { type: "string", format: "uuid" },
            shipmentId: { type: "string", format: "uuid" },
          },
          required: ["orderId", "shipmentId"],
        },
        body: {
          type: "object",
          required: ["carrier", "service", "trackingNumber"],
          properties: {
            carrier: { type: "string", description: "Carrier name" },
            service: { type: "string", description: "Service type" },
            trackingNumber: { type: "string", description: "Tracking number" },
          },
        },
        response: {
          200: {
            description: "Shipment marked as shipped successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
              message: {
                type: "string",
                example: "Shipment marked as shipped successfully",
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    orderShipmentController.markShipped.bind(orderShipmentController),
  );

  // Update shipment tracking
  fastify.patch<UpdateTrackingRequest>(
    "/orders/:orderId/shipments/:shipmentId/tracking",
    {
      preHandler: authenticateStaff,
      schema: {
        description: "Update shipment tracking information (Staff/Admin only)",
        tags: ["Order Shipments"],
        summary: "Update Shipment Tracking",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            orderId: { type: "string", format: "uuid" },
            shipmentId: { type: "string", format: "uuid" },
          },
          required: ["orderId", "shipmentId"],
        },
        body: {
          type: "object",
          required: ["trackingNumber"],
          properties: {
            trackingNumber: {
              type: "string",
              description: "New tracking number",
            },
            carrier: { type: "string", description: "Carrier name" },
            service: { type: "string", description: "Service type" },
          },
        },
        response: {
          200: {
            description: "Tracking information updated successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
              message: {
                type: "string",
                example: "Shipment tracking updated successfully",
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    orderShipmentController.updateTracking.bind(orderShipmentController),
  );

  // Mark shipment as delivered
  fastify.post<MarkDeliveredRequest>(
    "/orders/:orderId/shipments/:shipmentId/mark-delivered",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Mark a shipment as delivered (Staff/Admin only)",
        tags: ["Order Shipments"],
        summary: "Mark Shipment as Delivered",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            orderId: { type: "string", format: "uuid" },
            shipmentId: { type: "string", format: "uuid" },
          },
          required: ["orderId", "shipmentId"],
        },
        body: {
          type: "object",
          properties: {
            deliveredAt: {
              type: "string",
              format: "date-time",
              description: "Delivery timestamp (defaults to now)",
            },
          },
        },
        response: {
          200: {
            description: "Shipment marked as delivered successfully",
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
              message: {
                type: "string",
                example: "Shipment marked as delivered successfully",
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    orderShipmentController.markDelivered.bind(orderShipmentController),
  );
}
