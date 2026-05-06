import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  createRateLimiter,
  RateLimitPresets,
  userOrIpKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import {
  successResponse,
  actionSuccessResponse,
} from "@/api/src/shared/http/response-schemas";
import { NewsletterController } from "../controllers/newsletter.controller";
import { validateBody, validateQuery, toJsonSchema } from "../validation/validator";
import {
  subscribeNewsletterSchema,
  unsubscribeNewsletterSchema,
  unsubscribeViaLinkSchema,
  getSubscriptionQuerySchema,
  newsletterSubscriptionResponseSchema,
} from "../validation/newsletter.schema";

// Pre-compute JSON Schemas from Zod (single source of truth — no drift).
const subscribeNewsletterBodyJson = toJsonSchema(subscribeNewsletterSchema);
const unsubscribeNewsletterBodyJson = toJsonSchema(unsubscribeNewsletterSchema);
const unsubscribeViaLinkQueryJson = toJsonSchema(unsubscribeViaLinkSchema);
const getSubscriptionQueryJson = toJsonSchema(getSubscriptionQuerySchema);

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userOrIpKeyGenerator,
});

export async function newsletterRoutes(
  fastify: FastifyInstance,
  controller: NewsletterController,
): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // GET /engagement/newsletter/unsubscribe — Unsubscribe via link (public)
  // Returns an HTML confirmation page directly — intentionally NOT using
  // the JSON envelope helpers.
  fastify.get(
    "/engagement/newsletter/unsubscribe",
    {
      preValidation: [validateQuery(unsubscribeViaLinkSchema)],
      schema: {
        description: "Unsubscribe from newsletter via link",
        summary: "Unsubscribe Via Link",
        tags: ["Engagement - Newsletter"],
        querystring: unsubscribeViaLinkQueryJson,
        response: {
          200: {
            description: "HTML confirmation page",
            type: "string",
          },
        },
      },
    },
    (request, reply) => controller.unsubscribeViaLink(request as AuthenticatedRequest, reply),
  );

  // GET /engagement/newsletter/subscription — Get newsletter subscription (public)
  fastify.get(
    "/engagement/newsletter/subscription",
    {
      preValidation: [validateQuery(getSubscriptionQuerySchema)],
      schema: {
        description: "Get newsletter subscription by ID or email",
        summary: "Get Newsletter Subscription",
        tags: ["Engagement - Newsletter"],
        querystring: getSubscriptionQueryJson,
        response: {
          200: successResponse(newsletterSubscriptionResponseSchema),
        },
      },
    },
    (request, reply) => controller.getSubscription(request as AuthenticatedRequest, reply),
  );

  // POST /engagement/newsletter/subscribe — Subscribe to newsletter (public)
  fastify.post(
    "/engagement/newsletter/subscribe",
    {
      preValidation: [validateBody(subscribeNewsletterSchema)],
      schema: {
        description: "Subscribe to newsletter",
        summary: "Subscribe To Newsletter",
        tags: ["Engagement - Newsletter"],
        body: subscribeNewsletterBodyJson,
        response: {
          201: successResponse(newsletterSubscriptionResponseSchema, 201),
        },
      },
    },
    (request, reply) => controller.subscribe(request as AuthenticatedRequest, reply),
  );

  // POST /engagement/newsletter/unsubscribe — Unsubscribe from newsletter (public)
  fastify.post(
    "/engagement/newsletter/unsubscribe",
    {
      preValidation: [validateBody(unsubscribeNewsletterSchema)],
      schema: {
        description: "Unsubscribe from newsletter",
        summary: "Unsubscribe From Newsletter",
        tags: ["Engagement - Newsletter"],
        body: unsubscribeNewsletterBodyJson,
        response: {
          200: actionSuccessResponse(),
        },
      },
    },
    (request, reply) => controller.unsubscribe(request as AuthenticatedRequest, reply),
  );
}
