import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import type { ApiEnvelope } from "../src";
import { unwrap } from "../../api-client/src";
import { CommandResult, QueryResult } from "../../core/src/application";
import { ResponseHelper } from "../../../apps/api/src/shared/response.helper";
import { actionSuccessResponse } from "../../../apps/api/src/shared/http/response-schemas";

describe("shared wire types at the backend/client boundary", () => {
  it.each(["ok", "created", "command", "query"] as const)(
    "accepts a payload-free %s acknowledgement",
    async (kind) => {
      const app = Fastify();
      const status = kind === "created" ? 201 : 200;
      app.get(
        "/ack",
        { schema: { response: { [status]: actionSuccessResponse(status) } } },
        async (_request, reply) => {
          if (kind === "created") return ResponseHelper.created(reply, "Done");
          if (kind === "command")
            return ResponseHelper.fromCommand(reply, CommandResult.success(), "Done");
          if (kind === "query")
            return ResponseHelper.fromQuery(reply, QueryResult.success(), "Done");
          return ResponseHelper.ok(reply, "Done");
        },
      );
      try {
        const response = await app.inject("/ack");
        expect(response.statusCode).toBe(status);
        const envelope = response.json<ApiEnvelope<void>>();
        expect(envelope).toEqual({ success: true, statusCode: status, message: "Done" });
        expect(unwrap(envelope)).toBeUndefined();
      } finally {
        await app.close();
      }
    },
  );

  it.each([
    { label: "zero", value: 0 },
    { label: "false", value: false },
    { label: "empty string", value: "" },
    { label: "null", value: null },
    { label: "empty array", value: [] },
    { label: "object", value: { id: "item-1" } },
  ])("retains a $label payload without treating it as missing", async ({ value }) => {
    const app = Fastify();
    app.get("/value", async (_request, reply) => ResponseHelper.ok(reply, "Done", value));
    try {
      const response = await app.inject("/value");
      expect(response.statusCode).toBe(200);
      const envelope = response.json<ApiEnvelope<typeof value>>();
      expect(envelope).toEqual({ success: true, statusCode: 200, message: "Done", data: value });
      expect(unwrap(envelope)).toEqual(value);
    } finally {
      await app.close();
    }
  });

  it.each(["field", "root", "server"] as const)(
    "retains the %s error contract through unwrap",
    async (kind) => {
      const app = Fastify();
      app.get("/error", async (_request, reply) => {
        if (kind === "root") return ResponseHelper.badRequest(reply, "Invalid", ["Required"]);
        return ResponseHelper.error(
          reply,
          kind === "field"
            ? new ZodError([{ code: "custom", path: ["name"], message: "Required" }])
            : new Error("Synthetic internal detail"),
        );
      });
      try {
        const response = await app.inject("/error");
        const envelope = response.json<ApiEnvelope<never>>();
        expect(response.statusCode).toBe(kind === "server" ? 500 : 400);
        expect(envelope.success).toBe(false);
        expect(() => unwrap(envelope)).toThrow(
          expect.objectContaining({ statusCode: response.statusCode }),
        );
        if (envelope.success) throw new Error("Unexpected success");
        if (kind === "server") {
          expect(envelope).toEqual({
            success: false,
            statusCode: 500,
            message: "An unexpected error occurred",
            code: "INTERNAL_ERROR",
          });
          expect(response.body).not.toContain("Synthetic internal detail");
        } else {
          expect(envelope.details).toEqual(
            kind === "root" ? { _root: ["Required"] } : { name: ["Required"] },
          );
        }
        try {
          unwrap(envelope);
        } catch (error) {
          expect(error).toMatchObject({
            message: envelope.message,
            statusCode: envelope.statusCode,
            ...(envelope.code ? { code: envelope.code } : {}),
            ...(envelope.details ? { details: envelope.details } : {}),
          });
        }
      } finally {
        await app.close();
      }
    },
  );

  it("treats 204 as an empty HTTP response, outside the JSON envelope contract", async () => {
    const app = Fastify();
    app.get("/empty", async (_request, reply) => ResponseHelper.noContent(reply));
    try {
      const response = await app.inject("/empty");
      expect(response.statusCode).toBe(204);
      expect(response.body).toBe("");
    } finally {
      await app.close();
    }
  });
});
