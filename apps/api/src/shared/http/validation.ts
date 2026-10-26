import { FastifyRequest, FastifyReply } from "fastify";
import { z, ZodSchema, ZodError } from "zod";
import { serializeError } from "./error-response";
export { paginationQuerySchema } from "../../../../../packages/validation/src/common";
export type { PaginationQuery } from "../../../../../packages/validation/src/common";

/**
 * Convert a Zod schema to a JSON Schema (draft-07) for use in Fastify
 * route schemas — `body`, `params`, `querystring` — and Swagger docs.
 *
 * This is a structural approximation: custom refinements/transforms and
 * asynchronous rules cannot be fully represented. Keep the Zod validation
 * hook; generated schemas alone do not enforce those rules. Hook ordering
 * also matters when Fastify coerces or removes input before Zod runs.
 *
 * @example
 *   fastify.post('/x', {
 *     preHandler: [validateBody(createXSchema)],
 *     schema: { body: toJsonSchema(createXSchema) },
 *   }, ...);
 */
export function toJsonSchema(schema: ZodSchema): object {
  return z.toJSONSchema(schema, { target: "draft-7", unrepresentable: "any" });
}

function validate(schema: ZodSchema, part: "body" | "query" | "params") {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request[part] = await schema.parseAsync(request[part]);
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send(serializeError(error));
      }
      throw error;
    }
  };
}

export function validateBody<T extends ZodSchema>(schema: T) {
  return validate(schema, "body");
}

export function validateQuery<T extends ZodSchema>(schema: T) {
  return validate(schema, "query");
}

export function validateParams<T extends ZodSchema>(schema: T) {
  return validate(schema, "params");
}
