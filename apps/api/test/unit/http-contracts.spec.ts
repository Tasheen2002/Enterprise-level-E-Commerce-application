import { describe, expect, it, vi } from "vitest";
import Fastify from "fastify";
import { z, ZodError } from "zod";
import { Prisma } from "@prisma/client";
import errorPlugin from "../../src/plugins/error";
import { errorStatus, serializeError } from "../../src/shared/http/error-response";
import {
  validateBody,
  validateQuery,
  validateParams,
  toJsonSchema,
  paginationQuerySchema,
} from "../../src/shared/http/validation";
import {
  successResponse,
  actionSuccessResponse,
  errorResponse,
  paginatedResponse,
  noContentResponse,
} from "../../src/shared/http/response-schemas";
import { ResponseHelper } from "../../src/shared/response.helper";
import {
  EmptyFieldError,
  InvalidFormatError,
} from "../../../../packages/core/src/domain/domain-error";
import { CommandResult, QueryResult } from "../../../../packages/core/src/application/cqrs";

describe("shared error serialization", () => {
  it.each(["__proto__", "constructor", "toString", "hasOwnProperty", "_root", "items.0.name"])(
    "retains validation messages under the field %s without inherited-property collisions",
    (field) => {
      const error = new ZodError([
        { code: "custom", path: [field], message: "First" },
        { code: "custom", path: [field], message: "Second" },
      ]);
      const response = serializeError(error);
      expect(JSON.parse(JSON.stringify(response)).details[field]).toEqual(["First", "Second"]);
      expect(Object.prototype.hasOwnProperty.call(response.details, field)).toBe(true);
    },
  );
  it("groups nested array and root issues without exposing inputs", () => {
    const response = serializeError(
      new ZodError([
        { code: "custom", path: ["items", 0, "name"], message: "Required" },
        { code: "custom", path: [], message: "Invalid selection" },
      ]),
    );
    expect(response.details).toEqual({
      "items.0.name": ["Required"],
      _root: ["Invalid selection"],
    });
  });
  it.each(["__proto__", "constructor", "toString", "P9999"])(
    "redacts unmapped Prisma code %s as a valid server envelope",
    (code) => {
      const error = new Prisma.PrismaClientKnownRequestError("Synthetic private database detail", {
        code,
        clientVersion: "synthetic",
        meta: { target: "private_field" },
      });
      expect(serializeError(error)).toEqual({
        success: false,
        statusCode: 500,
        message: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
      });
    },
  );
  it.each([
    ["P2002", 409, "Resource already exists"],
    ["P2025", 404, "Resource not found"],
    ["P2003", 400, "Invalid reference to related resource"],
  ] as const)("maps Prisma code %s without database metadata", (code, statusCode, message) => {
    expect(
      serializeError(
        new Prisma.PrismaClientKnownRequestError("Private SQL", {
          code,
          clientVersion: "synthetic",
          meta: { target: "private_column" },
        }),
      ),
    ).toEqual({ success: false, statusCode, message, code });
  });
  it("retains the current sanitized Prisma validation-error policy", () => {
    expect(
      serializeError(
        new Prisma.PrismaClientValidationError("Private SQL", {
          clientVersion: "synthetic",
        }),
      ),
    ).toEqual({
      success: false,
      statusCode: 400,
      message: "Invalid database operation",
      code: "VALIDATION_ERROR",
    });
  });
  it.each([
    null,
    undefined,
    "private",
    12,
    {},
    { statusCode: 200 },
    { statusCode: 500, code: "private", message: "private" },
  ])("redacts unexpected thrown value %j", (value) => {
    expect(serializeError(value)).toEqual({
      success: false,
      statusCode: 500,
      message: "An unexpected error occurred",
      code: "INTERNAL_ERROR",
    });
  });
  it("uses safe client defaults and retains explicit client codes", () => {
    expect(serializeError({ statusCode: 418 })).toMatchObject({
      statusCode: 418,
      message: "Request failed",
    });
    expect(serializeError({ statusCode: 422, message: "Invalid", code: "INPUT" })).toMatchObject({
      statusCode: 422,
      message: "Invalid",
      code: "INPUT",
    });
    expect(errorStatus(404)).toBe(404);
    expect(errorStatus(NaN)).toBe(500);
    expect(errorStatus(200, 400)).toBe(400);
  });
  it.each([new EmptyFieldError("email"), new InvalidFormatError("email", "email address")])(
    "retains canonical domain field details: $code",
    async (error) => {
      const app = Fastify();
      await app.register(errorPlugin);
      app.get("/throw", { schema: { response: { 400: errorResponse(400) } } }, async () => {
        throw error;
      });
      app.get(
        "/helper",
        { schema: { response: { 400: errorResponse(400) } } },
        async (_request, reply) => ResponseHelper.error(reply, error),
      );
      try {
        for (const url of ["/throw", "/helper"]) {
          const response = await app.inject(url);
          expect(response.statusCode).toBe(400);
          expect(response.json()).toEqual({
            success: false,
            statusCode: 400,
            code: error.code,
            message: error.message,
            details: { email: [error.message] },
          });
        }
      } finally {
        await app.close();
      }
    },
  );
});

