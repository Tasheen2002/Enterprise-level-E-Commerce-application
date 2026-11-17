import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createServer } from "@/api/src/server";
import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import * as bcrypt from "bcryptjs";

// Shoppers only see live catalog content; staff see drafts, scheduled
// launches and archived items through the same public routes.
const prisma = new PrismaClient();
const DAY = 86_400_000;

describe("Catalog storefront visibility", () => {
  let app: FastifyInstance;
  let adminToken: string;
  const ids: Record<string, string> = {};

  beforeAll(async () => {
    app = await createServer();
  });

  beforeEach(async () => {
    const product = async (
      key: string,
      status: "draft" | "published" | "scheduled" | "archived",
      publishAt: Date | null = null,
    ) => {
      const id = randomUUID();
      ids[key] = id;
      await prisma.product.create({
        data: {
          id,
          title: `Visibility ${key}`,
          slug: `vis-${key}-${id}`,
          price: 10,
          status,
          publishAt,
        },
      });
      return id;
    };
    await product("published", "published");
    await product("draft", "draft");
    await product("archived", "archived");
    await product("launched", "scheduled", new Date(Date.now() - DAY));
    await product("upcoming", "scheduled", new Date(Date.now() + DAY));
    ids.draftVariant = (
      await prisma.productVariant.create({
        data: { productId: ids.draft!, sku: `VIS-${randomUUID().toUpperCase()}`, price: 10 },
      })
    ).id;
    ids.liveLook = (
      await prisma.editorialLook.create({
        data: { title: "Live look", publishedAt: new Date(Date.now() - DAY) },
      })
    ).id;
    ids.draftLook = (await prisma.editorialLook.create({ data: { title: "Draft look" } })).id;

    const email = `catalog-admin-${randomUUID()}@example.com`;
    await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash("Admin#Pass1", 4),
        role: "ADMIN",
        emailVerified: true,
      },
    });
    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email, password: "Admin#Pass1", ipAddress: "127.0.0.1" },
    });
    adminToken = login.json().data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  const get = (url: string, staff = false) =>
    app.inject({
      method: "GET",
      url: `/api/v1${url}`,
      headers: staff ? { authorization: `Bearer ${adminToken}` } : {},
    });
  const listed = async (url: string, staff = false) => {
    const body = (await get(url, staff)).json().data;
    return { ids: (body.items as Array<{ id: string }>).map((p) => p.id), total: body.total };
  };

  it("lists only live products to shoppers, whatever filters they send", async () => {
    for (const query of [
      "",
      "?includeDrafts=true",
      "?status=draft",
      "?status=scheduled&includeDrafts=true",
    ]) {
      const { ids: seen, total } = await listed(`/products${query}`);
      expect(seen.sort(), query).toEqual([ids.launched!, ids.published!].sort());
      expect(total, query).toBe(2);
    }
  });

  it("lets staff list unpublished products, and includeDrafts=false means false", async () => {
    expect((await listed("/products?includeDrafts=true", true)).total).toBe(5);
    expect((await listed("/products?includeDrafts=false", true)).total).toBe(2);
    expect((await listed("/products?status=draft", true)).ids).toEqual([ids.draft]);
  });

  it("hides products that are not live from detail, slug, variants and media for shoppers", async () => {
    for (const key of ["draft", "archived", "upcoming"]) {
      expect((await get(`/products/${ids[key]}`)).statusCode, key).toBe(404);
    }
    const draft = await prisma.product.findUnique({ where: { id: ids.draft } });
    expect((await get(`/products/slug/${draft!.slug}`)).statusCode).toBe(404);
    expect((await get(`/products/${ids.draft}/variants`)).statusCode).toBe(404);
    expect((await get(`/variants/${ids.draftVariant}`)).statusCode).toBe(404);
    expect((await get(`/products/${ids.draft}/media`)).statusCode).toBe(404);

    expect((await get(`/products/${ids.launched}`)).statusCode).toBe(200);
    expect((await get(`/products/${ids.draft}`, true)).statusCode).toBe(200);
    expect((await get(`/variants/${ids.draftVariant}`, true)).statusCode).toBe(200);
  });

  it("does not let shoppers search by unpublished status", async () => {
    const res = await get("/search?q=Visibility&status=draft");
    expect(res.statusCode).toBe(200);
    const seen = (res.json().data.items as Array<{ id: string }>).map((p) => p.id);
    expect(seen).not.toContain(ids.draft);
    expect(seen).not.toContain(ids.upcoming);
  });

  it("shows shoppers only published editorial looks", async () => {
    const seen = (await listed("/editorial-looks?draft=true")).ids;
    expect(seen).toContain(ids.liveLook);
    expect(seen).not.toContain(ids.draftLook);
    expect((await get(`/editorial-looks/${ids.draftLook}`)).statusCode).toBe(404);
    expect((await get(`/editorial-looks/${ids.draftLook}`, true)).statusCode).toBe(200);
  });
});
