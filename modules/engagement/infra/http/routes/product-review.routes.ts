import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { ProductReviewController } from "../controllers/product-review.controller";
import { validateBody, validateParams, validateQuery } from "../validation/validator";
import {
  reviewIdParamsSchema,
  productIdParamsSchema,
  userIdParamsSchema,
  paginationQuerySchema,
  createProductReviewSchema,
  updateReviewStatusSchema,
  productReviewResponseSchema,
} from "../validation/product-review.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

export async function productReviewRoutes(
  fastify: FastifyInstance,
  controller: ProductReviewController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // GET /engagement/reviews/:reviewId — Get product review (public)
  fastify.get(
    "/engagement/reviews/:reviewId",
    {
      preValidation: [validateParams(reviewIdParamsSchema)],
      schema: {
        description: "Get a specific product review by ID",
        summary: "Get Product Review",
        tags: ["Engagement - Reviews"],
        params: {
          type: "object",
          required: ["reviewId"],
          properties: {
            reviewId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: productReviewResponseSchema,
            },
          },
        },
      },
    },
    (request, reply) => controller.getReview(request as AuthenticatedRequest, reply),
  );

  // GET /engagement/products/:productId/reviews — Get product reviews (public)
  fastify.get(
    "/engagement/products/:productId/reviews",
    {
      preValidation: [validateParams(productIdParamsSchema), validateQuery(paginationQuerySchema)],
      schema: {
        description: "Get all reviews for a specific product",
        summary: "Get Product Reviews",
        tags: ["Engagement - Reviews"],
        params: {
          type: "object",
          required: ["productId"],
          properties: {
            productId: { type: "string", format: "uuid" },
          },
        },
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1 },
            offset: { type: "integer", minimum: 0 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array", items: productReviewResponseSchema },
              total: { type: "number" },
            },
          },
        },
      },
    },
    (request, reply) => controller.getProductReviews(request as AuthenticatedRequest, reply),
  );

  // GET /engagement/users/:userId/reviews — Get user reviews
  fastify.get(
    "/engagement/users/:userId/reviews",
    {
      preValidation: [validateParams(userIdParamsSchema), validateQuery(paginationQuerySchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        description: "Get all reviews by a specific user",
        summary: "Get User Reviews",
        tags: ["Engagement - Reviews"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string", format: "uuid" },
          },
        },
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1 },
            offset: { type: "integer", minimum: 0 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array", items: productReviewResponseSchema },
              total: { type: "number" },
            },
          },
        },
      },
    },
    (request, reply) => controller.getUserReviews(request as AuthenticatedRequest, reply),
  );

  // POST /engagement/reviews — Create product review
  fastify.post(
    "/engagement/reviews",
    {
      preValidation: [validateBody(createProductReviewSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        description: "Create a new product review",
        summary: "Create Product Review",
        tags: ["Engagement - Reviews"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["productId", "userId", "rating", "title", "body"],
          properties: {
            productId: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            rating: { type: "integer", minimum: 1, maximum: 5 },
            title: { type: "string", minLength: 1, maxLength: 255 },
            body: { type: "string", minLength: 1, maxLength: 5000 },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: productReviewResponseSchema,
              message: { type: "string" },
            },
          },
        },
      },
    },
    (request, reply) => controller.createReview(request as AuthenticatedRequest, reply),
  );

  // PATCH /engagement/reviews/:reviewId/status — Update review status (admin)
  fastify.patch(
    "/engagement/reviews/:reviewId/status",
    {
      preValidation: [validateParams(reviewIdParamsSchema), validateBody(updateReviewStatusSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Update product review status (admin only)",
        summary: "Update Review Status",
        tags: ["Engagement - Reviews"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["reviewId"],
          properties: {
            reviewId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["approved", "rejected", "flagged"] },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    (request, reply) => controller.updateReviewStatus(request as AuthenticatedRequest, reply),
  );

  // DELETE /engagement/reviews/:reviewId — Delete product review
  fastify.delete(
    "/engagement/reviews/:reviewId",
    {
      preValidation: [validateParams(reviewIdParamsSchema)],
      preHandler: [RolePermissions.AUTHENTICATED],
      schema: {
        description: "Delete a product review",
        summary: "Delete Product Review",
        tags: ["Engagement - Reviews"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["reviewId"],
          properties: {
            reviewId: { type: "string", format: "uuid" },
          },
        },
        response: {
          204: { description: "Product review deleted successfully", type: "null" },
        },
      },
    },
    (request, reply) => controller.deleteReview(request as AuthenticatedRequest, reply),
  );
}
