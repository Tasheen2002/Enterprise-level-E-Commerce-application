import { FastifyInstance } from "fastify";
import {
  WishlistController,
  ReminderController,
  NotificationController,
  AppointmentController,
  ProductReviewController,
  NewsletterController,
} from "./controllers/index.js";
import {
  WishlistManagementService,
  ReminderManagementService,
  NotificationService,
  AppointmentService,
  ProductReviewService,
  NewsletterService,
} from "../../application/services/index.js";
import { authenticateUser } from "../../../user-management/infra/http/middleware/auth.middleware.js";
import { optionalAuth } from "../../../user-management/infra/http/middleware/auth.middleware.js";
import { authenticateAdmin } from "../../../user-management/infra/http/middleware/auth.middleware.js";
import { PrismaClient } from "@prisma/client";

// Common error response schema
const errorResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    error: { type: "string" },
    message: { type: "string" },
    errors: {
      type: "array",
      items: {
        anyOf: [
          { type: "string" },
          {
            type: "object",
            properties: {
              field: { type: "string" },
              message: { type: "string" },
            },
          },
        ],
      },
    },
  },
};

export async function registerEngagementRoutes(
  fastify: FastifyInstance,
  services: {
    wishlistService: WishlistManagementService;
    reminderService: ReminderManagementService;
    notificationService: NotificationService;
    appointmentService: AppointmentService;
    productReviewService: ProductReviewService;
    newsletterService: NewsletterService;
    prisma?: PrismaClient;
  },
) {
  // Check for Prisma availability
  if (!services.prisma) {
    console.error("[Engagement] Prisma client is missing provided services!");
    throw new Error("Prisma client is required for Engagement module");
  }

  // Initialize controllers
  const wishlistController = new WishlistController(
    services.wishlistService,
    services.prisma,
  );
  const reminderController = new ReminderController(services.reminderService);
  const notificationController = new NotificationController(
    services.notificationService,
  );
  const appointmentController = new AppointmentController(
    services.appointmentService,
  );
  const productReviewController = new ProductReviewController(
    services.productReviewService,
  );
  const newsletterController = new NewsletterController(
    services.newsletterService,
  );

  // ============================================================
  // Wishlist Routes
  // ============================================================

  // Create Wishlist
  fastify.post(
    "/engagement/wishlists",
    {
      preHandler: optionalAuth,
      schema: {
        description: "Create a new wishlist",
        tags: ["Engagement - Wishlists"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          properties: {
            userId: {
              type: "string",
              description: "User ID (for authenticated users)",
            },
            guestToken: {
              type: "string",
              description: "Guest token (for guest users)",
            },
            name: { type: "string", description: "Wishlist name" },
            description: {
              type: "string",
              description: "Wishlist description",
            },
            isPublic: {
              type: "boolean",
              description: "Whether the wishlist is public",
            },
            isDefault: {
              type: "boolean",
              description: "Whether this is the default wishlist",
            },
          },
        },
        response: {
          201: {
            description: "Wishlist created successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  wishlistId: { type: "string" },
                  userId: { type: "string" },
                  guestToken: { type: "string" },
                  name: { type: "string" },
                  description: { type: "string" },
                  isPublic: { type: "boolean" },
                  isDefault: { type: "boolean" },
                  createdAt: { type: "string", format: "date-time" },
                },
              },
              message: { type: "string" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    wishlistController.createWishlist.bind(wishlistController) as any,
  );

  // Get Wishlist
  fastify.get(
    "/engagement/wishlists/:wishlistId",
    {
      preHandler: optionalAuth,
      schema: {
        description: "Get a specific wishlist by ID",
        tags: ["Engagement - Wishlists"],
        params: {
          type: "object",
          required: ["wishlistId"],
          properties: {
            wishlistId: { type: "string", description: "Wishlist ID" },
          },
        },
        response: {
          200: {
            description: "Wishlist retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  wishlistId: { type: "string" },
                  userId: { type: "string" },
                  name: { type: "string" },
                  description: { type: "string" },
                  isPublic: { type: "boolean" },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
          404: errorResponseSchema,
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    wishlistController.getWishlist.bind(wishlistController) as any,
  );

  // Get User Wishlists
  fastify.get(
    "/engagement/users/:userId/wishlists",
    {
      preHandler: optionalAuth,
      schema: {
        description: "Get all wishlists for a specific user",
        tags: ["Engagement - Wishlists"],
        params: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string", description: "User ID" },
          },
        },
        querystring: {
          type: "object",
          properties: {
            limit: { type: "string", description: "Maximum number of results" },
            offset: {
              type: "string",
              description: "Number of results to skip",
            },
          },
        },
        response: {
          200: {
            description: "User wishlists retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    wishlistId: { type: "string" },
                    userId: { type: "string" },
                    name: { type: "string" },
                    description: { type: "string" },
                    isPublic: { type: "boolean" },
                    createdAt: { type: "string", format: "date-time" },
                  },
                },
              },
              total: { type: "number" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    wishlistController.getUserWishlists.bind(wishlistController) as any,
  );

  // Get Public Wishlists
  fastify.get(
    "/engagement/wishlists/public",
    {
      schema: {
        description: "Get all public wishlists",
        tags: ["Engagement - Wishlists"],
        querystring: {
          type: "object",
          properties: {
            limit: { type: "string", description: "Maximum number of results" },
            offset: {
              type: "string",
              description: "Number of results to skip",
            },
          },
        },
        response: {
          200: {
            description: "Public wishlists retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    wishlistId: { type: "string" },
                    userId: { type: "string" },
                    name: { type: "string" },
                    description: { type: "string" },
                    isPublic: { type: "boolean" },
                    createdAt: { type: "string", format: "date-time" },
                  },
                },
              },
              total: { type: "number" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    wishlistController.getPublicWishlists.bind(wishlistController) as any,
  );

  // Get Wishlist Items
  fastify.get(
    "/engagement/wishlists/:wishlistId/items",
    {
      preHandler: optionalAuth,
      schema: {
        description: "Get all items in a wishlist",
        tags: ["Engagement - Wishlists"],
        params: {
          type: "object",
          required: ["wishlistId"],
          properties: {
            wishlistId: { type: "string", description: "Wishlist ID" },
          },
        },
        querystring: {
          type: "object",
          properties: {
            limit: { type: "string", description: "Maximum number of results" },
            offset: {
              type: "string",
              description: "Number of results to skip",
            },
          },
        },
        response: {
          200: {
            description: "Wishlist items retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: true, // Allow product and variant objects
                  properties: {
                    wishlistItemId: { type: "string" },
                    wishlistId: { type: "string" },
                    variantId: { type: "string" },
                    priority: { type: "number" },
                    notes: { type: "string" },
                    addedAt: { type: "string", format: "date-time" },
                    product: { type: "object", additionalProperties: true },
                    variant: { type: "object", additionalProperties: true },
                  },
                },
              },
              total: { type: "number" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    wishlistController.getWishlistItems.bind(wishlistController) as any,
  );

  // Add to Wishlist
  fastify.post(
    "/engagement/wishlists/:wishlistId/items",
    {
      preHandler: optionalAuth,
      schema: {
        description: "Add an item to a wishlist",
        security: [{ bearerAuth: [] }],
        tags: ["Engagement - Wishlists"],
        params: {
          type: "object",
          required: ["wishlistId"],
          properties: {
            wishlistId: { type: "string", description: "Wishlist ID" },
          },
        },
        body: {
          type: "object",
          required: ["variantId"],
          properties: {
            variantId: { type: "string", description: "Product variant ID" },
            priority: { type: "number", description: "Item priority (1-5)" },
            notes: { type: "string", description: "Optional notes" },
            guestToken: {
              type: "string",
              description: "Guest token for guest wishlists",
            },
          },
        },
        response: {
          201: {
            description: "Item added to wishlist successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  wishlistItemId: { type: "string" },
                  wishlistId: { type: "string" },
                  variantId: { type: "string" },
                  priority: { type: "number" },
                  notes: { type: "string" },
                  addedAt: { type: "string", format: "date-time" },
                },
              },
              message: { type: "string" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    wishlistController.addToWishlist.bind(wishlistController) as any,
  );

  // Remove from Wishlist
  fastify.delete(
    "/engagement/wishlists/:wishlistId/items/:wishlistItemId",
    {
      preHandler: optionalAuth,
      schema: {
        description: "Remove an item from a wishlist",
        tags: ["Engagement - Wishlists"],
        headers: {
          type: "object",
          properties: {
            authorization: {
              type: "string",
              description: "Bearer token for authenticated users",
            },
            "x-guest-token": {
              type: "string",
              description: "Guest token for guest wishlists",
            },
          },
          additionalProperties: true,
        },
        params: {
          type: "object",
          required: ["wishlistId", "wishlistItemId"],
          properties: {
            wishlistId: { type: "string", description: "Wishlist ID" },
            wishlistItemId: {
              type: "string",
              description: "Variant ID within the wishlist",
            },
          },
        },
        response: {
          200: {
            description: "Item removed from wishlist successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    wishlistController.removeFromWishlist.bind(wishlistController) as any,
  );

  // Update Wishlist
  fastify.patch(
    "/engagement/wishlists/:wishlistId",
    {
      preHandler: optionalAuth,
      schema: {
        description: "Update wishlist details",
        security: [{ bearerAuth: [] }],
        tags: ["Engagement - Wishlists"],
        params: {
          type: "object",
          required: ["wishlistId"],
          properties: {
            wishlistId: { type: "string", description: "Wishlist ID" },
          },
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string", description: "Wishlist name" },
            description: {
              type: "string",
              description: "Wishlist description",
            },
            isPublic: { type: "boolean", description: "Public visibility" },
          },
        },
        response: {
          200: {
            description: "Wishlist updated successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    wishlistController.updateWishlist.bind(wishlistController) as any,
  );

  // Delete Wishlist
  fastify.delete(
    "/engagement/wishlists/:wishlistId",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Delete a wishlist",
        tags: ["Engagement - Wishlists"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["wishlistId"],
          properties: {
            wishlistId: { type: "string", description: "Wishlist ID" },
          },
        },
        response: {
          200: {
            description: "Wishlist deleted successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    wishlistController.deleteWishlist.bind(wishlistController) as any,
  );

  // ============================================================
  // Reminder Routes
  // ============================================================

  // Create Reminder
  fastify.post(
    "/engagement/reminders",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Create a new product reminder",
        tags: ["Engagement - Reminders"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["variantId", "type", "contact", "channel"],
          properties: {
            variantId: { type: "string", description: "Product variant ID" },
            type: {
              type: "string",
              enum: ["back_in_stock", "price_drop", "low_stock"],
              description: "Reminder type",
            },
            contact: {
              type: "string",
              enum: ["email", "phone"],
              description:
                "Contact type (not actual email/phone, just the type)",
            },
            channel: {
              type: "string",
              enum: ["email", "sms", "push", "whatsapp"],
              description: "Contact channel",
            },
            optInAt: {
              type: "string",
              format: "date-time",
              description: "Opt-in timestamp (optional)",
            },
          },
        },
        response: {
          201: {
            description: "Reminder created successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  reminderId: { type: "string" },
                  userId: { type: "string" },
                  variantId: { type: "string" },
                  type: { type: "string" },
                  contactType: { type: "string" },
                  status: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                },
              },
              message: { type: "string" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    reminderController.createReminder.bind(reminderController) as any,
  );

  // Get Reminder
  fastify.get(
    "/engagement/reminders/:reminderId",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Get a specific reminder by ID",
        tags: ["Engagement - Reminders"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["reminderId"],
          properties: {
            reminderId: { type: "string", description: "Reminder ID" },
          },
        },
        response: {
          200: {
            description: "Reminder retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  reminderId: { type: "string" },
                  userId: { type: "string" },
                  variantId: { type: "string" },
                  type: { type: "string" },
                  contactType: { type: "string" },
                  status: { type: "string" },
                  threshold: { type: "number" },
                  createdAt: { type: "string", format: "date-time" },
                  triggeredAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
          404: errorResponseSchema,
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    reminderController.getReminder.bind(reminderController) as any,
  );

  // Get User Reminders
  fastify.get(
    "/engagement/users/:userId/reminders",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Get all reminders for a specific user",
        tags: ["Engagement - Reminders"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string", description: "User ID" },
          },
        },
        querystring: {
          type: "object",
          properties: {
            limit: { type: "string", description: "Maximum number of results" },
            offset: {
              type: "string",
              description: "Number of results to skip",
            },
          },
        },
        response: {
          200: {
            description: "User reminders retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    reminderId: { type: "string" },
                    userId: { type: "string" },
                    variantId: { type: "string" },
                    type: { type: "string" },
                    contactType: { type: "string" },
                    status: { type: "string" },
                    threshold: { type: "number" },
                    createdAt: { type: "string", format: "date-time" },
                  },
                },
              },
              total: { type: "number" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    reminderController.getUserReminders.bind(reminderController) as any,
  );

  // Get Variant Reminders
  fastify.get(
    "/engagement/variants/:variantId/reminders",
    {
      preHandler: authenticateAdmin,
      schema: {
        description: "Get all reminders for a specific product variant",
        tags: ["Engagement - Reminders"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["variantId"],
          properties: {
            variantId: { type: "string", description: "Product variant ID" },
          },
        },
        querystring: {
          type: "object",
          properties: {
            limit: { type: "string", description: "Maximum number of results" },
            offset: {
              type: "string",
              description: "Number of results to skip",
            },
          },
        },
        response: {
          200: {
            description: "Variant reminders retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    reminderId: { type: "string" },
                    userId: { type: "string" },
                    variantId: { type: "string" },
                    type: { type: "string" },
                    contactType: { type: "string" },
                    status: { type: "string" },
                    threshold: { type: "number" },
                    createdAt: { type: "string", format: "date-time" },
                  },
                },
              },
              total: { type: "number" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    reminderController.getVariantReminders.bind(reminderController) as any,
  );

  // Update Reminder Status
  fastify.patch(
    "/engagement/reminders/:reminderId/status",
    {
      preHandler: authenticateAdmin,
      schema: {
        description: "Update reminder status",
        tags: ["Engagement - Reminders"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["reminderId"],
          properties: {
            reminderId: { type: "string", description: "Reminder ID" },
          },
        },
        body: {
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: ["pending", "sent", "unsubscribed"],
              description: "New reminder status",
            },
          },
        },
        response: {
          200: {
            description: "Reminder status updated successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    reminderController.updateReminderStatus.bind(reminderController) as any,
  );

  // Unsubscribe Reminder
  fastify.post(
    "/engagement/reminders/:reminderId/unsubscribe",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Unsubscribe from a reminder",
        tags: ["Engagement - Reminders"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["reminderId"],
          properties: {
            reminderId: { type: "string", description: "Reminder ID" },
          },
        },
        response: {
          200: {
            description: "Unsubscribed from reminder successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    reminderController.unsubscribeReminder.bind(reminderController) as any,
  );

  // Delete Reminder
  fastify.delete(
    "/engagement/reminders/:reminderId",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Delete a reminder",
        tags: ["Engagement - Reminders"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["reminderId"],
          properties: {
            reminderId: { type: "string", description: "Reminder ID" },
          },
        },
        response: {
          200: {
            description: "Reminder deleted successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    reminderController.deleteReminder.bind(reminderController) as any,
  );

  // ============================================================
  // Notification Routes
  // ============================================================

  // Schedule Notification
  fastify.post(
    "/engagement/notifications/schedule",
    {
      preHandler: authenticateAdmin,
      schema: {
        description: "Schedule a notification",
        tags: ["Engagement - Notifications"],
        body: {
          type: "object",
          required: ["type", "scheduledAt"],
          properties: {
            type: {
              type: "string",
              enum: [
                "order_confirm",
                "shipped",
                "restock",
                "review_request",
                "care_guide",
                "promo",
              ],
              description: "Notification type",
            },
            channel: {
              type: "string",
              enum: ["email", "sms", "push", "in_app"],
              description: "Notification channel",
            },
            templateId: { type: "string", description: "Template ID" },
            payload: {
              type: "object",
              description: "Template payload data",
            },
            scheduledAt: {
              type: "string",
              format: "date-time",
              description: "When to send the notification",
            },
          },
        },
        response: {
          201: {
            description: "Notification scheduled successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  notificationId: { type: "string" },
                  type: { type: "string" },
                  channel: { type: "string" },
                  status: { type: "string" },
                  scheduledAt: { type: "string", format: "date-time" },
                  createdAt: { type: "string", format: "date-time" },
                },
              },
              message: { type: "string" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    notificationController.scheduleNotification.bind(
      notificationController,
    ) as any,
  );

  // Send Notification
  fastify.post(
    "/engagement/notifications/:notificationId/send",
    {
      preHandler: authenticateAdmin,
      schema: {
        description: "Send a scheduled notification immediately",
        tags: ["Engagement - Notifications"],
        params: {
          type: "object",
          required: ["notificationId"],
          properties: {
            notificationId: { type: "string", description: "Notification ID" },
          },
        },
        response: {
          200: {
            description: "Notification sent successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    notificationController.sendNotification.bind(notificationController) as any,
  );

  // Get Notification
  fastify.get(
    "/engagement/notifications/:notificationId",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Get a specific notification by ID",
        tags: ["Engagement - Notifications"],
        params: {
          type: "object",
          required: ["notificationId"],
          properties: {
            notificationId: { type: "string", description: "Notification ID" },
          },
        },
        response: {
          200: {
            description: "Notification retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  notificationId: { type: "string" },
                  type: { type: "string" },
                  channel: { type: "string" },
                  status: { type: "string" },
                  templateId: { type: "string" },
                  payload: { type: "object" },
                  scheduledAt: { type: "string", format: "date-time" },
                  sentAt: { type: "string", format: "date-time" },
                  createdAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
          404: errorResponseSchema,
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    notificationController.getNotification.bind(notificationController) as any,
  );

  // Get User Notifications
  fastify.get(
    "/engagement/notifications/type/:type",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Get notifications by type",
        tags: ["Engagement - Notifications"],
        params: {
          type: "object",
          required: ["type"],
          properties: {
            type: { type: "string", description: "Notification type" },
          },
        },
        querystring: {
          type: "object",
          properties: {
            limit: { type: "string", description: "Maximum number of results" },
            offset: {
              type: "string",
              description: "Number of results to skip",
            },
          },
        },
        response: {
          200: {
            description: "Notifications retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    notificationId: { type: "string" },
                    type: { type: "string" },
                    channel: { type: "string" },
                    status: { type: "string" },
                    scheduledAt: { type: "string", format: "date-time" },
                    sentAt: { type: "string", format: "date-time" },
                    createdAt: { type: "string", format: "date-time" },
                  },
                },
              },
              total: { type: "number" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    notificationController.getUserNotifications.bind(
      notificationController,
    ) as any,
  );

  // ============================================================
  // Appointment Routes
  // ============================================================

  // Create Appointment
  fastify.post(
    "/engagement/appointments",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Create a new appointment",
        tags: ["Engagement - Appointments"],
        body: {
          type: "object",
          required: ["userId", "type", "startAt", "endAt"],
          properties: {
            userId: { type: "string", description: "User ID" },
            type: {
              type: "string",
              enum: [
                "consultation",
                "fitting",
                "styling",
                "product_demo",
                "personal_shopping",
              ],
              description: "Appointment type",
            },
            locationId: { type: "string", description: "Store location ID" },
            startAt: {
              type: "string",
              format: "date-time",
              description: "Appointment start time",
            },
            endAt: {
              type: "string",
              format: "date-time",
              description: "Appointment end time",
            },
            notes: { type: "string", description: "Additional notes" },
          },
        },
        response: {
          201: {
            description: "Appointment created successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  appointmentId: { type: "string" },
                  userId: { type: "string" },
                  type: { type: "string" },
                  locationId: { type: "string" },
                  status: { type: "string" },
                  startAt: { type: "string", format: "date-time" },
                  endAt: { type: "string", format: "date-time" },
                  notes: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                },
              },
              message: { type: "string" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    appointmentController.createAppointment.bind(appointmentController) as any,
  );

  // Get Appointment
  fastify.get(
    "/engagement/appointments/:appointmentId",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Get a specific appointment by ID",
        tags: ["Engagement - Appointments"],
        params: {
          type: "object",
          required: ["appointmentId"],
          properties: {
            appointmentId: { type: "string", description: "Appointment ID" },
          },
        },
        response: {
          200: {
            description: "Appointment retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  appointmentId: { type: "string" },
                  userId: { type: "string" },
                  type: { type: "string" },
                  locationId: { type: "string" },
                  status: { type: "string" },
                  startAt: { type: "string", format: "date-time" },
                  endAt: { type: "string", format: "date-time" },
                  notes: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                  cancelledAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
          404: errorResponseSchema,
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    appointmentController.getAppointment.bind(appointmentController) as any,
  );

  // Get User Appointments
  fastify.get(
    "/engagement/users/:userId/appointments",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Get all appointments for a specific user",
        tags: ["Engagement - Appointments"],
        params: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string", description: "User ID" },
          },
        },
        querystring: {
          type: "object",
          properties: {
            limit: { type: "string", description: "Maximum number of results" },
            offset: {
              type: "string",
              description: "Number of results to skip",
            },
          },
        },
        response: {
          200: {
            description: "User appointments retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    appointmentId: { type: "string" },
                    userId: { type: "string" },
                    type: { type: "string" },
                    locationId: { type: "string" },
                    status: { type: "string" },
                    startAt: { type: "string", format: "date-time" },
                    endAt: { type: "string", format: "date-time" },
                    notes: { type: "string" },
                    createdAt: { type: "string", format: "date-time" },
                  },
                },
              },
              total: { type: "number" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    appointmentController.getUserAppointments.bind(
      appointmentController,
    ) as any,
  );

  // Get Location Appointments
  fastify.get(
    "/engagement/locations/:locationId/appointments",
    {
      preHandler: authenticateAdmin,
      schema: {
        description: "Get all appointments for a specific location",
        tags: ["Engagement - Appointments"],
        params: {
          type: "object",
          required: ["locationId"],
          properties: {
            locationId: { type: "string", description: "Location ID" },
          },
        },
        querystring: {
          type: "object",
          properties: {
            limit: { type: "string", description: "Maximum number of results" },
            offset: {
              type: "string",
              description: "Number of results to skip",
            },
          },
        },
        response: {
          200: {
            description: "Location appointments retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    appointmentId: { type: "string" },
                    userId: { type: "string" },
                    type: { type: "string" },
                    locationId: { type: "string" },
                    status: { type: "string" },
                    startAt: { type: "string", format: "date-time" },
                    endAt: { type: "string", format: "date-time" },
                    notes: { type: "string" },
                    createdAt: { type: "string", format: "date-time" },
                  },
                },
              },
              total: { type: "number" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    appointmentController.getLocationAppointments.bind(
      appointmentController,
    ) as any,
  );

  // Update Appointment
  fastify.patch(
    "/engagement/appointments/:appointmentId",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Update appointment details",
        tags: ["Engagement - Appointments"],
        params: {
          type: "object",
          required: ["appointmentId"],
          properties: {
            appointmentId: { type: "string", description: "Appointment ID" },
          },
        },
        body: {
          type: "object",
          properties: {
            startAt: { type: "string", format: "date-time" },
            endAt: { type: "string", format: "date-time" },
            notes: { type: "string" },
            locationId: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Appointment updated successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    appointmentController.updateAppointment.bind(appointmentController) as any,
  );

  // Cancel Appointment
  fastify.post(
    "/engagement/appointments/:appointmentId/cancel",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Cancel an appointment",
        tags: ["Engagement - Appointments"],
        params: {
          type: "object",
          required: ["appointmentId"],
          properties: {
            appointmentId: { type: "string", description: "Appointment ID" },
          },
        },
        response: {
          200: {
            description: "Appointment cancelled successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    appointmentController.cancelAppointment.bind(appointmentController) as any,
  );

  // ============================================================
  // Product Review Routes
  // ============================================================

  // Create Product Review
  fastify.post(
    "/engagement/reviews",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Create a new product review",
        tags: ["Engagement - Reviews"],
        body: {
          type: "object",
          required: ["productId", "userId", "rating"],
          properties: {
            productId: { type: "string", description: "Product ID" },
            userId: { type: "string", description: "User ID" },
            rating: {
              type: "number",
              minimum: 1,
              maximum: 5,
              description: "Rating (1-5 stars)",
            },
            title: { type: "string", description: "Review title" },
            body: { type: "string", description: "Review content" },
          },
        },
        response: {
          201: {
            description: "Product review created successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  reviewId: { type: "string" },
                  productId: { type: "string" },
                  userId: { type: "string" },
                  rating: { type: "number" },
                  title: { type: "string" },
                  body: { type: "string" },
                  status: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                },
              },
              message: { type: "string" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    productReviewController.createReview.bind(productReviewController) as any,
  );

  // Get Product Review
  fastify.get(
    "/engagement/reviews/:reviewId",
    {
      schema: {
        description: "Get a specific product review by ID",
        tags: ["Engagement - Reviews"],
        params: {
          type: "object",
          required: ["reviewId"],
          properties: {
            reviewId: { type: "string", description: "Review ID" },
          },
        },
        response: {
          200: {
            description: "Product review retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  reviewId: { type: "string" },
                  productId: { type: "string" },
                  userId: { type: "string" },
                  rating: { type: "number" },
                  title: { type: "string" },
                  body: { type: "string" },
                  status: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
          404: errorResponseSchema,
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    productReviewController.getReview.bind(productReviewController) as any,
  );

  // Get Product Reviews
  fastify.get(
    "/engagement/products/:productId/reviews",
    {
      schema: {
        description: "Get all reviews for a specific product",
        tags: ["Engagement - Reviews"],
        params: {
          type: "object",
          required: ["productId"],
          properties: {
            productId: { type: "string", description: "Product ID" },
          },
        },
        querystring: {
          type: "object",
          properties: {
            limit: { type: "string", description: "Maximum number of results" },
            offset: {
              type: "string",
              description: "Number of results to skip",
            },
          },
        },
        response: {
          200: {
            description: "Product reviews retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    reviewId: { type: "string" },
                    productId: { type: "string" },
                    userId: { type: "string" },
                    rating: { type: "number" },
                    title: { type: "string" },
                    body: { type: "string" },
                    status: { type: "string" },
                    createdAt: { type: "string", format: "date-time" },
                  },
                },
              },
              total: { type: "number" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    productReviewController.getProductReviews.bind(
      productReviewController,
    ) as any,
  );

  // Get User Reviews
  fastify.get(
    "/engagement/users/:userId/reviews",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Get all reviews by a specific user",
        tags: ["Engagement - Reviews"],
        params: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string", description: "User ID" },
          },
        },
        querystring: {
          type: "object",
          properties: {
            limit: { type: "string", description: "Maximum number of results" },
            offset: {
              type: "string",
              description: "Number of results to skip",
            },
          },
        },
        response: {
          200: {
            description: "User reviews retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    reviewId: { type: "string" },
                    productId: { type: "string" },
                    userId: { type: "string" },
                    rating: { type: "number" },
                    title: { type: "string" },
                    body: { type: "string" },
                    status: { type: "string" },
                    createdAt: { type: "string", format: "date-time" },
                  },
                },
              },
              total: { type: "number" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    productReviewController.getUserReviews.bind(productReviewController) as any,
  );

  // Update Review Status
  fastify.patch(
    "/engagement/reviews/:reviewId/status",
    {
      preHandler: authenticateAdmin,
      schema: {
        description: "Update product review status (admin only)",
        tags: ["Engagement - Reviews"],
        params: {
          type: "object",
          required: ["reviewId"],
          properties: {
            reviewId: { type: "string", description: "Review ID" },
          },
        },
        body: {
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: ["approved", "rejected", "flagged"],
              description: "New review status",
            },
          },
        },
        response: {
          200: {
            description: "Review status updated successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    productReviewController.updateReviewStatus.bind(
      productReviewController,
    ) as any,
  );

  // Delete Product Review
  fastify.delete(
    "/engagement/reviews/:reviewId",
    {
      preHandler: authenticateUser,
      schema: {
        description: "Delete a product review",
        tags: ["Engagement - Reviews"],
        params: {
          type: "object",
          required: ["reviewId"],
          properties: {
            reviewId: { type: "string", description: "Review ID" },
          },
        },
        response: {
          200: {
            description: "Product review deleted successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    productReviewController.deleteReview.bind(productReviewController) as any,
  );

  // ============================================================
  // Newsletter Routes
  // ============================================================

  // Subscribe to Newsletter
  fastify.post(
    "/engagement/newsletter/subscribe",
    {
      schema: {
        description: "Subscribe to newsletter",
        tags: ["Engagement - Newsletter"],
        body: {
          type: "object",
          required: ["email"],
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "Email address",
            },
            source: { type: "string", description: "Subscription source" },
          },
        },
        response: {
          201: {
            description: "Subscribed to newsletter successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  subscriptionId: { type: "string" },
                  email: { type: "string" },
                  status: { type: "string" },
                  source: { type: "string" },
                  subscribedAt: { type: "string", format: "date-time" },
                },
              },
              message: { type: "string" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    newsletterController.subscribe.bind(newsletterController) as any,
  );

  // Unsubscribe from Newsletter
  fastify.post(
    "/engagement/newsletter/unsubscribe",
    {
      schema: {
        description: "Unsubscribe from newsletter",
        tags: ["Engagement - Newsletter"],
        body: {
          type: "object",
          properties: {
            subscriptionId: { type: "string", description: "Subscription ID" },
            email: {
              type: "string",
              format: "email",
              description: "Email address",
            },
          },
        },
        response: {
          200: {
            description: "Unsubscribed from newsletter successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    newsletterController.unsubscribe.bind(newsletterController) as any,
  );

  // Unsubscribe from Newsletter (Link)
  fastify.get(
    "/engagement/newsletter/unsubscribe",
    {
      schema: {
        description: "Unsubscribe from newsletter via link",
        tags: ["Engagement - Newsletter"],
        querystring: {
          type: "object",
          required: ["email"],
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "Email address",
            },
          },
        },
        response: {
          200: {
            description: "HTML confirmation page",
            type: "string",
          },
        },
      },
    },
    newsletterController.unsubscribeViaLink.bind(newsletterController) as any,
  );

  // Get Newsletter Subscription
  fastify.get(
    "/engagement/newsletter/subscription",
    {
      schema: {
        description: "Get newsletter subscription by ID or email",
        tags: ["Engagement - Newsletter"],
        querystring: {
          type: "object",
          properties: {
            subscriptionId: { type: "string", description: "Subscription ID" },
            email: {
              type: "string",
              format: "email",
              description: "Email address",
            },
          },
        },
        response: {
          200: {
            description: "Newsletter subscription retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  subscriptionId: { type: "string" },
                  email: { type: "string" },
                  status: { type: "string" },
                  source: { type: "string" },
                  subscribedAt: { type: "string", format: "date-time" },
                  unsubscribedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
          404: errorResponseSchema,
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    newsletterController.getSubscription.bind(newsletterController) as any,
  );
}
