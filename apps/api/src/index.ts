import { createServer } from "./server";

const start = async () => {
  const server = await createServer();

  try {
    const port = server.config.PORT;
    await server.listen({ port, host: "0.0.0.0" });
    server.log.info(`Swagger docs available at http://localhost:${port}/docs`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
