import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { UuidId } from "../src";
import { uuidCases } from "./uuid-wrapper-cases";

const value = "d3b07384-d113-4956-a5d2-069d30560a6a";

function discoverWrappers(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) return discoverWrappers(file);
    return file.endsWith(".ts") &&
      /\bclass\s+\w+\s+extends\s+UuidId\b/.test(readFileSync(file, "utf8"))
      ? [file.replace(/\\/g, "/")]
      : [];
  });
}

describe("UUID wrapper migration compatibility", () => {
  it("includes every current UuidId wrapper in the runtime and compiler fixtures", () => {
    expect(uuidCases.map((entry) => entry.source).sort()).toEqual(
      discoverWrappers("modules").sort(),
    );
    expect(new Set(uuidCases.map((entry) => entry.name)).size).toBe(uuidCases.length);
  });

  it.each(uuidCases)(
    "preserves $name factories, errors and runtime representation",
    ({ type, label }) => {
      const restored: UuidId = type.fromString(value.toUpperCase());
      expect(restored).toBeInstanceOf(type);
      expect(restored.getValue()).toBe(value);
      expect(restored.toString()).toBe(value);
      expect(restored.toJSON()).toBe(value);
      expect(JSON.stringify(restored)).toBe(JSON.stringify(value));
      expect(restored.getTypeName()).toBe(label);
      expect(restored.equals(type.fromString(value))).toBe(true);
      expect(restored.equals(type.fromString(value.replace("d3b07384", "d3b07385")))).toBe(false);
      // A declaration-only brand must not introduce a field in emitted JavaScript.
      expect(Object.getOwnPropertyNames(restored).sort()).toEqual(["typeName", "value"]);
      const first = type.create();
      const second = type.create();
      expect(first).toBeInstanceOf(type);
      expect(UuidId.isValid(first.getValue())).toBe(true);
      expect(first.equals(second)).toBe(false);
      expect(() => type.fromString("invalid-id")).toThrow(
        expect.objectContaining({ code: "INVALID_UUID_FORMAT", statusCode: 400 }),
      );
    },
  );

  it("keeps every distinct pair unequal at runtime, including identically labelled reservations", () => {
    for (const left of uuidCases) {
      for (const right of uuidCases) {
        expect(
          left.type.fromString(value).equals(right.type.fromString(value)),
          `${left.name} / ${right.name}`,
        ).toBe(left.name === right.name);
      }
    }
  });
});
