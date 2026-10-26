import type { FastifyInstance } from "fastify";
import { createServer } from "./server";

type ShutdownSignal = "SIGINT" | "SIGTERM";
export interface ApiProcessRuntime {
  on(signal: ShutdownSignal, handler: () => void): unknown;
  off(signal: ShutdownSignal, handler: () => void): unknown;
  exitCode: typeof process.exitCode;
}

export interface ApiLifecycle {
  /**
   * Close the API and release its process signal handlers. Failures are logged
   * and set runtime.exitCode; the promise settles after the cleanup attempt.
   */
  close(): Promise<void>;
}

export async function startApi(
  create: () => Promise<FastifyInstance> = createServer,
  runtime: ApiProcessRuntime = process,
): Promise<ApiLifecycle | undefined> {
  const signals = ["SIGINT", "SIGTERM"] as const;
  let server: FastifyInstance | undefined;
  let shutdownRequested = false;
  let closing: Promise<void> | undefined;
  const detach = () => {
    for (const signal of signals) runtime.off(signal, onSignal);
  };
  const close = (): Promise<void> => {
    shutdownRequested = true;
    closing ??= Promise.resolve()
      .then(() => server!.close())
      .catch((error: unknown) => {
        server!.log.error(error);
        runtime.exitCode = 1;
      })
      .finally(detach);
    return closing;
  };
  const onSignal = () => {
    shutdownRequested = true;
    if (server) void close();
  };
  try {
    for (const signal of signals) runtime.on(signal, onSignal);
    server = await create();
    if (shutdownRequested) {
      await close();
      return { close };
    }
    const port = server.config.PORT;
    await server.listen({ port, host: "::" });
    if (!shutdownRequested)
      server.log.info(`Swagger docs available at http://localhost:${port}/docs`);
    return { close };
  } catch (err) {
    if (server) await close();
    else detach();
    console.error("API startup failed", err);
    runtime.exitCode = 1;
  }
}
