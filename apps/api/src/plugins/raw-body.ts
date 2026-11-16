import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";

/**
 * Signature verification (e.g. Stripe webhooks) must hash the exact bytes
 * received, not a re-serialised object. Routes opt in with
 * `config: { rawBody: true }` and then receive `request.rawBody`.
 *
 * This replaces Fastify's default JSON parser with the same parser obtained
 * from Fastify itself (prototype/constructor poisoning rejected, empty bodies
 * rejected, body limit unchanged); it only additionally keeps the buffer on
 * opted-in routes.
 */
const rawBodyPlugin: FastifyPluginAsync = async (fastify) => {
  const parseJson = fastify.getDefaultJsonParser("error", "error");
  fastify.addContentTypeParser("application/json", { parseAs: "buffer" }, (request, body, done) => {
    if (request.routeOptions.config.rawBody) request.rawBody = body as Buffer;
    // Same input type as the default parser (UTF-8 string, which parseAs "string" produces).
    parseJson(request, (body as Buffer).toString("utf8"), done);
  });
};

export default fp(rawBodyPlugin, { name: "raw-body" });
