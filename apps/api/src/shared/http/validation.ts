import { FastifyRequest, FastifyReply } from "fastify";
import { z, ZodSchema, ZodError } from "zod";
import { serializeError } from "./error-response";
export { paginationQuerySchema } from "../../../../../packages/validation/src/common";
export type { PaginationQuery } from "../../../../../packages/validation/src/common";

/**
 * Convert a Zod schema to a JSON Schema (draft-07) for use in Fastify
 * route schemas — `body`, `params`, `querystring` — and Swagger docs.
 *
 * Lets Zod be the single source of truth; eliminates manually maintaining
 * parallel inline JSON-Schema definitions in route files.
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

/**
 * Canonical pagination query schema. Use this directly for endpoints that
 * accept only `limit` and `offset`, or extend it for endpoints with
 * additional filters:
 *
 * @example
 *   const listX = paginationQuerySchema.extend({ status: z.enum(...) });
 *
 * Coerces query-string values (always strings on the wire) into numbers.
 */

export function validateBody<T extends ZodSchema>(schema: T) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.body = schema.parse(request.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send(serializeError(error));
      }
      throw error;
    }
  };
}

export function validateQuery<T extends ZodSchema>(schema: T) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.query = schema.parse(request.query);
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send(serializeError(error));
      }
      throw error;
    }
  };
}

export function validateParams<T extends ZodSchema>(schema: T) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.params = schema.parse(request.params);
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send(serializeError(error));
      }
      throw error;
    }
  };
}
