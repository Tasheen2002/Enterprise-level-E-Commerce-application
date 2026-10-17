import "dotenv/config";
import { createServer } from "./server";

const start = async () => {
  try {
    const server = await createServer();
    for (const signal of ["SIGINT", "SIGTERM"] as const)
      process.once(signal, () => {
        void server.close().catch((error) => {
          server.log.error(error);
          process.exitCode = 1;
        });
      });
    const port = server.config.PORT;
    await server.listen({ port, host: "::" });
    server.log.info(`Swagger docs available at http://localhost:${port}/docs`);
  } catch (err) {
    console.error("API startup failed", err);
    process.exitCode = 1;
  }
};

start();
