import { describe, expect, it } from "vitest";
import { CommandResult, QueryResult } from "../src/application/cqrs";
import * as application from "../src/application";
import { CommandResult as DirectCommand } from "../src/application/command-result";
import { QueryResult as DirectQuery } from "../src/application/query-result";
import { DomainError } from "../src/domain/domain-error";

class FixtureError extends DomainError {}
const factories = [
  {
    label: "command",
    fromError: (error: unknown) => CommandResult.fromError(error),
    fallback: "Command failed",
  },
  {
    label: "query",
    fromError: (error: unknown) => QueryResult.fromError(error),
    fallback: "Query failed",
  },
];
describe("CQRS success and explicit failure compatibility", () => {
  it("exports the same result classes through every supported import path", () => {
    expect(application.CommandResult).toBe(DirectCommand);
    expect(application.QueryResult).toBe(DirectQuery);
    expect(CommandResult).toBe(DirectCommand);
    expect(QueryResult).toBe(DirectQuery);
  });
  it.each([{ value: 0 }, { value: false }, { value: "" }, { value: [] }, { value: { total: 1 } }])(
    "retains success payload $value",
    ({ value }) => {
      const command = CommandResult.success(value);
      const query = QueryResult.success(value);
      expect(command).toMatchObject({ success: true, data: value });
      expect(query).toMatchObject({
        success: true,
        data: value,
        isSuccess: true,
        isFailure: false,
      });
      expect(command.data).toBe(value);
      expect(query.data).toBe(value);
    },
  );
  it("preserves command optional data and the query null sentinel", () => {
    expect(CommandResult.success().data).toBeUndefined();
    expect(CommandResult.success(null).data).toBeNull();
    expect(QueryResult.success().data).toBeNull();
    expect(QueryResult.success(null).data).toBeNull();
  });
  it("preserves command validation fields and explicit status", () => {
    expect(CommandResult.failure("Rejected", ["email"], 422)).toEqual(
      new CommandResult(false, undefined, "Rejected", ["email"], 422),
    );
    expect(CommandResult.failure("Rejected").statusCode).toBeUndefined();
  });
  it("preserves both query failure overloads and status precedence", () => {
    expect(QueryResult.failure("Missing", 404)).toMatchObject({
      success: false,
      data: null,
      statusCode: 404,
      isSuccess: false,
      isFailure: true,
    });
    expect(QueryResult.failure("Rejected", ["email"], 422)).toMatchObject({
      errors: ["email"],
      statusCode: 422,
    });
    expect(QueryResult.failure("Rejected", ["email"]).statusCode).toBeUndefined();
    expect(QueryResult.failure("Unavailable", undefined, 503).statusCode).toBe(503);
    expect(QueryResult.failure("Missing", 404, 422).statusCode).toBe(404);
    expect(QueryResult.failure("Rejected").errors).toBeUndefined();
  });
});

describe.each(factories)("$label exception conversion", ({ fromError, fallback }) => {
  it.each([400, 401, 403, 404, 409, 422, 429, 500, 503, 599])(
    "retains explicit failure status %s",
    (status) => {
      const result = fromError(new FixtureError("Synthetic failure", "FIXTURE_ERROR", status));
      expect(result).toMatchObject({
        success: false,
        error: "Synthetic failure",
        statusCode: status,
      });
      expect(result.errors).toBeUndefined();
    },
  );
  it.each([
    { label: "undefined", value: undefined },
    { label: "null", value: null },
    { label: "numeric-string", value: "404" },
    { label: "array", value: ["synthetic private field"] },
    { label: "object", value: {} },
    { label: "boolean", value: false },
    { label: "NaN", value: Number.NaN },
    { label: "infinity", value: Infinity },
    { label: "fraction", value: 400.5 },
    { label: "success-status", value: 200 },
    { label: "below-bound", value: 399 },
    { label: "above-bound", value: 600 },
  ])("treats malformed $label status as an internal failure", ({ value }) => {
    const error = Object.assign(new Error("Synthetic private detail"), { statusCode: value });
    const result = fromError(error);
    expect(result.statusCode).toBe(500);
    expect(result.errors).toBeUndefined();
    expect(result.error).toBe("Synthetic private detail");
  });
  it.each([
    { label: "undefined", value: undefined },
    { label: "null", value: null },
    { label: "string", value: "synthetic private text" },
    { label: "number", value: 7 },
    { label: "record", value: { message: "synthetic private record" } },
    { label: "function", value: () => {} },
  ])("uses a fixed message for non-Error $label input", ({ value }) => {
    const result = fromError(value);
    expect(result).toMatchObject({ success: false, statusCode: 500, error: fallback });
  });
  it("retains plain-object numeric status without exposing its arbitrary message", () => {
    expect(fromError({ statusCode: 409, message: "synthetic private record" })).toMatchObject({
      statusCode: 409,
      error: fallback,
    });
  });
  it("uses a string fallback when an Error has a malformed message", () => {
    const error = new Error("fixture");
    Reflect.set(error, "message", 12);
    expect(fromError(error)).toMatchObject({ statusCode: 500, error: fallback });
  });
  it("contains throwing status getters rather than throwing another error", () => {
    const error = new Error("Synthetic private detail");
    Object.defineProperty(error, "statusCode", {
      get() {
        throw new Error("Synthetic getter failure");
      },
    });
    expect(fromError(error)).toMatchObject({ statusCode: 500, error: fallback });
  });
  it("contains a proxy that refuses error introspection", () => {
    const error = new Proxy(
      {},
      {
        getPrototypeOf() {
          throw new Error("Synthetic proxy failure");
        },
      },
    );
    expect(fromError(error)).toMatchObject({ statusCode: 500, error: fallback });
  });
});