describe("body/query/parameter validation hooks", () => {
  const hooks = { body: validateBody, query: validateQuery, params: validateParams };
  it.each(["body", "query", "params"] as const)(
    "parses and replaces %s with normalized output",
    async (part) => {
      const hook = hooks[part](
        z.object({ count: z.coerce.number().int().positive().default(2), name: z.string().trim() }),
      );
      const request = { [part]: { count: "3", name: " item ", extra: "strip" } };
      await hook(request as never, {} as never);
      expect(request[part]).toEqual({ count: 3, name: "item" });
    },
  );
  it.each(["body", "query", "params"] as const)(
    "returns a structured 400 and stops the handler for invalid %s",
    async (part) => {
      const app = Fastify();
      const handler = vi.fn(async () => ({}));
      const schema = z.object({ count: z.coerce.number().positive() });
      app.post(
        "/items/:count",
        { preValidation: hooks[part](schema), schema: { response: { 400: errorResponse(400) } } },
        handler,
      );
      try {
        const response = await app.inject({
          method: "POST",
          url: "/items/-1?count=-1",
          payload: { count: -1 },
        });
        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({
          code: "VALIDATION_ERROR",
          details: { count: [expect.any(String)] },
        });
        expect(handler).not.toHaveBeenCalled();
      } finally {
        await app.close();
      }
    },
  );
  it.each(["body", "query", "params"] as const)(
    "propagates programming failures in %s transforms",
    async (part) => {
      const fault = new Error("Synthetic transform failure");
      const hook = hooks[part](
        z.unknown().transform(() => {
          throw fault;
        }),
      );
      await expect(hook({ [part]: {} } as never, {} as never)).rejects.toBe(fault);
    },
  );
  it.each(["body", "query", "params"] as const)(
    "supports asynchronous %s schema refinement",
    async (part) => {
      const schema = z.string().refine(async (value) => value === "valid", "Rejected");
      const hook = hooks[part](schema);
      const good = { [part]: "valid" };
      await expect(hook(good as never, {} as never)).resolves.toBeUndefined();
      const send = vi.fn();
      const reply = { status: vi.fn().mockReturnThis(), send };
      await hook({ [part]: "invalid" } as never, reply as never);
      expect(reply.status).toHaveBeenCalledWith(400);
      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({ details: { _root: ["Rejected"] } }),
      );
    },
  );
  it("keeps representative generated schemas compatible with Zod before and after Fastify validation", async () => {
    const app = Fastify();
    const schema = z.object({ count: z.coerce.number().int().positive().default(2) });
    app.get(
      "/before",
      { preValidation: validateQuery(schema), schema: { querystring: toJsonSchema(schema) } },
      async (request) => request.query,
    );
    app.get(
      "/after",
      { preHandler: validateQuery(schema), schema: { querystring: toJsonSchema(schema) } },
      async (request) => request.query,
    );
    try {
      for (const url of ["/before", "/after"]) {
        expect((await app.inject(url)).json()).toEqual({ count: 2 });
        expect((await app.inject(`${url}?count=3`)).json()).toEqual({ count: 3 });
        expect((await app.inject(`${url}?count=-1`)).statusCode).toBe(400);
      }
      expect(paginationQuerySchema.parse({ limit: "5", offset: "0" })).toMatchObject({
        limit: 5,
        offset: 0,
      });
    } finally {
      await app.close();
    }
  });
});

