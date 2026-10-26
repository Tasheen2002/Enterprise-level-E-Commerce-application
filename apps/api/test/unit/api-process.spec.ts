import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventEmitter } from "node:events";
import type { FastifyInstance } from "fastify";
vi.mock("../../src/server", () => ({ createServer: vi.fn() }));
import { startApi } from "../../src/startup";
import { createServer } from "../../src/server";

class Runtime extends EventEmitter {
  exitCode: typeof process.exitCode = undefined;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function fixture() {
  const runtime = new Runtime();
  const listen = vi.fn().mockResolvedValue("http://localhost:3001");
  const close = vi.fn().mockResolvedValue(undefined);
  const log = { info: vi.fn(), error: vi.fn() };
  const server = { config: { PORT: 3001 }, listen, close, log } as unknown as FastifyInstance;
  return { runtime, server, listen, close, log, create: vi.fn().mockResolvedValue(server) };
}
beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
afterEach(() => vi.restoreAllMocks());
describe("API process lifecycle", () => {
  it("releases default process handlers through the returned idempotent owner", async () => {
    const h = fixture();
    const before = [process.listeners("SIGINT"), process.listeners("SIGTERM")];
    vi.mocked(createServer).mockResolvedValueOnce(h.server);
    const owner = await startApi();
    try {
      expect(owner).toBeDefined();
      const first = owner!.close();
      expect(owner!.close()).toBe(first);
      await first;
      expect(h.close).toHaveBeenCalledTimes(1);
      expect(process.listeners("SIGINT")).toEqual(before[0]);
      expect(process.listeners("SIGTERM")).toEqual(before[1]);
    } finally {
      await owner?.close();
    }
  });
  it("retains the configured bind address and preserves existing exit state on success", async () => {
    const h = fixture();
    h.runtime.exitCode = 2;
    await startApi(h.create, h.runtime);
    expect(h.listen).toHaveBeenCalledExactlyOnceWith({ port: 3001, host: "::" });
    expect(h.log.info).toHaveBeenCalledTimes(1);
    expect(h.close).not.toHaveBeenCalled();
    expect(h.runtime.exitCode).toBe(2);
  });
  it("marks factory failure unsuccessful without leaving signal listeners", async () => {
    const h = fixture();
    const failure = new Error("Synthetic factory failure");
    h.create.mockRejectedValueOnce(failure);
    await startApi(h.create, h.runtime);
    expect(h.runtime.exitCode).toBe(1);
    expect(console.error).toHaveBeenCalledExactlyOnceWith("API startup failed", failure);
    expect(h.close).not.toHaveBeenCalled();
    expect(h.runtime.listenerCount("SIGINT")).toBe(0);
    expect(h.runtime.listenerCount("SIGTERM")).toBe(0);
  });
  it("closes acquired resources and removes only its own listeners after listen failure", async () => {
    const h = fixture();
    const other = vi.fn();
    h.runtime.on("SIGINT", other);
    h.listen.mockRejectedValueOnce(new Error("Synthetic listen failure"));
    await startApi(h.create, h.runtime);
    expect(h.close).toHaveBeenCalledTimes(1);
    expect(h.runtime.exitCode).toBe(1);
    expect(h.runtime.listeners("SIGINT")).toEqual([other]);
    expect(h.runtime.listenerCount("SIGTERM")).toBe(0);
    expect(h.log.info).not.toHaveBeenCalled();
  });
  it("waits for failed-listen cleanup before completing", async () => {
    const h = fixture();
    const gate = deferred<void>();
    h.listen.mockRejectedValueOnce(new Error("Synthetic listen failure"));
    h.close.mockReturnValueOnce(gate.promise);
    let completed = false;
    const start = startApi(h.create, h.runtime).then(() => {
      completed = true;
    });
    await vi.waitFor(() => expect(h.close).toHaveBeenCalledTimes(1));
    expect(completed).toBe(false);
    gate.resolve();
    await start;
    expect(completed).toBe(true);
  });
  it.each(["SIGINT", "SIGTERM"] as const)(
    "shares one shutdown for repeated %s and the other signal",
    async (signal) => {
      const h = fixture();
      const gate = deferred<void>();
      h.close.mockReturnValueOnce(gate.promise);
      await startApi(h.create, h.runtime);
      h.runtime.emit(signal);
      h.runtime.emit(signal);
      h.runtime.emit(signal === "SIGINT" ? "SIGTERM" : "SIGINT");
      await vi.waitFor(() => expect(h.close).toHaveBeenCalledTimes(1));
      gate.resolve();
      await vi.waitFor(() =>
        expect(h.runtime.listenerCount("SIGINT") + h.runtime.listenerCount("SIGTERM")).toBe(0),
      );
      expect(h.runtime.exitCode).toBeUndefined();
    },
  );
  it("records close failure and removes both owned signal listeners", async () => {
    const h = fixture();
    const failure = new Error("Synthetic close failure");
    h.close.mockRejectedValueOnce(failure);
    await startApi(h.create, h.runtime);
    h.runtime.emit("SIGTERM");
    await vi.waitFor(() => expect(h.runtime.exitCode).toBe(1));
    expect(h.log.error).toHaveBeenCalledWith(failure);
    expect(h.runtime.listenerCount("SIGINT") + h.runtime.listenerCount("SIGTERM")).toBe(0);
  });
  it("preserves startup failure when cleanup rejects", async () => {
    const h = fixture();
    const failure = new Error("Synthetic listen failure");
    h.listen.mockRejectedValueOnce(failure);
    h.close.mockRejectedValueOnce(new Error("Synthetic close failure"));
    await startApi(h.create, h.runtime);
    expect(h.close).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledExactlyOnceWith("API startup failed", failure);
    expect(h.runtime.exitCode).toBe(1);
  });
  it("honors a signal while the factory is pending without starting a listener", async () => {
    const h = fixture();
    const gate = deferred<FastifyInstance>();
    h.create.mockReturnValueOnce(gate.promise);
    const start = startApi(h.create, h.runtime);
    h.runtime.emit("SIGTERM");
    gate.resolve(h.server);
    await start;
    expect(h.listen).not.toHaveBeenCalled();
    expect(h.close).toHaveBeenCalledTimes(1);
    expect(h.runtime.listenerCount("SIGINT") + h.runtime.listenerCount("SIGTERM")).toBe(0);
  });
  it("does not announce startup if shutdown starts while listen is pending", async () => {
    const h = fixture();
    const gate = deferred<string>();
    h.listen.mockReturnValueOnce(gate.promise);
    const start = startApi(h.create, h.runtime);
    await vi.waitFor(() => expect(h.listen).toHaveBeenCalled());
    h.runtime.emit("SIGTERM");
    gate.resolve("http://localhost:3001");
    await start;
    expect(h.log.info).not.toHaveBeenCalled();
    expect(h.close).toHaveBeenCalledTimes(1);
  });
});
