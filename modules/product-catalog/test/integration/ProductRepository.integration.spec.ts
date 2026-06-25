import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { ProductRepositoryImpl } from "@modules/product-catalog/infra/persistence/repositories/product.repository.impl";
import { Product } from "@modules/product-catalog/domain/entities/product.entity";
import { ProductId } from "@modules/product-catalog/domain/value-objects/product-id.vo";
import { Slug } from "@modules/product-catalog/domain/value-objects/slug.vo";
import { CategoryId } from "@modules/product-catalog/domain/value-objects/category-id.vo";
import { ProductStatus } from "@modules/product-catalog/domain/value-objects";

const prisma = new PrismaClient();

describe("ProductRepositoryImpl Database Integration Tests", () => {
  let repository: ProductRepositoryImpl;

  beforeAll(async () => {
    repository = new ProductRepositoryImpl(prisma);
  });

  async function createCategory(name: string, slug: string): Promise<string> {
    const id = randomUUID();
    await prisma.category.create({
      data: {
        id,
        name,
        slug,
      },
    });
    return id;
  }

  async function linkTag(productId: string, tagName: string): Promise<string> {
    const tagId = randomUUID();
    await prisma.productTag.create({
      data: {
        id: tagId,
        tag: tagName,
      },
    });
    await prisma.productTagAssociation.create({
      data: {
        productId,
        tagId,
      },
    });
    return tagId;
  }

  it("should save and find a product aggregate with all its attributes and media", async () => {
    // Arrange
    const product = Product.create({
      title: "Signature Silk Scarf",
      price: 150,
      currency: "GBP",
      brand: "Tasheen",
      shortDesc: "Bespoke silk accessory",
      longDescHtml: "<p>Premium silk accessory crafted with care</p>",
      status: ProductStatus.DRAFT,
      countryOfOrigin: "United Kingdom",
      seoTitle: "Signature Silk Scarf - Tasheen",
      seoDescription: "Luxury silk scarf",
      images: ["scarf-1.png", "scarf-2.png"],
    });

    // Act
    await repository.save(product);
    const found = await repository.findById(product.id);

    // Assert
    expect(found).not.toBeNull();
    expect(found!.id.getValue()).toBe(product.id.getValue());
    expect(found!.title).toBe("Signature Silk Scarf");
    expect(found!.slug.getValue()).toBe(product.slug.getValue());
    expect(found!.brand).toBe("Tasheen");
    expect(found!.shortDesc).toBe("Bespoke silk accessory");
    expect(found!.longDescHtml).toBe("<p>Premium silk accessory crafted with care</p>");
    expect(found!.status).toBe(ProductStatus.DRAFT);
    expect(found!.countryOfOrigin).toBe("United Kingdom");
    expect(found!.seoTitle).toBe("Signature Silk Scarf - Tasheen");
    expect(found!.seoDescription).toBe("Luxury silk scarf");
    expect(found!.price.getAmount()).toBe(150);
    expect(found!.price.getCurrency().getValue()).toBe("GBP");
    expect(found!.images).toEqual(["scarf-1.png", "scarf-2.png"]);
  });

  it("should retrieve products by status, brand, and slug", async () => {
    // Arrange
    const slugValue = `lux-coat-${Date.now()}`;
    const product = Product.create({
      title: "Lux Coat",
      slug: slugValue,
      price: 500,
      currency: "USD",
      brand: "Tasheen",
      status: ProductStatus.PUBLISHED,
    });
    await repository.save(product);

    // Act & Assert
    // 1. findBySlug
    const foundBySlug = await repository.findBySlug(Slug.fromString(slugValue));
    expect(foundBySlug).not.toBeNull();
    expect(foundBySlug!.id.getValue()).toBe(product.id.getValue());

    // 2. findByBrand
    const foundByBrand = await repository.findByBrand("Tasheen");
    expect(foundByBrand.some((p) => p.id.getValue() === product.id.getValue())).toBe(true);

    // 3. findByStatus
    const foundByStatus = await repository.findByStatus(ProductStatus.PUBLISHED);
    expect(foundByStatus.some((p) => p.id.getValue() === product.id.getValue())).toBe(true);

    // 4. exists & existsBySlug
    expect(await repository.exists(product.id)).toBe(true);
    expect(await repository.existsBySlug(Slug.fromString(slugValue))).toBe(true);
  });

  it("should retrieve products by category and verify replaceCategories", async () => {
    // Arrange
    const catId1 = await createCategory("Apparel", "apparel");
    const catId2 = await createCategory("Coats", "coats");

    const product = Product.create({
      title: "Winter Overcoat",
      price: 450,
      brand: "Woolrich",
      status: ProductStatus.PUBLISHED,
    });
    await repository.save(product);

    // Act & Assert
    // 1. replaceCategories
    await repository.replaceCategories(product.id, [
      CategoryId.fromString(catId1),
      CategoryId.fromString(catId2),
    ]);

    const foundWithCats = await repository.findById(product.id);
    expect(foundWithCats!.categoryIds).toContain(catId1);
    expect(foundWithCats!.categoryIds).toContain(catId2);

    // 2. findByCategory
    const foundByCat = await repository.findByCategory(CategoryId.fromString(catId1));
    expect(foundByCat.some((p) => p.id.getValue() === product.id.getValue())).toBe(true);
  });

  it("should retrieve multiple products by IDs", async () => {
    // Arrange
    const p1 = Product.create({ title: "Product 1", price: 10 });
    const p2 = Product.create({ title: "Product 2", price: 20 });
    await repository.save(p1);
    await repository.save(p2);

    // Act
    const products = await repository.findByIds([p1.id, p2.id]);

    // Assert
    expect(products.length).toBe(2);
    expect(products.some((p) => p.id.getValue() === p1.id.getValue())).toBe(true);
    expect(products.some((p) => p.id.getValue() === p2.id.getValue())).toBe(true);
  });

  it("should verify findAll query options and pagination", async () => {
    // Arrange
    const pDraft = Product.create({ title: "Draft Item", price: 5, brand: "BrandA", status: ProductStatus.DRAFT });
    const pPub = Product.create({ title: "Pub Item", price: 10, brand: "BrandA", status: ProductStatus.PUBLISHED });
    await repository.save(pDraft);
    await repository.save(pPub);

    // Act & Assert
    // 1. By default findAll excludes drafts
    const allPublic = await repository.findAll({ brand: "BrandA" });
    expect(allPublic.length).toBe(1);
    expect(allPublic[0].id.getValue()).toBe(pPub.id.getValue());

    // 2. includeDrafts should include both
    const allIncludingDrafts = await repository.findAll({ brand: "BrandA", includeDrafts: true });
    expect(allIncludingDrafts.length).toBe(2);

    // 3. Limit and Offset pagination
    const paginated = await repository.findAll({ brand: "BrandA", includeDrafts: true, limit: 1, offset: 0 });
    expect(paginated.length).toBe(1);
  });

  it("should count products matching options", async () => {
    // Arrange
    const brandName = `CountBrand-${Date.now()}`;
    const p1 = Product.create({ title: "Item 1", price: 10, brand: brandName, status: ProductStatus.PUBLISHED });
    const p2 = Product.create({ title: "Item 2", price: 20, brand: brandName, status: ProductStatus.DRAFT });
    await repository.save(p1);
    await repository.save(p2);

    // Act & Assert
    const countAll = await repository.count({ brand: brandName });
    expect(countAll).toBe(2);

    const countPub = await repository.count({ brand: brandName, status: ProductStatus.PUBLISHED });
    expect(countPub).toBe(1);

    const countDraft = await repository.count({ brand: brandName, status: ProductStatus.DRAFT });
    expect(countDraft).toBe(1);
  });

  it("should soft delete a product by archiving it", async () => {
    // Arrange
    const product = Product.create({
      title: "Archive Target",
      price: 100,
      status: ProductStatus.PUBLISHED,
    });
    await repository.save(product);

    // Act
    await repository.delete(product.id);

    // Assert
    const deletedProduct = await repository.findById(product.id);
    expect(deletedProduct).not.toBeNull();
    expect(deletedProduct!.status).toBe(ProductStatus.ARCHIVED);
  });

  it("should search products by text query, brand, tags, and price range", async () => {
    // Arrange
    const searchBrand = `SearchBrand-${Date.now()}`;
    const product = Product.create({
      title: "Cashmere Scarf",
      price: 250,
      brand: searchBrand,
      shortDesc: "Warm luxury winter scarf",
      status: ProductStatus.PUBLISHED,
    });
    await repository.save(product);

    const catId = await createCategory("Accessories", `acc-${Date.now()}`);
    await repository.replaceCategories(product.id, [CategoryId.fromString(catId)]);

    await linkTag(product.id.getValue(), "winter");

    // Act & Assert
    // 1. Text search on title
    const searchTitle = await repository.search("scarf", { brands: [searchBrand] });
    expect(searchTitle.length).toBe(1);

    // 2. Text search on short description
    const searchDesc = await repository.search("warm", { brands: [searchBrand] });
    expect(searchDesc.length).toBe(1);

    // 3. Search filtered by Category
    const searchCat = await repository.search("scarf", {
      brands: [searchBrand],
      categories: [CategoryId.fromString(catId)],
    });
    expect(searchCat.length).toBe(1);

    // 4. Search filtered by tag
    const searchTag = await repository.search("scarf", {
      brands: [searchBrand],
      tags: ["winter"],
    });
    expect(searchTag.length).toBe(1);

    // 5. Search filtered by price range
    const searchPrice = await repository.search("scarf", {
      brands: [searchBrand],
      priceRange: { min: 200, max: 300 },
    });
    expect(searchPrice.length).toBe(1);

    // Price range out of bounds should return 0 results
    const searchPriceOut = await repository.search("scarf", {
      brands: [searchBrand],
      priceRange: { min: 10, max: 100 },
    });
    expect(searchPriceOut.length).toBe(0);
  });

  it("should fetch products with variants, images, and category enrichment data", async () => {
    // Arrange
    const product = Product.create({
      title: "Enriched Silk Shirt",
      price: 180,
      images: ["shirt-1.png"],
    });
    await repository.save(product);

    const catId = await createCategory("Shirts", `shirts-${Date.now()}`);
    await repository.replaceCategories(product.id, [CategoryId.fromString(catId)]);

    // Create variant
    const variantId = randomUUID();
    await prisma.productVariant.create({
      data: {
        id: variantId,
        productId: product.id.getValue(),
        sku: `SKU-SHIRT-${Date.now()}`,
        price: 180,
        size: "L",
        color: "Blue",
      },
    });

    // Create location and inventory stock
    const locationId = randomUUID();
    await prisma.location.create({
      data: {
        id: locationId,
        name: "Store Location",
        type: "store",
      },
    });

    await prisma.inventoryStock.create({
      data: {
        variantId,
        locationId,
        onHand: 15,
        reserved: 3,
      },
    });

    // Act
    const mapEnrichment = await repository.findWithEnrichment([product.id]);
    const singleEnrichment = await repository.findOneWithEnrichment(product.id);
    const mediaEnrichment = await repository.findMediaEnrichment(product.id);

    // Assert findWithEnrichment / findOneWithEnrichment
    expect(mapEnrichment.has(product.id.getValue())).toBe(true);
    const itemEnrichment = mapEnrichment.get(product.id.getValue())!;
    expect(itemEnrichment.variants.length).toBe(1);
    expect(itemEnrichment.variants[0].inventory).toBe(12); // 15 - 3 = 12
    expect(itemEnrichment.variants[0].size).toBe("L");
    expect(itemEnrichment.variants[0].color).toBe("Blue");
    expect(itemEnrichment.images[0].url).toBe("shirt-1.png");
    expect(itemEnrichment.categories[0].id).toBe(catId);

    expect(singleEnrichment).not.toBeNull();
    expect(singleEnrichment!.variants[0].inventory).toBe(12);

    // Assert findMediaEnrichment
    expect(mediaEnrichment.images.length).toBe(1);
    expect(mediaEnrichment.images[0].url).toBe("shirt-1.png");
  });
});