describe("response helpers through Fastify serializers", () => {
  it("serializes reserved validation field names through the error response schema", async () => {
    const app = Fastify();
    await app.register(errorPlugin);
    app.get("/", { schema: { response: { 400: errorResponse(400) } } }, async () => {
      throw new ZodError([
        { code: "custom", path: ["__proto__"], message: "Invalid" },
        { code: "custom", path: ["constructor"], message: "Required" },
      ]);
    });
    try {
      const response = await app.inject("/");
      expect(response.statusCode).toBe(400);
      const details = response.json().details;
      expect(Object.keys(details).sort()).toEqual(["__proto__", "constructor"]);
      expect(details.__proto__).toEqual(["Invalid"]);
      expect(details.constructor).toEqual(["Required"]);
    } finally {
      await app.close();
    }
  });
  it("uses the safe fallback when a failure result has no message or details", async () => {
    const app = Fastify();
    app.get("/command", async (_request, reply) =>
      ResponseHelper.fromCommand(reply, new CommandResult(false), "OK"),
    );
    app.get("/query", async (_request, reply) =>
      ResponseHelper.fromQuery(reply, new QueryResult(false, null), "OK"),
    );
    try {
      for (const url of ["/command", "/query"]) {
        const response = await app.inject(url);
        expect(response.statusCode).toBe(400);
        expect(response.json()).toEqual({
          success: false,
          statusCode: 400,
          message: "Request failed",
        });
      }
    } finally {
      await app.close();
    }
  });
  it("preserves payloads, action acknowledgements, pagination and empty responses", async () => {
    const app = Fastify();
    const item = {
      type: "object",
      required: ["id"],
      additionalProperties: false,
      properties: { id: { type: "string" } },
    };
    app.get(
      "/created",
      { schema: { response: { 201: successResponse(item, 201) } } },
      async (_request, reply) =>
        ResponseHelper.created(reply, "Created", { id: "item", private: "stripped" }),
    );
    app.get(
      "/action",
      { schema: { response: { 200: actionSuccessResponse() } } },
      async (_request, reply) => ResponseHelper.fromCommand(reply, CommandResult.success(), "Done"),
    );
    app.get(
      "/command-data",
      { schema: { response: { 200: successResponse({ type: "integer" }) } } },
      async (_request, reply) =>
        ResponseHelper.fromCommand(reply, CommandResult.success(0), "Done"),
    );
    app.get(
      "/page",
      { schema: { response: { 200: successResponse(paginatedResponse(item)) } } },
      async (_request, reply) =>
        ResponseHelper.ok(reply, "Listed", {
          items: [{ id: "item" }],
          total: 1,
          limit: 10,
          offset: 0,
          hasMore: false,
        }),
    );
    app.get(
      "/empty",
      { schema: { response: { 204: noContentResponse } } },
      async (_request, reply) => ResponseHelper.noContent(reply),
    );
    app.get("/command-empty", async (_request, reply) =>
      ResponseHelper.fromCommand(reply, CommandResult.success(), "Done", undefined, 204),
    );
    app.get(
      "/explicit-action",
      { schema: { response: { 202: actionSuccessResponse(202) } } },
      async (_request, reply) => ResponseHelper.success(reply, 202, "Accepted"),
    );
    try {
      const created = await app.inject("/created");
      expect(created.statusCode).toBe(201);
      expect(created.json()).toEqual({
        success: true,
        statusCode: 201,
        message: "Created",
        data: { id: "item" },
      });
      expect((await app.inject("/action")).json()).toEqual({
        success: true,
        statusCode: 200,
        message: "Done",
      });
      expect((await app.inject("/command-data")).json().data).toBe(0);
      expect((await app.inject("/page")).json().data).toEqual({
        items: [{ id: "item" }],
        total: 1,
        limit: 10,
        offset: 0,
        hasMore: false,
      });
      expect((await app.inject("/explicit-action")).json().statusCode).toBe(202);
      for (const url of ["/empty", "/command-empty"]) {
        const response = await app.inject(url);
        expect(response.statusCode).toBe(204);
        expect(response.body).toBe("");
      }
    } finally {
      await app.close();
    }
  });
  it.each(["command", "query"] as const)(
    "retains client failure details and redacts %s server failures",
    async (kind) => {
      const app = Fastify();
      app.get("/:mode", async (request, reply) => {
        const mode = (request.params as { mode: string }).mode;
        const status = mode === "server" ? 503 : mode === "default" ? undefined : 422;
        return kind === "command"
          ? ResponseHelper.fromCommand(
              reply,
              CommandResult.failure("Private if server", ["Field"], status),
              "OK",
            )
          : ResponseHelper.fromQuery(
              reply,
              QueryResult.failure("Private if server", ["Field"], status),
              "OK",
            );
      });
      try {
        for (const [mode, status] of [
          ["server", 503],
          ["default", 400],
          ["client", 422],
        ] as const) {
          const response = await app.inject(`/${mode}`);
          expect(response.statusCode).toBe(status);
          if (status >= 500) {
            expect(response.body).not.toContain("Private");
            expect(response.json()).not.toHaveProperty("details");
          } else expect(response.json().details).toEqual({ _root: ["Field"] });
        }
      } finally {
        await app.close();
      }
    },
  );
  it("retains query absence semantics and falsy payloads", async () => {
    const app = Fastify();
    app.get("/missing", async (_request, reply) =>
      ResponseHelper.fromQuery(reply, QueryResult.success(), "OK", "Missing"),
    );
    app.get("/absent", async (_request, reply) =>
      ResponseHelper.fromQuery(reply, QueryResult.success(), "OK"),
    );
    app.get("/zero", async (_request, reply) =>
      ResponseHelper.fromQuery(reply, QueryResult.success(0), "OK", "Missing"),
    );
    try {
      expect((await app.inject("/missing")).statusCode).toBe(404);
      expect((await app.inject("/absent")).json()).not.toHaveProperty("data");
      expect((await app.inject("/zero")).json().data).toBe(0);
    } finally {
      await app.close();
    }
  });
  it("preserves convenience error helpers and canonical plugin not-found handling", async () => {
    const app = Fastify();
    await app.register(errorPlugin);
    app.get("/unauthorized", async (_request, reply) => ResponseHelper.unauthorized(reply));
    app.get("/forbidden", async (_request, reply) => ResponseHelper.forbidden(reply));
    app.get("/bad", async (_request, reply) =>
      ResponseHelper.badRequest(reply, "Invalid", ["Field"]),
    );
    app.get("/bad-empty", async (_request, reply) =>
      ResponseHelper.badRequest(reply, "Invalid", []),
    );
    try {
      expect((await app.inject("/unauthorized")).statusCode).toBe(401);
      expect((await app.inject("/forbidden")).statusCode).toBe(403);
      expect((await app.inject("/bad")).json().details).toEqual({ _root: ["Field"] });
      expect((await app.inject("/bad-empty")).json()).not.toHaveProperty("details");
      expect((await app.inject("/unknown")).json()).toMatchObject({
        success: false,
        statusCode: 404,
      });
    } finally {
      await app.close();
    }
  });
});
