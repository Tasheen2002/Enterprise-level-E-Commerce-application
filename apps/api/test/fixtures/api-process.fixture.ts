import assert from "node:assert/strict";
import { createServer as createHttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import Fastify from "fastify";
import { startApi } from "../../src/startup";
import type { Config } from "../../src/plugins/config";

// Child-process fixture: synthetic Fastify only; no application factory or DB/provider is called.
async function main() {
  const mode = process.argv[2];
  assert.ok(["graceful", "factory-failure", "listen-failure", "close-failure"].includes(mode!));
  const before = [process.listenerCount("SIGINT"), process.listenerCount("SIGTERM")];
  if (mode === "factory-failure") {
    await startApi(async () => {
      throw new Error("Synthetic factory failure");
    });
    assert.equal(process.exitCode, 1);
    assert.equal(process.listenerCount("SIGINT"), before[0]);
    assert.equal(process.listenerCount("SIGTERM"), before[1]);
    console.log(JSON.stringify({ mode, cleaned: true }));
    return;
  }
  const app = Fastify({ logger: false });
  let closed = 0;
  app.addHook("onClose", async () => {
    closed++;
    if (mode === "close-failure") throw new Error("Synthetic close failure");
  });
  const blocker = createHttpServer();
  try {
    let port = 0;
    if (mode === "listen-failure") {
      await new Promise<void>((resolve) => blocker.listen({ port: 0, host: "::" }, resolve));
      port = (blocker.address() as AddressInfo).port;
    }
    app.decorate("config", { PORT: port } as Config);
    await app.ready();
    const owner = await startApi(async () => app);
    if (mode !== "listen-failure") {
      assert.ok(app.server.listening);
      // Emit Node signal events portably. This does not claim native OS signal delivery on Windows.
      process.emit("SIGINT");
      process.emit("SIGINT");
      process.emit("SIGTERM");
      await owner!.close();
    }
    assert.equal(closed, 1);
    assert.equal(app.server.listening, false);
    assert.equal(process.listenerCount("SIGINT"), before[0]);
    assert.equal(process.listenerCount("SIGTERM"), before[1]);
    assert.equal(process.exitCode, mode === "graceful" ? undefined : 1);
    console.log(JSON.stringify({ mode, closed, cleaned: true }));
  } finally {
    if (blocker.listening)
      await new Promise<void>((resolve, reject) =>
        blocker.close((error) => (error ? reject(error) : resolve())),
      );
    await app.close().catch(() => {});
  }
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
