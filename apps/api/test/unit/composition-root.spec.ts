import { afterEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import {
  Container,
  createCartCatalogPorts,
  createOrderCatalogPorts,
  unconfiguredFirebaseVerifier,
  type ContainerConfig,
} from "../../src/container";
import { envSchema } from "../../src/plugins/config";
import {
  MediaAssetNotFoundError,
  ProductNotFoundError,
  ProductVariantNotFoundError,
} from "../../../../modules/product-catalog/domain/errors/product-catalog.errors";
// Cart ports accept any value-object-like identifier.
const idOf = (value: string) => ({ getValue: () => value });

// Repositories and services are constructed eagerly but stay inert until queried.
const inertPrisma = {} as never;
const baseConfig: ContainerConfig = {
  jwtSecret: "synthetic-composition-secret",
  jwtExpiresIn: "1h",
};
const stripe = { secretKey: "sk_test_synthetic", currency: "usd" };

afterEach(() => vi.unstubAllEnvs());

function registered(config: Partial<ContainerConfig> = {}) {
  const container = new Container();
  container.register(inertPrisma, { ...baseConfig, ...config });
  return container;
}

describe("composition root registration", () => {
  it("serves every module's controllers when optional Stripe is not configured", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    const container = registered();
    const payment = container.getPaymentServices();
    expect(payment.stripeController).toBeNull();
    expect(payment.stripeCardSetupController).toBeNull();
    expect(payment.paymentIntentController).toBeDefined();
    for (const group of [
      container.getUserManagementServices(),
      container.getProductCatalogServices(),
      container.getInventoryManagementServices(),
      container.getCartServices(),
      container.getOrderManagementServices(),
      container.getLoyaltyServices(),
      container.getEngagementServices(),
    ])
      for (const value of Object.values(group)) expect(value).toBeTruthy();
  });

  it("still reports genuinely unknown services", () => {
    expect(() => registered().get("missingService")).toThrow(
      'Service "missingService" not found in container',
    );
  });

  it("derives optional providers from validated configuration, not ambient variables", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_ambient_only");
    expect(registered().getPaymentServices().stripeController).toBeNull();
    const configured = registered({ stripe }).getPaymentServices();
    expect(configured.stripeController).not.toBeNull();
    expect(configured.stripeCardSetupController).not.toBeNull();
  });

  it("refuses a second registration instead of silently replacing live services", () => {
    const container = registered();
    expect(() => container.register(inertPrisma, baseConfig)).toThrow(/already registered/);
  });

  it("keeps independently created containers isolated", () => {
    const first = registered();
    const second = registered({ stripe });
    expect(first.get("eventBus")).not.toBe(second.get("eventBus"));
    expect(first.getPaymentServices().stripeController).toBeNull();
    expect(second.getPaymentServices().stripeController).not.toBeNull();
  });
});

