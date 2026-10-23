import { createRequire } from "node:module";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import * as core from "../src";
import * as application from "../src/application";
import * as domain from "../src/domain";
import * as events from "../src/domain/events";
import * as values from "../src/domain/value-objects";

const packageRoot = path.resolve("packages/core");
const configPath = path.join(packageRoot, "tsconfig.json");

function configuration() {
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  expect(config.error).toBeUndefined();
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, packageRoot);
  expect(parsed.errors).toEqual([]);
  return parsed;
}

describe("core package integration contracts", () => {
  it("keeps public barrels compatible with direct domain/application imports", () => {
    const expected = { ...application, ...domain };
    expect(Object.keys(core).sort()).toEqual(Object.keys(expected).sort());
    for (const [name, value] of Object.entries(expected)) {
      expect(core[name as keyof typeof core]).toBe(value);
    }
    for (const [name, value] of Object.entries({ ...events, ...values })) {
      expect(core[name as keyof typeof core]).toBe(value);
    }
    expect(core).not.toHaveProperty("parseResultError");
  });

  it("builds executable CommonJS from the actual package compiler configuration", () => {
    const config = configuration();
    const manifest = JSON.parse(readFileSync(path.join(packageRoot, "package.json"), "utf8"));
    expect(manifest.scripts.build).toBe("tsc");
    expect(manifest.main).toBe("./src/index.ts");
    expect(manifest.types).toBe("./src/index.ts");
    expect(
      config.fileNames.every((file) => file.includes("/src/") || file.includes("\\src\\")),
    ).toBe(true);
    const output = mkdtempSync(path.join(tmpdir(), "slipperze-core-build-"));
    try {
      const program = ts.createProgram(config.fileNames, { ...config.options, outDir: output });
      expect(ts.getPreEmitDiagnostics(program)).toEqual([]);
      expect(program.emit().emitSkipped).toBe(false);
      const built = createRequire(path.join(output, "consumer.cjs"))(path.join(output, "index.js"));
      expect(Object.keys(built).sort()).toEqual(Object.keys(core).sort());
      expect(built.Currency.create(" usd ").getValue()).toBe("USD");
      expect(built.QueryResult.success(0).data).toBe(0);
      expect(new built.InMemoryEventBus()).toHaveProperty("publish");
    } finally {
      // Only remove the unique directory created by this test.
      rmSync(output, { recursive: true, force: true });
    }
  }, 30000);

  it("does not emit build artifacts when a source has a type error", () => {
    const config = configuration();
    const fixture = path.join(packageRoot, "src", "__invalid_build_contract__.ts");
    const host = ts.createCompilerHost(config.options);
    const originalRead = host.getSourceFile.bind(host);
    host.getSourceFile = (file, languageVersion, onError, shouldCreateNewSourceFile) =>
      path.resolve(file) === fixture
        ? ts.createSourceFile(
            file,
            'export const invalid: number = "not a number";',
            languageVersion,
          )
        : originalRead(file, languageVersion, onError, shouldCreateNewSourceFile);
    const emitted: string[] = [];
    host.writeFile = (file) => {
      emitted.push(file);
    };
    const program = ts.createProgram([...config.fileNames, fixture], config.options, host);
    expect(ts.getPreEmitDiagnostics(program).map((diagnostic) => diagnostic.code)).toContain(2322);
    const result = program.emit();
    expect(result.emitSkipped).toBe(true);
    expect(emitted).toEqual([]);
  }, 30000);
});
