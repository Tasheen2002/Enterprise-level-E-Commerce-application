import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  construct: vi.fn(),
  disconnect: vi.fn(),
  transaction: vi.fn(),
  remove: vi.fn(),
  category: vi.fn(),
  location: vi.fn(),
  product: vi.fn(),
  link: vi.fn(),
  findAsset: vi.fn(),
  asset: vi.fn(),
  media: vi.fn(),
  variant: vi.fn(),
  stock: vi.fn(),
}));
const tx = {
  ...Object.fromEntries(
    [
      "wishlistItem",
      "wishlist",
      "cartItem",
      "shoppingCart",
      "inventoryTransaction",
      "stockAlert",
      "reservation",
      "inventoryStock",
      "productCategory",
      "productMedia",
      "mediaAsset",
      "productVariant",
      "product",
      "category",
      "location",
    ].map((name) => [name, { deleteMany: h.remove }]),
  ),
  category: { create: h.category, deleteMany: h.remove },
  location: { create: h.location, deleteMany: h.remove },
  product: { create: h.product, deleteMany: h.remove },
  productCategory: { create: h.link, deleteMany: h.remove },
  mediaAsset: { findFirst: h.findAsset, create: h.asset, deleteMany: h.remove },
  productMedia: { create: h.media, deleteMany: h.remove },
  productVariant: { create: h.variant, deleteMany: h.remove },
  inventoryStock: { create: h.stock, deleteMany: h.remove },
};
vi.mock("@prisma/client", () => ({
  ProductStatusEnum: { published: "published" },
  LocationTypeEnum: { warehouse: "warehouse" },
  PrismaClient: class {
    constructor(options: unknown) {
      h.construct(options);
    }
    $transaction = h.transaction;
    $disconnect = h.disconnect;
  },
}));
const success = "Disposable test catalog seed committed.";
const failure = "Test catalog seed refused or failed; check disposable test settings.";
let previousExit: typeof process.exitCode;
beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  previousExit = process.exitCode;
  process.exitCode = undefined;
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("ALLOW_DATABASE_TEST_CLEANUP", "1");
  vi.stubEnv("ALLOW_OPERATIONAL_DATABASE_WRITES", "1");
  vi.stubEnv("TEST_DATABASE_URL", "postgresql://localhost/catalog_seed_test");
  h.transaction.mockImplementation(async (operation) => operation(tx));
  for (const insert of [h.category, h.location, h.product, h.asset, h.variant])
    insert.mockImplementation(async ({ data }) => data);
  h.findAsset.mockResolvedValue(null);
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
  await import("../../../../scratch/seed-development-db");
  await vi.waitFor(() => {
    expect(
      vi.mocked(console.log).mock.calls.some(([value]) => value === success) ||
        vi.mocked(console.error).mock.calls.length === 1,
    ).toBe(true);
  });
}
function expectFailure() {
  expect(console.log).not.toHaveBeenCalledWith(success);
  expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining("seeded successfully"));
  expect(console.error).toHaveBeenCalledExactlyOnceWith(failure);
  expect(process.exitCode).toBe(1);
}
describe("disposable catalog seed CLI", () => {
  it("seeds the catalog in one bounded transaction and reports success after disconnect", async () => {
    h.disconnect.mockImplementation(async () => {
      expect(console.log).not.toHaveBeenCalledWith(success);
    });
    await run();
    expect(h.construct).toHaveBeenCalledWith({
      datasources: { db: { url: process.env.TEST_DATABASE_URL } },
    });
    expect(h.transaction).toHaveBeenCalledExactlyOnceWith(expect.any(Function), {
      timeout: 60_000,
    });
    expect(h.remove).toHaveBeenCalledTimes(15);
    expect(h.category).toHaveBeenCalledTimes(24);
    expect(h.product).toHaveBeenCalledTimes(28);
    expect(h.variant).toHaveBeenCalledTimes(97);
    expect(h.stock).toHaveBeenCalledTimes(97);
    const categories = h.category.mock.calls.map(([{ data }]) => data);
    const products = h.product.mock.calls.map(([{ data }]) => data);
    const variants = h.variant.mock.calls.map(([{ data }]) => data);
    const categoryIds = new Set(categories.map((row) => row.id));
    const productIds = new Set(products.map((row) => row.id));
    const variantIds = new Set(variants.map((row) => row.id));
    expect(categoryIds.size).toBe(24);
    expect(productIds.size).toBe(28);
    expect(variantIds.size).toBe(97);
    expect(new Set(categories.map((row) => row.slug)).size).toBe(24);
    expect(new Set(products.map((row) => row.slug)).size).toBe(28);
    expect(new Set(variants.map((row) => row.sku)).size).toBe(97);
    for (const category of categories)
      if (category.parentId !== null) expect(categoryIds.has(category.parentId)).toBe(true);
    for (const [{ data }] of h.link.mock.calls) {
      expect(categoryIds.has(data.categoryId)).toBe(true);
      expect(productIds.has(data.productId)).toBe(true);
    }
    for (const variant of variants) expect(productIds.has(variant.productId)).toBe(true);
    for (const [{ data }] of h.stock.mock.calls) {
      expect(variantIds.has(data.variantId)).toBe(true);
      expect(data.locationId).toBe(h.location.mock.calls[0][0].data.id);
      expect(Number.isInteger(data.onHand) && data.onHand >= 0).toBe(true);
    }
    for (const product of products)
      expect(product.price > 0 && Number.isFinite(product.price)).toBe(true);
    expect(h.stock).toHaveBeenCalledWith({
      data: expect.objectContaining({ onHand: 15, reserved: 0 }),
    });
    expect(h.stock).toHaveBeenCalledWith({
      data: expect.objectContaining({ onHand: 50, reserved: 0 }),
    });
    expect(h.asset).toHaveBeenCalledWith({ data: expect.objectContaining({ mime: "image/jpeg" }) });
    expect(h.asset).toHaveBeenCalledWith({ data: expect.objectContaining({ mime: "image/png" }) });
    expect(h.media).toHaveBeenCalledWith({
      data: expect.objectContaining({ position: 1, isCover: true }),
    });
    expect(h.media).toHaveBeenCalledWith({
      data: expect.objectContaining({ position: 2, isCover: false }),
    });
    expect(h.disconnect).toHaveBeenCalledOnce();
    expect(console.log).toHaveBeenCalledWith(success);
    expect(console.error).not.toHaveBeenCalled();
    expect(process.exitCode).toBeUndefined();
  });
  it.each(["opt-in", "target"])("refuses unsafe %s before construction", async (mode) => {
    if (mode === "opt-in") vi.stubEnv("ALLOW_OPERATIONAL_DATABASE_WRITES", undefined);
    else vi.stubEnv("TEST_DATABASE_URL", "postgresql://localhost/development");
    await run();
    expectFailure();
    expect(h.construct).not.toHaveBeenCalled();
    expect(h.transaction).not.toHaveBeenCalled();
    expect(h.disconnect).not.toHaveBeenCalled();
  });
  it("handles constructor failure without attempting disconnect", async () => {
    h.construct.mockImplementation(() => {
      throw new Error("private constructor error");
    });
    await run();
    expectFailure();
    expect(h.disconnect).not.toHaveBeenCalled();
  });
  it("reuses a media asset returned by lookup", async () => {
    h.findAsset.mockResolvedValue({ id: "existing-fixture-asset" });
    await run();
    expect(h.asset).not.toHaveBeenCalled();
    expect(h.media).toHaveBeenCalledWith({
      data: expect.objectContaining({ assetId: "existing-fixture-asset" }),
    });
  });
  it.each(["transaction", "remove", "variant", "stock", "disconnect"] as const)(
    "fails safely on %s without announcing fixture success",
    async (stage) => {
      h[stage].mockRejectedValueOnce(new Error("private driver failure"));
      await run();
      expectFailure();
      expect(h.disconnect).toHaveBeenCalledOnce();
    },
  );
  it("fails safely when both transaction and disconnect reject", async () => {
    h.transaction.mockRejectedValueOnce(new Error("private transaction failure"));
    h.disconnect.mockRejectedValueOnce(new Error("private disconnect failure"));
    await run();
    expectFailure();
    expect(h.disconnect).toHaveBeenCalledOnce();
  });
});