describe("cross-module catalog ports", () => {
  const outage = () => Object.assign(new Error("synthetic database outage"), { code: "P1001" });
  const missing = {
    variantManagementService: {
      getVariantById: vi.fn(async (id: string) => {
        throw new ProductVariantNotFoundError(id);
      }),
    },
    productManagementService: {
      getProductById: vi.fn(async (id: string) => {
        throw new ProductNotFoundError(id);
      }),
    },
    productMediaManagementService: {
      getProductMedia: vi.fn(async (id: string) => {
        throw new ProductNotFoundError(id);
      }),
    },
    mediaManagementService: {
      getAssetById: vi.fn(async (id: string) => {
        throw new MediaAssetNotFoundError(id);
      }),
    },
  };
  const failing = {
    variantManagementService: { getVariantById: vi.fn(async () => Promise.reject(outage())) },
    productManagementService: { getProductById: vi.fn(async () => Promise.reject(outage())) },
    productMediaManagementService: { getProductMedia: vi.fn(async () => Promise.reject(outage())) },
    mediaManagementService: { getAssetById: vi.fn(async () => Promise.reject(outage())) },
  };
  const ids = () => ({
    variant: idOf(randomUUID()),
    product: idOf(randomUUID()),
    asset: idOf(randomUUID()),
  });

  it("maps only catalog not-found errors to absent cart dependencies", async () => {
    const ports = createCartCatalogPorts(missing as never);
    const id = ids();
    expect(await ports.variants.findById(id.variant)).toBeNull();
    expect(await ports.products.findById(id.product)).toBeNull();
    expect(await ports.productMedia.findByProductId(id.product)).toEqual([]);
    expect(await ports.mediaAssets.findById(id.asset)).toBeNull();
  });

  it("propagates infrastructure failures from cart catalog lookups", async () => {
    const ports = createCartCatalogPorts(failing as never);
    const id = ids();
    await expect(ports.variants.findById(id.variant)).rejects.toThrow("synthetic database outage");
    await expect(ports.products.findById(id.product)).rejects.toThrow("synthetic database outage");
    await expect(ports.productMedia.findByProductId(id.product)).rejects.toThrow(
      "synthetic database outage",
    );
    await expect(ports.mediaAssets.findById(id.asset)).rejects.toThrow("synthetic database outage");
  });

  it("maps not-found and propagates outages for order catalog lookups", async () => {
    const absent = createOrderCatalogPorts(missing as never);
    expect(await absent.variants.getVariantById(randomUUID())).toBeNull();
    expect(await absent.products.getProductById(randomUUID())).toBeNull();
    const down = createOrderCatalogPorts(failing as never);
    await expect(down.variants.getVariantById(randomUUID())).rejects.toThrow("outage");
    await expect(down.products.getProductById(randomUUID())).rejects.toThrow("outage");
  });

  it("adapts found catalog records to port shapes", async () => {
    const variantId = randomUUID();
    const productId = randomUUID();
    const found = {
      variantManagementService: {
        getVariantById: vi.fn(async () => ({
          id: variantId,
          productId,
          sku: "SKU-1",
          size: "M",
          color: null,
          weightG: 200,
          dims: { h: 1 },
          allowPreorder: false,
          allowBackorder: true,
          restockEta: "2026-12-01T00:00:00.000Z",
          inventory: undefined,
        })),
      },
      productManagementService: {
        getProductById: vi.fn(async () => ({
          id: productId,
          title: "Slipper",
          slug: "slipper",
          price: 25,
          categoryIds: undefined,
        })),
      },
      productMediaManagementService: {
        getProductMedia: vi.fn(async () => ({ mediaAssets: [{ assetId: "asset-1" }] })),
      },
      mediaManagementService: {
        getAssetById: vi.fn(async () => ({ storageKey: "key", altText: undefined })),
      },
    };
    const cart = createCartCatalogPorts(found as never);
    const variant = await cart.variants.findById(idOf(variantId));
    expect({
      id: variant?.getId().getValue(),
      productId: variant?.getProductId().getValue(),
      sku: variant?.getSku().getValue(),
      size: variant?.getSize(),
      color: variant?.getColor(),
      weightG: variant?.getWeightG(),
      allowPreorder: variant?.getAllowPreorder(),
      allowBackorder: variant?.getAllowBackorder(),
      restockEta: variant?.getRestockEta(),
      inventory: variant?.getInventory(),
    }).toEqual({
      id: variantId,
      productId,
      sku: "SKU-1",
      size: "M",
      color: null,
      weightG: 200,
      allowPreorder: false,
      allowBackorder: true,
      restockEta: new Date("2026-12-01T00:00:00.000Z"),
      inventory: 0,
    });
    found.variantManagementService.getVariantById.mockResolvedValueOnce({
      ...(await found.variantManagementService.getVariantById()),
      restockEta: null,
      inventory: 7,
    } as never);
    const restocked = await cart.variants.findById(idOf(variantId));
    expect([restocked?.getRestockEta(), restocked?.getInventory()]).toEqual([null, 7]);
    const product = await cart.products.findById(idOf(productId));
    expect({
      id: product?.getId().getValue(),
      title: product?.getTitle(),
      slug: product?.getSlug().getValue(),
      price: product?.getPrice().getValue(),
      categoryIds: product?.getCategoryIds?.(),
    }).toEqual({ id: productId, title: "Slipper", slug: "slipper", price: 25, categoryIds: [] });
    const media = await cart.productMedia.findByProductId(idOf(productId));
    expect(media.map((item) => item.getAssetId().getValue())).toEqual(["asset-1"]);
    const asset = await cart.mediaAssets.findById(idOf("asset-1"));
    expect([asset?.getStorageKey(), asset?.getAltText()]).toEqual(["key", null]);
    const order = createOrderCatalogPorts(found as never);
    const orderVariant = await order.variants.getVariantById(variantId);
    expect({
      id: orderVariant?.getId().getValue(),
      productId: orderVariant?.getProductId().getValue(),
      sku: orderVariant?.getSku().getValue(),
      size: orderVariant?.getSize(),
      color: orderVariant?.getColor(),
      weightG: orderVariant?.getWeightG(),
      dims: orderVariant?.getDims(),
    }).toEqual({
      id: variantId,
      productId,
      sku: "SKU-1",
      size: "M",
      color: null,
      weightG: 200,
      dims: { h: 1 },
    });
    const orderProduct = await order.products.getProductById(productId);
    expect([
      orderProduct?.getId().getValue(),
      orderProduct?.getTitle(),
      orderProduct?.getPrice().getValue(),
    ]).toEqual([productId, "Slipper", 25]);
  });
});

