import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => {
  const originalSend = vi.fn();
  return {
    create: vi.fn(),
    disconnect: vi.fn(),
    expiry: vi.fn(),
    reminder: vi.fn(),
    dispatcher: vi.fn(),
    register: vi.fn(),
    get: vi.fn(),
    publish: vi.fn(),
    importContainer: vi.fn(),
    importMail: vi.fn(),
    originalSend,
    mailPrototype: { sendEmail: originalSend },
  };
});
vi.mock("@prisma/client", () => ({
  PrismaClient: class {
    constructor(options: unknown) {
      h.create(options);
    }
    $disconnect = h.disconnect;
  },
}));
vi.mock("../../../../scripts/testing/cart-expiry-probe", () => ({ runCartExpiryProbe: h.expiry }));
vi.mock("../../../../scripts/testing/restock-probes", () => ({
  runRestockReminderProbe: h.reminder,
  runRestockDispatcherProbe: h.dispatcher,
}));

const configurations = [
  {
    name: "expiry",
    load: () => import("../../../../scratch/test-expiry-renewal"),
    probe: h.expiry,
    container: true,
    dispatcher: false,
    error: "Cart expiry probe refused or failed.",
    success:
      "Cart and reservation renewal verified; isolated fixtures removed. No HTTP server started.",
  },
  {
    name: "reminder",
    load: () => import("../../../../scratch/verify-restock-reminder"),
    probe: h.reminder,
    container: false,
    dispatcher: false,
    error: "Restock reminder probe refused or failed.",
    success: "Restock reminder persistence verified; fixtures rolled back. No delivery tested.",
  },
  {
    name: "dispatcher",
    load: () => import("../../../../scratch/verify-restock-dispatcher"),
    probe: h.dispatcher,
    container: true,
    dispatcher: true,
    error: "Restock dispatcher probe refused or failed.",
    success:
      "Simulated restock subscriber state verified; fixtures removed. Actual email/SMS delivery remains unverified.",
  },
];

let previousExit: typeof process.exitCode;
beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.doMock("../../../../apps/api/src/container", () => {
    h.importContainer();
    return { container: { register: h.register, get: h.get } };
  });
  vi.doMock("../../../../modules/user-management/infra/security/nodemailer-email.adapter", () => {
    h.importMail();
    return { NodemailerEmailService: { prototype: h.mailPrototype } };
  });
  h.mailPrototype.sendEmail = h.originalSend;
  previousExit = process.exitCode;
  process.exitCode = undefined;
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("ALLOW_DATABASE_TEST_CLEANUP", "1");
  vi.stubEnv("ALLOW_OPERATIONAL_DATABASE_WRITES", "1");
  vi.stubEnv("TEST_DATABASE_URL", "postgresql://localhost/cli_failure_test");
  vi.stubEnv("DATABASE_URL", undefined);
  vi.stubEnv("STRIPE_SECRET_KEY", "synthetic-provider-key");
  h.disconnect.mockResolvedValue(undefined);
  h.expiry.mockResolvedValue(undefined);
  h.reminder.mockResolvedValue(undefined);
  h.dispatcher.mockResolvedValue(undefined);
  h.get.mockReturnValue({ publish: h.publish });
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  h.mailPrototype.sendEmail = h.originalSend;
  process.exitCode = previousExit;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

async function run(load: () => Promise<unknown>) {
  await load();
  await vi.waitFor(() => {
    expect(
      vi.mocked(console.log).mock.calls.length + vi.mocked(console.error).mock.calls.length,
    ).toBe(1);
  });
}

