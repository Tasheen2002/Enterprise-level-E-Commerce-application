import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { MediaController } from "../controllers/media.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import { authenticate } from "@/api/src/shared/middleware/authenticate.middleware";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
  toJsonSchema,
} from "../validation/validator";
import {
  successResponse,
  noContentResponse,
} from "@/api/src/shared/http/response-schemas";
import {
  mediaParamsSchema,
  listMediaSchema,
  createMediaSchema,
  updateMediaSchema,
  mediaResponseSchema,
  paginatedMediaResponseSchema,
} from "../validation/media.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const mediaParamsJson = toJsonSchema(mediaParamsSchema);
const listMediaQueryJson = toJsonSchema(listMediaSchema);
const createMediaBodyJson = toJsonSchema(createMediaSchema);
const updateMediaBodyJson = toJsonSchema(updateMediaSchema);

export async function mediaRoutes(
  fastify: FastifyInstance,
  controller: MediaController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // ── Reads ──────────────────────────────────────────────────────────────

  // GET /media — List media assets (Staff+)
  fastify.get(
    "/media",
    {
      preValidation: [validateQuery(listMediaSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get paginated list of media assets with filtering options",
        tags: ["Media"],
        summary: "List Media Assets",
        security: [{ bearerAuth: [] }],
        querystring: listMediaQueryJson,
        response: {
          200: successResponse(paginatedMediaResponseSchema),
        },
      },
    },
    (request, reply) => controller.getMediaAssets(request as AuthenticatedRequest, reply),
  );

  // GET /media/:id — Get media asset by ID (Staff+)
  fastify.get(
    "/media/:id",
    {
      preValidation: [validateParams(mediaParamsSchema)],
      preHandler: [authenticate, RolePermissions.STAFF_LEVEL],
      schema: {
        description: "Get media asset by ID",
        tags: ["Media"],
        summary: "Get Media Asset",
        security: [{ bearerAuth: [] }],
        params: mediaParamsJson,
        response: {
          200: successResponse(mediaResponseSchema),
        },
      },
    },
    (request, reply) => controller.getMediaAsset(request as AuthenticatedRequest, reply),
  );

  // ── Writes ─────────────────────────────────────────────────────────────

  // POST /media — Create media asset (Admin only)
  fastify.post(
    "/media",
    {
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(createMediaSchema)],
      schema: {
        description: "Create a new media asset",
        tags: ["Media"],
        summary: "Create Media Asset",
        security: [{ bearerAuth: [] }],
        body: createMediaBodyJson,
        response: {
          201: successResponse(mediaResponseSchema, 201),
        },
      },
    },
    (request, reply) => controller.createMediaAsset(request as AuthenticatedRequest, reply),
  );

  // PATCH /media/:id — Update media asset (Admin only)
  fastify.patch(
    "/media/:id",
    {
      preValidation: [validateParams(mediaParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY, validateBody(updateMediaSchema)],
      schema: {
        description: "Update an existing media asset",
        tags: ["Media"],
        summary: "Update Media Asset",
        security: [{ bearerAuth: [] }],
        params: mediaParamsJson,
        body: updateMediaBodyJson,
        response: {
          200: successResponse(mediaResponseSchema),
        },
      },
    },
    (request, reply) => controller.updateMediaAsset(request as AuthenticatedRequest, reply),
  );

  // DELETE /media/:id — Delete media asset (Admin only)
  fastify.delete(
    "/media/:id",
    {
      preValidation: [validateParams(mediaParamsSchema)],
      preHandler: [authenticate, RolePermissions.ADMIN_ONLY],
      schema: {
        description: "Delete a media asset",
        tags: ["Media"],
        summary: "Delete Media Asset",
        security: [{ bearerAuth: [] }],
        params: mediaParamsJson,
        response: {
          204: noContentResponse,
        },
      },
    },
    (request, reply) => controller.deleteMediaAsset(request as AuthenticatedRequest, reply),
  );
}
