import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { inspectWalletProducts } from "../../../../scripts/testing/wallet-inspection";

const env = {
  NODE_ENV: "test",
  ALLOW_DATABASE_TEST_CLEANUP: "1",
  ALLOW_OPERATIONAL_DATABASE_WRITES: "1",
  TEST_DATABASE_URL: "postgresql://localhost/inspection_test",
  TEST_PRODUCT_TITLE_PREFIX: " Mabillon ",
};
const media = (index: number) => ({
  position: index === 0 ? null : index,
  isCover: index === 1,
  asset: { mime: "image/jpeg", storageKey: index === 0 ? "  " : "PRIVATE_STORAGE_PATH", bytes: 1n },
  caption: "unselected",
});
const product = (index: number, count = 0) => ({
  title: `Mabillon ${index}`,
  slug: `wallet-${index}`,
  longDescHtml: "unselected",
  media: Array.from({ length: count }, (_, i) => media(i)),
});
function fixture(products = [product(0, 2)]) {
  const client = {
    product: { findMany: vi.fn().mockResolvedValue(products) },
    $disconnect: vi.fn().mockResolvedValue(undefined),
  };
  return { client, create: vi.fn(() => client as unknown as PrismaClient), report: vi.fn() };
}

describe("bounded wallet product attachment inspection", () => {
  it("selects only ordered bounded metadata with an explicit literal prefix and hides raw paths", async () => {
    const h = fixture();
    await inspectWalletProducts(env, h.create, h.report);
    expect(h.create).toHaveBeenCalledExactlyOnceWith(env.TEST_DATABASE_URL);
    expect(h.client.product.findMany).toHaveBeenCalledExactlyOnceWith({
      where: { title: { startsWith: "Mabillon" } },
      orderBy: { slug: "asc" },
      take: 21,
      select: {
        title: true,
        slug: true,
        media: {
          orderBy: [{ position: { sort: "asc", nulls: "last" } }, { id: "asc" }],
          take: 21,
          select: {
            position: true,
            isCover: true,
            asset: { select: { mime: true, storageKey: true } },
          },
        },
      },
    });
    expect(h.report).toHaveBeenCalledExactlyOnceWith({
      scope: "product-title-prefix",
      productsTruncated: false,
      products: [
        {
          title: "Mabillon 0",
          slug: "wallet-0",
          mediaTruncated: false,
          media: [
            { position: null, isCover: false, mime: "image/jpeg", storageKeyPresent: false },
            { position: 1, isCover: true, mime: "image/jpeg", storageKeyPresent: true },
          ],
        },
      ],
    });
    expect(h.client.$disconnect).toHaveBeenCalledOnce();
  });

  it("reports no matches explicitly", async () => {
    const h = fixture([]);
    await inspectWalletProducts(env, h.create, h.report);
    expect(h.report).toHaveBeenCalledExactlyOnceWith({
      scope: "product-title-prefix",
      productsTruncated: false,
      products: [],
    });
  });

  it.each([20, 21])("reports product and media limits truthfully at %i rows", async (count) => {
    const h = fixture(Array.from({ length: count }, (_, i) => product(i, count)));
    await inspectWalletProducts(env, h.create, h.report);
    const summary = h.report.mock.calls[0][0];
    expect(summary.productsTruncated).toBe(count > 20);
    expect(summary.products).toHaveLength(20);
    expect(
      summary.products.every(
        (p: { mediaTruncated: boolean; media: unknown[] }) =>
          p.mediaTruncated === count > 20 && p.media.length === 20,
      ),
    ).toBe(true);
    expect(JSON.stringify(summary)).not.toContain("PRIVATE_STORAGE_PATH");
  });

  it("accepts a 100-character literal prefix and products without media", async () => {
    const h = fixture([product(0)]);
    await inspectWalletProducts(
      { ...env, TEST_PRODUCT_TITLE_PREFIX: "a".repeat(100) },
      h.create,
      h.report,
    );
    expect(h.report.mock.calls[0][0].products[0].media).toEqual([]);
  });

  it.each([undefined, "", " ", "a".repeat(101), "%", "_", "a\\b", "a\nb", "a\u0000b", "a\u007fb"])(
    "rejects absent, oversized, control or LIKE-wildcard prefixes before construction",
    async (prefix) => {
      const h = fixture();
      await expect(
        inspectWalletProducts({ ...env, TEST_PRODUCT_TITLE_PREFIX: prefix }, h.create, h.report),
      ).rejects.toThrow("Provide a literal TEST_PRODUCT_TITLE_PREFIX");
      expect(h.create).not.toHaveBeenCalled();
      expect(h.report).not.toHaveBeenCalled();
    },
  );

  it.each([
    { NODE_ENV: "production" },
    { TEST_DATABASE_URL: "postgresql://localhost/application" },
    { ALLOW_OPERATIONAL_DATABASE_WRITES: undefined },
  ])("rejects unsafe database settings before construction", async (patch) => {
    const h = fixture();
    await expect(inspectWalletProducts({ ...env, ...patch }, h.create, h.report)).rejects.toThrow();
    expect(h.create).not.toHaveBeenCalled();
  });

  it("propagates construction failure without output", async () => {
    const h = fixture();
    h.create.mockImplementation(() => {
      throw new Error("construction failed");
    });
    await expect(inspectWalletProducts(env, h.create, h.report)).rejects.toThrow(
      "construction failed",
    );
    expect(h.report).not.toHaveBeenCalled();
  });

  it("disconnects after query failure without partial output", async () => {
    const h = fixture();
    const failure = new Error("query failed");
    h.client.product.findMany.mockRejectedValueOnce(failure);
    await expect(inspectWalletProducts(env, h.create, h.report)).rejects.toBe(failure);
    expect(h.report).not.toHaveBeenCalled();
    expect(h.client.$disconnect).toHaveBeenCalledOnce();
  });

  it("disconnects after output failure", async () => {
    const h = fixture();
    h.report.mockImplementation(() => {
      throw new Error("output failed");
    });
    await expect(inspectWalletProducts(env, h.create, h.report)).rejects.toThrow("output failed");
    expect(h.client.$disconnect).toHaveBeenCalledOnce();
  });

  it("propagates disconnect failure", async () => {
    const h = fixture();
    h.client.$disconnect.mockRejectedValueOnce(new Error("disconnect failed"));
    await expect(inspectWalletProducts(env, h.create, h.report)).rejects.toThrow(
      "disconnect failed",
    );
  });

  it("retains both query and disconnect errors", async () => {
    const h = fixture(),
      first = new Error("query failed"),
      second = new Error("disconnect failed");
    h.client.product.findMany.mockRejectedValueOnce(first);
    h.client.$disconnect.mockRejectedValueOnce(second);
    await expect(inspectWalletProducts(env, h.create, h.report)).rejects.toMatchObject({
      errors: [first, second],
    });
  });
});