for (const config of configurations) {
  describe(`${config.name} operational CLI`, () => {
    it("reports success after disconnect and uses the selected client", async () => {
      h.disconnect.mockImplementation(async () => {
        expect(console.log).not.toHaveBeenCalled();
      });
      await run(config.load);
      expect(h.create).toHaveBeenCalledWith({
        datasources: { db: { url: process.env.TEST_DATABASE_URL } },
      });
      expect(config.probe).toHaveBeenCalledOnce();
      const client = config.probe.mock.calls[0][0];
      expect(client.$disconnect).toBe(h.disconnect);
      if (config.container) {
        expect(h.register).toHaveBeenCalledWith(
          client,
          expect.objectContaining({ jwtExpiresIn: "1h" }),
        );
        expect(h.get).toHaveBeenCalledWith(
          config.dispatcher ? "eventBus" : "cartManagementService",
        );
        expect(process.env.STRIPE_SECRET_KEY).toBeUndefined();
      } else expect(h.importContainer).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(config.success);
      expect(console.error).not.toHaveBeenCalled();
      expect(process.exitCode).toBeUndefined();
      expect(h.disconnect).toHaveBeenCalledOnce();
      expect(h.mailPrototype.sendEmail).toBe(h.originalSend);
    });

    const modes = [
      "guard",
      "construction",
      "probe",
      "cleanup",
      "disconnect",
      "combined",
      ...(config.container ? ["container-import", "registration", "resolution"] : []),
      ...(config.dispatcher ? ["mail-import"] : []),
    ];
    it.each(modes)("fails safely for %s and restores resources", async (mode) => {
      const error = Object.assign(new Error("synthetic private driver details"), {
        name: "PRIVATE_ACCOUNT_IDENTIFIER",
        code: "PRIVATE_ACCOUNT_IDENTIFIER",
      });
      const fail = () => {
        throw error;
      };
      if (mode === "guard") vi.stubEnv("ALLOW_OPERATIONAL_DATABASE_WRITES", undefined);
      if (mode === "construction") h.create.mockImplementation(fail);
      if (mode === "container-import") h.importContainer.mockImplementation(fail);
      if (mode === "mail-import") h.importMail.mockImplementation(fail);
      if (mode === "registration") h.register.mockImplementation(fail);
      if (mode === "resolution") h.get.mockImplementation(fail);
      if (mode === "probe") config.probe.mockRejectedValueOnce(error);
      if (mode === "cleanup" || mode === "combined")
        config.probe.mockRejectedValueOnce(new AggregateError([error, new Error("cleanup")]));
      if (mode === "disconnect" || mode === "combined") h.disconnect.mockRejectedValueOnce(error);
      await run(config.load);
      expect(console.log).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(config.error);
      expect(process.exitCode).toBe(1);
      expect(h.disconnect).toHaveBeenCalledTimes(["guard", "construction"].includes(mode) ? 0 : 1);
      expect(h.mailPrototype.sendEmail).toBe(h.originalSend);
      if (mode === "guard") {
        expect(h.create).not.toHaveBeenCalled();
        expect(h.importContainer).not.toHaveBeenCalled();
        expect(h.importMail).not.toHaveBeenCalled();
        expect(process.env.STRIPE_SECRET_KEY).toBe("synthetic-provider-key");
      }
    });
  });
}

describe("restock dispatcher delivery tripwire", () => {
  it("forwards the event through the configured bus with its receiver intact", async () => {
    const event = { synthetic: true };
    h.dispatcher.mockImplementation(async (_client, publish) => {
      await publish(event);
    });
    h.publish.mockImplementation(async function (this: unknown) {
      expect(this).toEqual({ publish: h.publish });
    });
    await run(configurations[2].load);
    expect(h.publish).toHaveBeenCalledWith(event);
    expect(h.mailPrototype.sendEmail).toBe(h.originalSend);
  });

  it.each([false, true])(
    "rejects attempted email even when its rejection is swallowed: %s",
    async (swallow) => {
      h.dispatcher.mockImplementation(async () => {
        if (swallow) await h.mailPrototype.sendEmail().catch(() => {});
        else await h.mailPrototype.sendEmail();
      });
      await run(configurations[2].load);
      expect(h.originalSend).not.toHaveBeenCalled();
      expect(h.mailPrototype.sendEmail).toBe(h.originalSend);
      expect(console.log).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(configurations[2].error);
      expect(h.disconnect).toHaveBeenCalledOnce();
      expect(process.exitCode).toBe(1);
    },
  );
});
