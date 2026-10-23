import { describe, expect, it } from "vitest";
import Fastify from "fastify";
import { CommandResult, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { ResponseHelper } from "../../src/shared/response.helper";

describe("CQRS result HTTP boundary", () => {
  it.each([
    { label: "undefined", status: undefined },
    { label: "string", status: "404" },
    { label: "array", status: ["synthetic private field"] },
    { label: "NaN", status: Number.NaN },
    { label: "success-code", status: 200 },
    { label: "server-code", status: 503 },
  ])("redacts converted $label failures through both result paths", async ({ status }) => {
    const app = Fastify();
    const error = Object.assign(new Error("Synthetic private exception detail"), {
      statusCode: status,
    });
    app.get("/command", async (_request, reply) =>
      ResponseHelper.fromCommand(reply, CommandResult.fromError(error), "OK"),
    );
    app.get("/query", async (_request, reply) =>
      ResponseHelper.fromQuery(reply, QueryResult.fromError(error), "OK"),
    );
    try {
      for (const path of ["/command", "/query"]) {
        const response = await app.inject(path);
        expect(response.statusCode).toBe(status === 503 ? 503 : 500);
        expect(response.json().message).toBe("An unexpected error occurred");
        expect(response.body).not.toContain("Synthetic private");
        expect(response.json()).not.toHaveProperty("details");
      }
    } finally {
      await app.close();
    }
  });
  it("preserves explicit validation failures and field errors without requiring a status", async () => {
    const app = Fastify();
    app.get("/command", async (_request, reply) =>
      ResponseHelper.fromCommand(reply, CommandResult.failure("Invalid", ["email"]), "OK"),
    );
    app.get("/query", async (_request, reply) =>
      ResponseHelper.fromQuery(reply, QueryResult.failure("Invalid", ["email"]), "OK"),
    );
    try {
      for (const path of ["/command", "/query"]) {
        const response = await app.inject(path);
        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({
          message: "Invalid",
          details: { _root: ["email"] },
        });
      }
    } finally {
      await app.close();
    }
  });
  it("retains query absence semantics and falsy success payloads", async () => {
    const app = Fastify();
    app.get("/absent", async (_request, reply) =>
      ResponseHelper.fromQuery(reply, QueryResult.success(), "OK", "Missing"),
    );
    app.get("/empty", async (_request, reply) =>
      ResponseHelper.fromQuery(reply, QueryResult.success(), "OK"),
    );
    app.get("/zero", async (_request, reply) =>
      ResponseHelper.fromQuery(reply, QueryResult.success(0), "OK", "Missing"),
    );
    app.get("/false", async (_request, reply) =>
      ResponseHelper.fromCommand(reply, CommandResult.success(false), "OK"),
    );
    try {
      expect((await app.inject("/absent")).statusCode).toBe(404);
      const empty = await app.inject("/empty");
      expect(empty.statusCode).toBe(200);
      expect(empty.json()).not.toHaveProperty("data");
      expect((await app.inject("/zero")).json().data).toBe(0);
      expect((await app.inject("/false")).json().data).toBe(false);
    } finally {
      await app.close();
    }
  });
});
