import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  create: vi.fn(),
  disconnect: vi.fn(),
  probe: vi.fn(),
}));
vi.mock("@prisma/client", () => ({
  PrismaClient: class {
    constructor(options: unknown) {
      h.create(options);
    }
    $disconnect = h.disconnect;
  },
}));
vi.mock("../../../../scripts/testing/cart-inventory-probe", () => ({
  runCartInventoryProbe: h.probe,
}));

let previousExit: typeof process.exitCode;
beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  previousExit = process.exitCode;
  process.exitCode = undefined;
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("ALLOW_DATABASE_TEST_CLEANUP", "1");
  vi.stubEnv("ALLOW_OPERATIONAL_DATABASE_WRITES", "1");
  vi.stubEnv("TEST_DATABASE_URL", "postgresql://localhost/cart_probe_test");
  vi.stubEnv("DATABASE_URL", undefined);
  h.probe.mockResolvedValue(undefined);
  h.disconnect.mockResolvedValue(undefined);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  process.exitCode = previousExit;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

async function run() {
  await import("../../../../scratch/verify-cart-inventory-check");
  await vi.waitFor(() => {
    expect(
      vi.mocked(console.log).mock.calls.length + vi.mocked(console.error).mock.calls.length,
    ).toBe(1);
  });
}

describe("cart inventory CLI", () => {
  it("reports success only after disconnect and uses the explicit selected datasource", async () => {
    h.disconnect.mockImplementation(async () => {
      expect(console.log).not.toHaveBeenCalled();
    });
    await run();
    expect(h.create).toHaveBeenCalledWith({
      datasources: { db: { url: process.env.TEST_DATABASE_URL } },
    });
    expect(h.probe).toHaveBeenCalledOnce();
    expect(h.disconnect).toHaveBeenCalledOnce();
    expect(console.log).toHaveBeenCalledWith(
      "Sequential cart inventory checks passed; owned fixtures removed.",
    );
    expect(console.error).not.toHaveBeenCalled();
    expect(process.exitCode).toBeUndefined();
  });

  it.each(["guard", "construction", "probe", "cleanup", "disconnect", "combined"])(
    "fails safely without success output for %s failure",
    async (mode) => {
      const privateError = new Error("synthetic private driver details");
      if (mode === "guard") vi.stubEnv("ALLOW_OPERATIONAL_DATABASE_WRITES", undefined);
      if (mode === "construction")
        h.create.mockImplementation(() => {
          throw privateError;
        });
      if (mode === "probe") h.probe.mockRejectedValueOnce(privateError);
      if (mode === "cleanup" || mode === "combined")
        h.probe.mockRejectedValueOnce(new AggregateError([privateError, new Error("cleanup")]));
      if (mode === "disconnect" || mode === "combined")
        h.disconnect.mockRejectedValueOnce(privateError);
      await run();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith("Cart inventory probe refused or failed.");
      expect(process.exitCode).toBe(1);
      expect(h.probe).toHaveBeenCalledTimes(["guard", "construction"].includes(mode) ? 0 : 1);
      expect(h.disconnect).toHaveBeenCalledTimes(["guard", "construction"].includes(mode) ? 0 : 1);
      if (mode === "guard") expect(h.create).not.toHaveBeenCalled();
    },
  );
});
