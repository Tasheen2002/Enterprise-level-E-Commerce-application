import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  createRateLimiter,
  RateLimitPresets,
  userKeyGenerator,
} from "@/api/src/shared/middleware/rate-limiter.middleware";
import { NewsletterController } from "../controllers/newsletter.controller";
import { validateBody, validateQuery } from "../validation/validator";
import {
  subscribeNewsletterSchema,
  unsubscribeNewsletterSchema,
  unsubscribeViaLinkSchema,
  getSubscriptionQuerySchema,
  newsletterSubscriptionResponseSchema,
} from "../validation/newsletter.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
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
  fastify.get(
    "/engagement/newsletter/unsubscribe",
    {
      preValidation: [validateQuery(unsubscribeViaLinkSchema)],
      schema: {
        description: "Unsubscribe from newsletter via link",
        summary: "Unsubscribe Via Link",
        tags: ["Engagement - Newsletter"],
        querystring: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", format: "email" },
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
        querystring: {
          type: "object",
          properties: {
            subscriptionId: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: newsletterSubscriptionResponseSchema,
            },
          },
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
        body: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", format: "email" },
            source: { type: "string" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: newsletterSubscriptionResponseSchema,
              message: { type: "string" },
            },
          },
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
        body: {
          type: "object",
          properties: {
            subscriptionId: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
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
    (request, reply) => controller.unsubscribe(request as AuthenticatedRequest, reply),
  );
}
