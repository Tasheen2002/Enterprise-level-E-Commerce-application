import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  ProductRepositoryImpl,
  imageMimeType,
} from "@modules/product-catalog/infra/persistence/repositories/product.repository.impl";
import { Product } from "@modules/product-catalog/domain/entities/product.entity";
import { ProductStatus } from "@modules/product-catalog/domain/value-objects";

const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

const image = (name: string) => `https://ik.imagekit.io/example/${name}`;

describe("product save", () => {
  it("rolls back the whole save when writing the image list fails part-way", async () => {
    const repository = new ProductRepositoryImpl(prisma);
    const product = Product.create({
      title: "Original title",
      price: 10,
      status: ProductStatus.PUBLISHED,
      images: [image("a.jpg"), image("b.jpg")],
    });
    await repository.save(product);

    // Second media insert of the next save fails (e.g. connection drop).
    let creates = 0;
    const failing = prisma.$extends({
      query: {
        productMedia: {
          async create({ args, query }) {
            creates += 1;
            if (creates === 2) throw new Error("simulated failure while writing images");
            return query(args);
          },
        },
      },
    }) as unknown as PrismaClient;
    const loaded = (await new ProductRepositoryImpl(failing).findById(product.id))!;
    loaded.updateTitle("Changed title");
    loaded.updateImages([image("c.jpg"), image("d.jpg"), image("e.jpg")]);
    await expect(new ProductRepositoryImpl(failing).save(loaded)).rejects.toThrow(
      "simulated failure",
    );

    const row = await prisma.product.findUnique({
      where: { id: product.id.getValue() },
      include: { media: { include: { asset: true }, orderBy: { position: "asc" } } },
    });
    expect(row?.title).toBe("Original title");
    expect(row?.media.map((m) => m.asset.storageKey)).toEqual([image("a.jpg"), image("b.jpg")]);
  });

  it("records the image type from the file extension", async () => {
    const repository = new ProductRepositoryImpl(prisma);
    const product = Product.create({
      title: "Typed images",
      price: 10,
      images: [image("photo.JPG?tr=w-400"), image("photo.webp"), image("photo.png")],
    });
    await repository.save(product);
    const assets = await prisma.mediaAsset.findMany({
      where: { storageKey: { in: product.images! } },
    });
    expect(Object.fromEntries(assets.map((a) => [a.storageKey, a.mime]))).toEqual({
      [image("photo.JPG?tr=w-400")]: "image/jpeg",
      [image("photo.webp")]: "image/webp",
      [image("photo.png")]: "image/png",
    });
    expect(imageMimeType("https://x/unknown")).toBe("application/octet-stream");
  });
});