describe("unconfigured optional providers", () => {
  it("reports Firebase sign-in and phone verification as unavailable (503)", async () => {
    for (const verify of [
      () => unconfiguredFirebaseVerifier.verifyIdToken("token"),
      () => unconfiguredFirebaseVerifier.verifyPhoneIdToken("token"),
    ])
      await expect(verify()).rejects.toMatchObject({
        statusCode: 503,
        message: expect.stringMatching(/not configured on this server/),
      });
  });
});

describe("provider configuration contract", () => {
  const base = {
    DATABASE_URL: "postgresql://synthetic:synthetic@localhost/synthetic",
    JWT_SECRET: "synthetic-secret",
  };

  it("validates Stripe, ImageKit, webhook and stock-location settings", () => {
    const parsed = envSchema.parse({
      ...base,
      STRIPE_SECRET_KEY: " sk_test_x ",
      STRIPE_WEBHOOK_SECRET: "whsec_x",
      STRIPE_CURRENCY: "LKR",
      IMAGEKIT_PUBLIC_KEY: "public",
      IMAGEKIT_PRIVATE_KEY: "private",
      PAYPAL_WEBHOOK_SECRET: "paypal",
      RAZORPAY_WEBHOOK_SECRET: "razorpay",
      DEFAULT_STOCK_LOCATION: "6f1c2c5e-9b1a-4c3d-8e2f-1a2b3c4d5e6f",
    });
    expect(parsed).toMatchObject({
      STRIPE_SECRET_KEY: "sk_test_x",
      STRIPE_CURRENCY: "lkr",
      IMAGEKIT_PUBLIC_KEY: "public",
      DEFAULT_STOCK_LOCATION: "6f1c2c5e-9b1a-4c3d-8e2f-1a2b3c4d5e6f",
    });
    expect(envSchema.parse(base).STRIPE_CURRENCY).toBe("usd");
  });

  it.each([
    { IMAGEKIT_PUBLIC_KEY: "public-only" },
    { IMAGEKIT_PRIVATE_KEY: "private-only" },
    { STRIPE_CURRENCY: "dollars" },
    { DEFAULT_STOCK_LOCATION: "main-warehouse" },
    { STRIPE_SECRET_KEY: " " },
  ])("rejects incomplete or malformed provider settings %j", (settings) => {
    expect(envSchema.safeParse({ ...base, ...settings }).success).toBe(false);
  });
});
