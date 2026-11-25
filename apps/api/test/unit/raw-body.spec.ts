import { afterEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import rawBodyPlugin from "../../src/plugins/raw-body";

const apps: FastifyInstance[] = [];
afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

async function application(bodyLimit?: number) {
  const app = Fastify(bodyLimit ? { bodyLimit } : {});
  apps.push(app);
  await app.register(rawBodyPlugin);
  app.post("/signed", { config: { rawBody: true } }, async (request) => ({
    raw: request.rawBody?.toString("utf8") ?? null,
    isBuffer: Buffer.isBuffer(request.rawBody),
    body: request.body,
  }));
  app.post("/plain", async (request) => ({ raw: request.rawBody ?? null, body: request.body }));
  return app;
}

const post = (app: FastifyInstance, url: string, payload: string, type = "application/json") =>
  app.inject({ method: "POST", url, payload, headers: { "content-type": type } });

describe("raw body capture for signed payloads", () => {
  it("keeps the exact received bytes on opted-in routes and still parses JSON", async () => {
    const app = await application();
    const payload = '{ "type" : "evt",\n  "n": 1 }';
    for (const type of ["application/json", "application/json; charset=utf-8"]) {
      const response = await post(app, "/signed", payload, type);
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        raw: payload,
        isBuffer: true,
        body: { type: "evt", n: 1 },
      });
    }
  });

  it("does not retain raw bytes on routes that did not opt in", async () => {
    const app = await application();
    const response = await post(app, "/plain", '{"a":1}');
    expect(response.json()).toEqual({ raw: null, body: { a: 1 } });
  });

  it.each([
    ["prototype poisoning", '{"__proto__":{"polluted":true}}', 400],
    ["constructor poisoning", '{"constructor":{"prototype":{"polluted":true}}}', 400],
    ["invalid JSON", "{", 400],
  ])(
    "keeps Fastify's default rejection for %s on both route kinds",
    async (_label, payload, status) => {
      const app = await application();
      for (const url of ["/signed", "/plain"])
        expect((await post(app, url, payload)).statusCode).toBe(status);
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    },
  );

  it("rejects an empty JSON body and enforces the body limit", async () => {
    const app = await application(32);
    expect((await post(app, "/signed", "")).statusCode).toBe(400);
    expect(
      (await post(app, "/signed", JSON.stringify({ padding: "x".repeat(64) }))).statusCode,
    ).toBe(413);
  });
});
