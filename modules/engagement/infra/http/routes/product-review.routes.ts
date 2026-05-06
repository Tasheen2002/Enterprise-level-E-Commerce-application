import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userOrIpKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import {
  successResponse,
  actionSuccessResponse,
  noContentResponse,
  paginatedResponse,
} from "@/api/src/shared/http/response-schemas";
import { ProductReviewController } from "../controllers/product-review.controller";
import {
  validateBody,
  validateParams,
  validateQuery,
  toJsonSchema,
} from "../validation/validator";
import {
  reviewIdParamsSchema,
  productIdParamsSchema,
  userIdParamsSchema,
  paginationQuerySchema,
  createProductReviewSchema,
  updateReviewStatusSchema,
  productReviewResponseSchema,
} from "../validation/product-review.schema";

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const reviewIdParamsJson = toJsonSchema(reviewIdParamsSchema);
const productIdParamsJson = toJsonSchema(productIdParamsSchema);
const userIdParamsJson = toJsonSchema(userIdParamsSchema);
const paginationQueryJson = toJsonSchema(paginationQuerySchema);
const createProductReviewBodyJson = toJsonSchema(createProductReviewSchema);
const updateReviewStatusBodyJson = toJsonSchema(updateReviewStatusSchema);

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userOrIpKeyGenerator,
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
        params: reviewIdParamsJson,
        response: {
          200: successResponse(productReviewResponseSchema),
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
        params: productIdParamsJson,
        querystring: paginationQueryJson,
        response: {
          200: successResponse(paginatedResponse(productReviewResponseSchema)),
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
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        description: "Get all reviews by a specific user",
        summary: "Get User Reviews",
        tags: ["Engagement - Reviews"],
        security: [{ bearerAuth: [] }],
        params: userIdParamsJson,
        querystring: paginationQueryJson,
        response: {
          200: successResponse(paginatedResponse(productReviewResponseSchema)),
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
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        description: "Create a new product review",
        summary: "Create Product Review",
        tags: ["Engagement - Reviews"],
        security: [{ bearerAuth: [] }],
        body: createProductReviewBodyJson,
        response: {
          201: successResponse(productReviewResponseSchema, 201),
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
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Update product review status (admin only)",
        summary: "Update Review Status",
        tags: ["Engagement - Reviews"],
        security: [{ bearerAuth: [] }],
        params: reviewIdParamsJson,
        body: updateReviewStatusBodyJson,
        response: {
          200: actionSuccessResponse(),
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
      preHandler: [authenticate, RolePermissions.AUTHENTICATED],
      schema: {
        description: "Delete a product review",
        summary: "Delete Product Review",
        tags: ["Engagement - Reviews"],
        security: [{ bearerAuth: [] }],
        params: reviewIdParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) => controller.deleteReview(request as AuthenticatedRequest, reply),
  );
}
