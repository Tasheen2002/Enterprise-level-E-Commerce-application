import { describe, expect, it } from "vitest";
import Fastify from "fastify";
import errorPlugin from "../../src/plugins/error";
import { ResponseHelper } from "../../src/shared/response.helper";
import { DomainError, EmptyFieldError } from "../../../../packages/core/src/domain/domain-error";
import { UserId } from "../../../../modules/user-management/domain/value-objects/user-id.vo";

class FixtureError extends DomainError {}
describe("core errors at the HTTP response boundary", () => {
  it.each([400, 401, 403, 404, 409, 422, 429, 500, 503, Number.NaN, 0, 399, 600])(
    "preserves client status or safely redacts server/invalid status %s through both paths",
    async (status) => {
      const error = new FixtureError("Synthetic internal message", "SYNTHETIC_CODE", status);
      const app = Fastify();
      await app.register(errorPlugin);
      app.get("/throw", async () => {
        throw error;
      });
      app.get("/helper", async (_request, reply) => ResponseHelper.error(reply, error));
      try {
        for (const path of ["/throw", "/helper"]) {
          const response = await app.inject(path);
          const expected = status >= 400 && status < 500 ? status : status === 503 ? 503 : 500;
          expect(response.statusCode).toBe(expected);
          expect(response.json()).toMatchObject({
            success: false,
            statusCode: expected,
            message:
              expected >= 500 ? "An unexpected error occurred" : "Synthetic internal message",
            code: expected >= 500 ? "INTERNAL_ERROR" : "SYNTHETIC_CODE",
          });
          expect(response.json()).not.toHaveProperty("stack");
          if (expected >= 500) expect(response.body).not.toContain("Synthetic internal message");
        }
      } finally {
        await app.close();
      }
    },
  );
  it.each(["field", "uuid"])(
    "retains the %s validation code without exposing a stack",
    async (mode) => {
      const app = Fastify();
      await app.register(errorPlugin);
      app.get("/", async () => {
        if (mode === "field") throw new EmptyFieldError("email");
        return UserId.fromString("synthetic-invalid-id");
      });
      try {
        const response = await app.inject("/");
        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({
          success: false,
          code: mode === "field" ? "EMPTY_FIELD" : "INVALID_UUID_FORMAT",
        });
        expect(response.json()).not.toHaveProperty("stack");
      } finally {
        await app.close();
      }
    },
  );
});
