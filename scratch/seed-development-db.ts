import { PrismaClient, ProductStatusEnum, LocationTypeEnum } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:1234@localhost:5432/enterprise_level_ecommerce"
    }
  }
});

async function main() {
  console.log("=== Seeding Development Database (enterprise_level_ecommerce) ===");

  // 1. Clean up existing product-related data to avoid primary key/unique constraint violations
  console.log("Cleaning existing records...");
  await prisma.wishlistItem.deleteMany({});
  await prisma.wishlist.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.shoppingCart.deleteMany({});
  await prisma.inventoryTransaction.deleteMany({});
  await prisma.stockAlert.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.inventoryStock.deleteMany({});
  await prisma.productCategory.deleteMany({});
  await prisma.productMedia.deleteMany({});
  await prisma.mediaAsset.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.location.deleteMany({});

  // 2. Create Categories with exact UUIDs mapped in the frontend
  console.log("Creating categories...");
  
  // Women Categories
  const womenCatId = "45c2f063-7e4b-4436-97d3-b5cb77027b01";
  const leatherGoodsCatId = "b7a5f2e8-1b3b-4aa6-b129-dd593d379976";
  const bagsCatId = "09ba7651-a19a-43e2-8f6a-1feb88fc1012";
  const beltsCatId = "58eaac47-6f9a-42b0-9f13-db911ac3228d";
  const heeledSandalsCatId = "651d752a-3e85-452a-94c6-8b1224a68a3c";
  const flatSandalsCatId = "ed823dc6-9727-4680-8c42-0f9f1bd434db";
  const balletFlatsCatId = "ed823dc6-9727-4680-8c42-0f9f1bd434dc";
  const laptopSleevesCatId = "496accf7-a083-4dd5-aaa4-1176deff18c0";
  const phoneStrapsCatId = "63ff8f0f-c515-4203-ba2b-16a6575c6ebd";
  const smallLeatherGoodsCatId = "40518bf4-7f05-4631-9581-80ba98448e9d";
  const viewAllCatId = "508db84e-1242-404c-a969-5a3215c9b482";

  // Root Category: Women
  await prisma.category.create({
    data: { id: womenCatId, name: "Women", slug: "women", parentId: null, position: 1 }
  });

  // Leather Goods (child of Women)
  await prisma.category.create({
    data: { id: leatherGoodsCatId, name: "Women's Leather Goods", slug: "women-leather-goods", parentId: womenCatId, position: 1 }
  });

  // Subcategories of Leather Goods
  await prisma.category.create({
    data: { id: bagsCatId, name: "Bags", slug: "bags", parentId: leatherGoodsCatId, position: 1 }
  });
  await prisma.category.create({
    data: { id: beltsCatId, name: "Belts", slug: "belts", parentId: leatherGoodsCatId, position: 2 }
  });
  await prisma.category.create({
    data: { id: laptopSleevesCatId, name: "Laptop Sleeves", slug: "laptop-sleeves", parentId: leatherGoodsCatId, position: 3 }
  });
  await prisma.category.create({
    data: { id: phoneStrapsCatId, name: "Phone Straps", slug: "phone-straps", parentId: leatherGoodsCatId, position: 4 }
  });
  await prisma.category.create({
    data: { id: smallLeatherGoodsCatId, name: "Small Leather Goods", slug: "small-leather-goods", parentId: leatherGoodsCatId, position: 5 }
  });
  await prisma.category.create({
    data: { id: viewAllCatId, name: "View All", slug: "view-all", parentId: leatherGoodsCatId, position: 6 }
  });

  // Other Women Categories
  await prisma.category.create({
    data: { id: heeledSandalsCatId, name: "Heeled Sandals", slug: "heeled-sandals", parentId: womenCatId, position: 2 }
  });
  await prisma.category.create({
    data: { id: flatSandalsCatId, name: "Flat Sandals", slug: "flat-sandals", parentId: womenCatId, position: 3 }
  });
  await prisma.category.create({
    data: { id: balletFlatsCatId, name: "Ballet Flats", slug: "ballet-flats", parentId: womenCatId, position: 4 }
  });

  // Men Categories (created with clean new slugs & parent chains)
  const menCatId = "45c2f063-7e4b-4436-97d3-b5cb77027b02";
  const menLeatherCatId = "b7a5f2e8-1b3b-4aa6-b129-dd593d379977";
  const loafersCatId = "09ba7651-a19a-43e2-8f6a-1feb88fc1013";
  const boatShoesCatId = "09ba7651-a19a-43e2-8f6a-1feb88fc1014";
  const sneakersCatId = "09ba7651-a19a-43e2-8f6a-1feb88fc1015";

  await prisma.category.create({
    data: { id: menCatId, name: "Men", slug: "men", parentId: null, position: 2 }
  });
  await prisma.category.create({
    data: { id: menLeatherCatId, name: "Men's Leather Goods", slug: "men-leather-goods", parentId: menCatId, position: 1 }
  });

  // Seed Men's Leather Goods subcategories
  const menBackpacksId = randomUUID();
  const menTravelBagsId = randomUUID();
  const menBriefcasesId = randomUUID();
  const menLaptopSleevesId = randomUUID();
  const menBeltsId = randomUUID();
  const menSmallLeatherGoodsId = randomUUID();
  const menToiletryBagsId = randomUUID();
  const menViewAllId = randomUUID();

  await prisma.category.create({
    data: { id: menBackpacksId, name: "Backpacks", slug: "men-backpacks", parentId: menLeatherCatId, position: 1 }
  });
  await prisma.category.create({
    data: { id: menTravelBagsId, name: "Travel Bags", slug: "men-travel-bags", parentId: menLeatherCatId, position: 2 }
  });
  await prisma.category.create({
    data: { id: menBriefcasesId, name: "Briefcases", slug: "men-briefcases", parentId: menLeatherCatId, position: 3 }
  });
  await prisma.category.create({
    data: { id: menLaptopSleevesId, name: "Laptop Sleeves", slug: "men-laptop-sleeves", parentId: menLeatherCatId, position: 4 }
  });
  await prisma.category.create({
    data: { id: menBeltsId, name: "Belts", slug: "men-belts", parentId: menLeatherCatId, position: 5 }
  });
  await prisma.category.create({
    data: { id: menSmallLeatherGoodsId, name: "Small Leather Goods", slug: "men-small-leather-goods", parentId: menLeatherCatId, position: 6 }
  });
  await prisma.category.create({
    data: { id: menToiletryBagsId, name: "Toiletry Bags", slug: "men-toiletry-bags", parentId: menLeatherCatId, position: 7 }
  });
  await prisma.category.create({
    data: { id: menViewAllId, name: "View All", slug: "men-view-all", parentId: menLeatherCatId, position: 8 }
  });

  // Loafers, Boat Shoes, Sneakers directly under Men category
  await prisma.category.create({
    data: { id: loafersCatId, name: "Loafers", slug: "loafers", parentId: menCatId, position: 2 }
  });
  await prisma.category.create({
    data: { id: boatShoesCatId, name: "Boat Shoes", slug: "boat-shoes", parentId: menCatId, position: 3 }
  });
  await prisma.category.create({
    data: { id: sneakersCatId, name: "Sneakers", slug: "sneakers", parentId: menCatId, position: 4 }
  });

  console.log("Categories seeded successfully.");

  // 3. Create Warehouse Location
  console.log("Creating default warehouse location...");
  const warehouse = await prisma.location.create({
    data: {
      id: randomUUID(),
      name: "Tasheen's warehouse",
      type: LocationTypeEnum.warehouse,
      address: { city: "Lisbon", country: "Portugal" }
    }
  });

  // Helper to seed a product, its images (media), variants, and inventory stocks
  async function seedProduct(options: {
    title: string;
    slug: string;
    brand: string;
    price: number;
    shortDesc: string;
    longDesc: string;
    categoryIds: string[];
    images: string[];
    sizes: string[];
    color: string;
    stockQty?: number;
  }) {
    // A. Create Product
    const product = await prisma.product.create({
      data: {
        id: randomUUID(),
        title: options.title,
        slug: options.slug,
        brand: options.brand,
        shortDesc: options.shortDesc,
        longDescHtml: options.longDesc,
        price: options.price,
        priceSgd: options.price,
        priceUsd: options.price,
        currency: "EUR",
        status: ProductStatusEnum.published
      }
    });

    // B. Link Category
    for (const catId of options.categoryIds) {
      await prisma.productCategory.create({
        data: {
          productId: product.id,
          categoryId: catId
        }
      });
    }

    // C. Create Media Assets and ProductMedia links
    for (let i = 0; i < options.images.length; i++) {
      const imgKey = options.images[i];
      let asset = await prisma.mediaAsset.findFirst({
        where: { storageKey: imgKey }
      });
      if (!asset) {
        asset = await prisma.mediaAsset.create({
          data: {
            id: randomUUID(),
            storageKey: imgKey,
            mime: "image/png"
          }
        });
      }

      await prisma.productMedia.create({
        data: {
          id: randomUUID(),
          productId: product.id,
          assetId: asset.id,
          position: i + 1,
          isCover: i === 0
        }
      });
    }

    // D. Create Variants and Stocks
    for (const size of options.sizes) {
      const cleanSize = size.toUpperCase().replace(/\s+/g, "-");
      const sku = `${options.slug.toUpperCase()}-${options.color.toUpperCase().slice(0, 3)}-${cleanSize}`;
      const variant = await prisma.productVariant.create({
        data: {
          id: randomUUID(),
          productId: product.id,
          sku: sku,
          size: size,
          color: options.color,
          price: options.price,
          allowBackorder: false,
          allowPreorder: false
        }
      });

      // Create Stock record
      await prisma.inventoryStock.create({
        data: {
          variantId: variant.id,
          locationId: warehouse.id,
          onHand: options.stockQty ?? 15,
          reserved: 0
        }
      });
    }

    console.log(`Product "${options.title}" seeded successfully.`);
  }

  // 4. Seed Products
  console.log("Seeding products...");

  // Product 1a: Victoire Shoulder Bag
  await seedProduct({
    title: "Victoire Shoulder Bag",
    slug: "victoire-shoulder-bag",
    brand: "Slipperze",
    price: 360.00,
    shortDesc: "Elegant flap shoulder bag with gold-tone hardware and adjustable strap.",
    longDesc: "<p>The Victoire Shoulder Bag is a perfect blend of style and practicality, designed for the woman who demands both. Handcrafted from premium full-grain Italian calfskin leather in our Portuguese workshop, this shoulder bag features a structured silhouette with a signature front flap closure secured by polished gold-tone hardware.</p><p><strong>Materials & Craftsmanship:</strong> Full-grain Italian calfskin leather exterior, cotton twill lining, gold-plated zinc alloy hardware. Hand-stitched edges with burnished detailing.</p><p><strong>Dimensions:</strong> 25 × 18 × 8 cm (Mini) | 28 × 20 × 9 cm (Small) | 32 × 23 × 10 cm (Medium) | 36 × 26 × 11 cm (Large)</p><p><strong>Features:</strong> Adjustable leather shoulder strap (drop: 40–55 cm), interior zip pocket, two slip pockets, magnetic flap closure. Comes with a protective dust bag.</p>",
    categoryIds: [bagsCatId, viewAllCatId],
    images: [
      "Women/Leather Goods/Bags/victoire_bag_primary.png",
      "Women/Leather Goods/Bags/victoire_bag_hover.png",
      "Women/Leather Goods/Bags/victoire_bag_flatlay.png",
      "Women/Leather Goods/Bags/victoire_bag_detail.png",
      "Women/Leather Goods/Bags/victoire_bag_lifestyle.png"
    ],
    sizes: ["Mini", "Small", "Medium", "Large"],
    color: "Burgundy",
    stockQty: 50
  });

  // Product 1b: Charlotte Handbag
  await seedProduct({
    title: "Charlotte Handbag",
    slug: "charlotte-handbag",
    brand: "Slipperze",
    price: 410.00,
    shortDesc: "Timeless top-handle leather satchel featuring secure zipper closure and minimal detailing.",
    longDesc: "<p>A classic satchel silhouette reimagined for the modern woman. The Charlotte Handbag is crafted from buttery-soft textured calfskin leather, featuring structured double top handles and a detachable crossbody strap for versatile styling.</p><p><strong>Materials & Craftsmanship:</strong> Premium textured calfskin leather, microfibre lining, palladium-finished hardware. Each bag is individually hand-assembled and inspected by our master artisans.</p><p><strong>Dimensions:</strong> 22 × 16 × 9 cm (Mini) | 26 × 19 × 10 cm (Small) | 30 × 22 × 12 cm (Medium) | 35 × 25 × 14 cm (Large)</p><p><strong>Features:</strong> Secure top-zip closure, interior zip compartment, two organiser pockets, four protective metal feet. Includes a detachable shoulder strap and protective dust bag.</p>",
    categoryIds: [bagsCatId, viewAllCatId],
    images: [
      "Women/Leather Goods/Bags/charlotte_bag_primary.png",
      "Women/Leather Goods/Bags/charlotte_bag_hover.png",
      "Women/Leather Goods/Bags/charlotte_bag_flatlay.png",
      "Women/Leather Goods/Bags/charlotte_bag_detail.png",
      "Women/Leather Goods/Bags/charlotte_bag_lifestyle.png"
    ],
    sizes: ["Mini", "Small", "Medium", "Large"],
    color: "Black",
    stockQty: 50
  });

  // Product 1c: Valentina Duffle Bag
  await seedProduct({
    title: "Valentina Duffle Bag",
    slug: "valentina-duffle-bag",
    brand: "Slipperze",
    price: 390.00,
    shortDesc: "Spacious luxury leather doctor-style duffle with gold-plated accents.",
    longDesc: "<p>Valentina is a heritage-grade travel duffle that marries old-world craftsmanship with modern functionality. Crafted from vegetable-tanned Italian leather that develops a rich patina over time, this duffle is built to be your companion for years to come.</p><p><strong>Materials & Craftsmanship:</strong> Vegetable-tanned Italian full-grain leather, luxury cotton lining with Slipperze monogram print, gold-plated solid brass hardware. Hand-sewn reinforced handles and base.</p><p><strong>Dimensions:</strong> 30 × 22 × 15 cm (Mini) | 36 × 25 × 17 cm (Small) | 42 × 28 × 20 cm (Medium) | 48 × 32 × 23 cm (Large)</p><p><strong>Features:</strong> Wide top-zip opening for easy access, interior zip pocket, removable leather luggage tag, adjustable crossbody strap. Protective brass feet on base. Comes with a cotton dust bag.</p>",
    categoryIds: [bagsCatId, viewAllCatId],
    images: [
      "Women/Leather Goods/Bags/valentina_bag_primary.png",
      "Women/Leather Goods/Bags/valentina_bag_hover.png",
      "Women/Leather Goods/Bags/valentina_bag_flatlay.png",
      "Women/Leather Goods/Bags/valentina_bag_detail.png",
      "Women/Leather Goods/Bags/valentina_bag_lifestyle.png"
    ],
    sizes: ["Mini", "Small", "Medium", "Large"],
    color: "Cream White",
    stockQty: 50
  });

  // Product 1d: Adele Flap Bag
  await seedProduct({
    title: "Adele Flap Bag",
    slug: "adele-flap-bag",
    brand: "Slipperze",
    price: 340.00,
    shortDesc: "Chic leather cross-body bag featuring a gold chain strap and key lock buckle.",
    longDesc: "<p>Minimalism at its finest. The Adele Flap Bag is a study in understated elegance — handcrafted from vegetable-tanned grain leather with clean lines and a classic slide-lock key closure that evokes the heritage of French leather artisanship.</p><p><strong>Materials & Craftsmanship:</strong> Vegetable-tanned Italian grain leather, suede lining, gold-plated brass key-lock closure, hand-wound chain link shoulder strap. Edge-painted and hand-burnished seams.</p><p><strong>Dimensions:</strong> 18 × 13 × 6 cm (Mini) | 22 × 16 × 7 cm (Small) | 26 × 19 × 8 cm (Medium) | 30 × 22 × 10 cm (Large)</p><p><strong>Features:</strong> Signature turn-lock key closure, interior card slot and slip pocket, elegant gold-plated chain strap with leather shoulder rest. Includes a leather key charm and protective dust bag.</p>",
    categoryIds: [bagsCatId, viewAllCatId],
    images: [
      "Women/Leather Goods/Bags/adele_bag_primary.png",
      "Women/Leather Goods/Bags/adele_bag_hover.png",
      "Women/Leather Goods/Bags/adele_bag_flatlay.png",
      "Women/Leather Goods/Bags/adele_bag_detail.png",
      "Women/Leather Goods/Bags/adele_bag_lifestyle.png"
    ],
    sizes: ["Mini", "Small", "Medium", "Large"],
    color: "Brown",
    stockQty: 50
  });

  // Product 1e: Signature Purple Bag
  await seedProduct({
    title: "Signature Purple Bag",
    slug: "signature-purple-bag",
    brand: "Slipperze",
    price: 380.00,
    shortDesc: "Artisanal hand-stitched purple bag featuring a custom Slipperze turn-lock clasp.",
    longDesc: "<p>A hallmark of luxury craftsmanship. The Signature Purple Bag is handcrafted in our family-owned Portuguese workshop from premium full-grain Italian leather, dyed to achieve a striking violet-purple hue that deepens beautifully with age.</p><p><strong>Materials & Craftsmanship:</strong> Full-grain Italian leather with custom aniline dye finish, microsuede interior lining, gold-plated custom Slipperze turn-lock clasp. Hand-stitched saddle stitching using waxed linen thread for exceptional durability.</p><p><strong>Dimensions:</strong> 20 × 15 × 7 cm (Mini) | 24 × 18 × 8 cm (Small) | 28 × 21 × 10 cm (Medium) | 33 × 24 × 12 cm (Large)</p><p><strong>Features:</strong> Custom Slipperze turn-lock closure, interior zip pocket and two slip pockets, removable leather and chain crossbody strap. Hand-painted edges. Comes in a branded gift box with dust bag.</p>",
    categoryIds: [bagsCatId, viewAllCatId],
    images: [
      "Women/Leather Goods/Bags/purple_bag_primary.png",
      "Women/Leather Goods/Bags/purple_bag_hover.png",
      "Women/Leather Goods/Bags/purple_bag_flatlay.png",
      "Women/Leather Goods/Bags/purple_bag_detail.png",
      "Women/Leather Goods/Bags/purple_bag_lifestyle.png"
    ],
    sizes: ["Mini", "Small", "Medium", "Large"],
    color: "Imperial Purple",
    stockQty: 50
  });



  // Product 2: Heeled Sandals (Women Heeled Sandals Category)
  await seedProduct({
    title: "Cat Heeled Sandals",
    slug: "cat-heeled-sandals",
    brand: "Slipperze",
    price: 180.00,
    shortDesc: "Elegant strappy heeled sandals, handcrafted from supple leather. Featuring a comfortable block heel.",
    longDesc: "<p>The perfect companion for summer evenings. Our Cat Heeled Sandals combine a delicate strappy silhouette with robust block-heel support, offering both grace and comfort for extended wear. Made entirely in Portugal from responsibly-sourced leather.</p><p><strong>Materials & Craftsmanship:</strong> Premium vegetable-tanned calfskin leather upper and lining, cushioned leather insole, natural leather-wrapped 75mm block heel. Hand-assembled with riveted straps and burnished edges.</p><p><strong>Dimensions:</strong> Heel height: 75 mm (3 in). Adjustable ankle strap with gold-tone buckle closure.</p><p><strong>Features:</strong> Anatomically shaped footbed for all-day comfort, non-slip natural rubber outsole, padded leather insole that moulds to your foot over time. Arrives in a branded shoe box with dust bag.</p>",
    categoryIds: [heeledSandalsCatId],
    images: ["cat-heeled-sandals.png"],
    sizes: ["36", "37", "38", "39", "40", "41"],
    color: "Cognac"
  });

  // Product 3: Flat Sandals (Women Flat Sandals Category)
  await seedProduct({
    title: "Artisanal Flat Sandals",
    slug: "artisanal-flat-sandals",
    brand: "Slipperze",
    price: 140.00,
    shortDesc: "Classic flat leather sandals with a cushioned footbed for all-day comfort.",
    longDesc: "<p>Simplicity at its finest. Our Artisanal Flat Sandals feature hand-woven leather straps and a micro-cushioned leather sole that moulds to your feet over time, providing personalised comfort with every step.</p><p><strong>Materials & Craftsmanship:</strong> Hand-woven vegetable-tanned leather straps, full leather sole and lining, micro-cushioned cork-latex footbed. Hand-sewn in our Portuguese atelier using traditional sandal-making techniques.</p><p><strong>Dimensions:</strong> Sole height: 10 mm. Adjustable buckle strap for secure fit.</p><p><strong>Features:</strong> Flexible leather outsole, breathable full-leather construction, contoured arch support, lightweight design weighing under 200g per shoe. Arrives in a branded box with a cotton dust bag.</p>",
    categoryIds: [flatSandalsCatId],
    images: ["cat-flat-sandals.png"],
    sizes: ["36", "37", "38", "39", "40", "41"],
    color: "Tan"
  });

  // Product 4: Ballet Flats (Women Ballet Flats Category)
  await seedProduct({
    title: "Premium Ballet Flats",
    slug: "premium-ballet-flats",
    brand: "Slipperze",
    price: 160.00,
    shortDesc: "Charming leather ballet flats, offering effortless Parisian elegance.",
    longDesc: "<p>Crafted with a flexible glove-like fit and elasticised lining, these classic ballet flats are ideal for walking across town in style. The Premium Ballet Flats embody the effortless elegance of Parisian dressing — refined, comfortable, and endlessly versatile.</p><p><strong>Materials & Craftsmanship:</strong> Nappa lambskin leather upper, elasticised leather binding for a snug fit, padded lambskin leather insole. Hand-finished with a signature grosgrain bow. Constructed using the sacchetto technique for supreme flexibility.</p><p><strong>Dimensions:</strong> Sole height: 8 mm. True to size. Available in European sizes 36–41.</p><p><strong>Features:</strong> Ultra-flexible construction, breathable leather lining, cushioned insole with arch support, non-marking TPU outsole for indoor and outdoor wear. Folds flat for travel. Arrives in a branded shoe box.</p>",
    categoryIds: [balletFlatsCatId],
    images: ["cat-ballet-flats.png"],
    sizes: ["36", "37", "38", "39", "40", "41"],
    color: "Black"
  });

  // Product 5: Men's Loafers (Men Loafers Category)
  await seedProduct({
    title: "Artisanal Loafers",
    slug: "artisanal-loafers",
    brand: "Slipperze",
    price: 240.00,
    shortDesc: "Handcrafted suede penny loafers featuring custom moccasin stitching.",
    longDesc: "<p>A timeless staple for the modern gentleman. Hand-sewn in Portugal using premium Italian suede and detailed with a traditional penny slot strap.</p>",
    categoryIds: [loafersCatId],
    images: ["cat-men-loafers.png"],
    sizes: ["40", "41", "42", "43", "44", "45"],
    color: "Suede Brown"
  });

  // Product 6: Men's Boat Shoes (Men Boat Shoes Category)
  await seedProduct({
    title: "Classic Boat Shoes",
    slug: "classic-boat-shoes",
    brand: "Slipperze",
    price: 210.00,
    shortDesc: "Water-resistant leather boat shoes with non-marking rubber outsoles.",
    longDesc: "<p>Built for style on land or sea. Hand-sewn from pull-up oiled leather that gains beautiful character with wear, finished with 360-degree rawhide laces.</p>",
    categoryIds: [boatShoesCatId],
    images: ["cat-men-boat-shoes.png"],
    sizes: ["40", "41", "42", "43", "44", "45"],
    color: "Navy Blue"
  });

  // Product 7: Men's Leather Backpack
  await seedProduct({
    title: "Cognac Leather Backpack",
    slug: "cognac-leather-backpack",
    brand: "Slipperze",
    price: 320.00,
    shortDesc: "Handcrafted cognac leather backpack featuring custom brass hardware and laptop compartment.",
    longDesc: "<p>The Cognac Leather Backpack is designed for the modern gentleman on the go. Meticulously handcrafted from premium calfskin leather, it features a spacious main compartment, a secure laptop sleeve, and quick-access pockets.</p>",
    categoryIds: [menBackpacksId, menViewAllId],
    images: ["Leather Goods/cat_men_backpacks.jpg"],
    sizes: ["One Size"],
    color: "Cognac"
  });

  // Product 8: Men's Leather Travel Bag
  await seedProduct({
    title: "Brown Leather Weekend Duffle",
    slug: "brown-leather-weekend-duffle",
    brand: "Slipperze",
    price: 450.00,
    shortDesc: "Premium full-grain leather duffle bag with heavy-duty brass zippers.",
    longDesc: "<p>A luxurious weekend travel duffle crafted from full-grain dark brown leather. Designed with dual reinforced handles and an adjustable shoulder strap for style and longevity.</p>",
    categoryIds: [menTravelBagsId, menViewAllId],
    images: ["Leather Goods/cat_men_travel_bags.jpg"],
    sizes: ["One Size"],
    color: "Dark Brown"
  });

  // Product 9: Men's Leather Briefcase
  await seedProduct({
    title: "Calfskin Leather Briefcase",
    slug: "calfskin-leather-briefcase",
    brand: "Slipperze",
    price: 290.00,
    shortDesc: "Classic tan leather briefcase with structured build and multiple compartments.",
    longDesc: "<p>Elevate your business style. Made from premium tan calfskin leather, this briefcase features clean modern lines and ample space for notebooks, folders, and tablets.</p>",
    categoryIds: [menBriefcasesId, menViewAllId],
    images: ["Leather Goods/cat_men_briefcases.jpg"],
    sizes: ["One Size"],
    color: "Tan"
  });

  // Product 10: Men's Leather Laptop Sleeve
  await seedProduct({
    title: "Sleek Leather Laptop Sleeve",
    slug: "sleek-leather-laptop-sleeve",
    brand: "Slipperze",
    price: 120.00,
    shortDesc: "Premium leather laptop sleeve with padded interior protection.",
    longDesc: "<p>Keep your laptop safe in style. Minimalist laptop sleeve made of full-grain brown leather, finished with a luxury soft lining.</p>",
    categoryIds: [menLaptopSleevesId, menViewAllId],
    images: ["Leather Goods/cat_men_laptop_sleeves.jpg"],
    sizes: ["13 Inch", "15 Inch"],
    color: "Brown"
  });

  // Product 11: Men's Leather Belts
  await seedProduct({
    title: "Artisanal Leather Belt Stack",
    slug: "artisanal-leather-belt-stack",
    brand: "Slipperze",
    price: 85.00,
    shortDesc: "Durable full-grain leather belt finished with a brushed steel buckle.",
    longDesc: "<p>A classic belt made of premium vegetable-tanned leather. Designed to develop a beautiful patina over time.</p>",
    categoryIds: [menBeltsId, menViewAllId],
    images: ["Leather Goods/cat_men_belts.jpg"],
    sizes: ["90", "95", "100", "105"],
    color: "Brown"
  });

  // Product 12a: Sonora Black Belt
  await seedProduct({
    title: "Sonora Black Belt",
    slug: "sonora-black-belt",
    brand: "Slipperze",
    price: 125.00,
    shortDesc: "Chic wide black leather belt featuring a signature tortoiseshell resin buckle.",
    longDesc: "<p>The Sonora Black Belt is designed to elevate everyday outfits with a single accent. Made from premium smooth black leather, it features a chunky square tortoiseshell resin buckle that adds a sophisticated retro-modern touch to any silhouette.</p><p><strong>Materials & Craftsmanship:</strong> Premium smooth calfskin leather, hand-polished tortoiseshell resin buckle with gold-tone pin, raw edge finish. Each belt is individually cut and edge-dyed by hand in our Portuguese workshop.</p><p><strong>Dimensions:</strong> Width: 4 cm. Available in lengths: 70, 75, 80, 85, 90, and 95 cm. Five adjustment holes spaced 2.5 cm apart.</p><p><strong>Features:</strong> Signature oversized square buckle, single-prong closure, subtle Slipperze stamp on the inner strap. Arrives in a branded box.</p>",
    categoryIds: [beltsCatId, viewAllCatId],
    images: [
      "Women/Leather Goods/Belts/sonora_belt_black_primary.png",
      "Women/Leather Goods/Belts/sonora_belt_black_hover.png",
      "Women/Leather Goods/Belts/sonora_belt_black_flatlay.png",
      "Women/Leather Goods/Belts/sonora_belt_black_detail.png",
      "Women/Leather Goods/Belts/sonora_belt_black_lifestyle.png"
    ],
    sizes: ["70 cm", "75 cm", "80 cm", "85 cm", "90 cm", "95 cm"],
    color: "Black",
    stockQty: 50
  });

  // Product 12b: Sonora Camel Belt
  await seedProduct({
    title: "Sonora Camel Belt",
    slug: "sonora-camel-belt",
    brand: "Slipperze",
    price: 125.00,
    shortDesc: "Premium wide tan camel leather belt featuring a smooth white resin buckle.",
    longDesc: "<p>A sunny day essential. The Sonora Camel Belt is handcrafted from top-grade tan camel leather with a naturally warm tone that pairs effortlessly with light linens, denim, and flowing dresses.</p><p><strong>Materials & Craftsmanship:</strong> Vegetable-tanned calfskin leather in natural camel, cream-white matte resin buckle with palladium-tone pin. Edges are hand-burnished and waxed for a refined finish.</p><p><strong>Dimensions:</strong> Width: 4 cm. Available in lengths: 70, 75, 80, 85, 90, and 95 cm. Five adjustment holes spaced 2.5 cm apart.</p><p><strong>Features:</strong> Clean contrast between the warm leather and cool white buckle, single-prong closure, Slipperze monogram embossed on the strap end. Arrives in a branded box.</p>",
    categoryIds: [beltsCatId, viewAllCatId],
    images: [
      "Women/Leather Goods/Belts/sonora_belt_camel_primary.png",
      "Women/Leather Goods/Belts/sonora_belt_camel_hover.png",
      "Women/Leather Goods/Belts/sonora_belt_camel_flatlay.png",
      "Women/Leather Goods/Belts/sonora_belt_camel_detail.png",
      "Women/Leather Goods/Belts/sonora_belt_camel_lifestyle.png"
    ],
    sizes: ["70 cm", "75 cm", "80 cm", "85 cm", "90 cm", "95 cm"],
    color: "Camel",
    stockQty: 50
  });

  // Product 12c: Sonora Chocolate Belt
  await seedProduct({
    title: "Sonora Chocolate Belt",
    slug: "sonora-chocolate-belt",
    brand: "Slipperze",
    price: 125.00,
    shortDesc: "Rich dark brown chocolate leather belt with a dark tortoiseshell buckle.",
    longDesc: "<p>Classically elegant. The Sonora Chocolate Belt is made from deep dark brown chocolate leather, paired with an amber-and-black tortoiseshell resin buckle for a luxurious, warm finish that complements autumnal and evening wardrobes beautifully.</p><p><strong>Materials & Craftsmanship:</strong> Full-grain chocolate brown calfskin leather, hand-polished amber tortoiseshell resin buckle with antique brass pin. Each belt is cut from a single hide for consistent grain pattern. Edges are hand-painted and sealed.</p><p><strong>Dimensions:</strong> Width: 4 cm. Available in lengths: 70, 75, 80, 85, 90, and 95 cm. Five adjustment holes spaced 2.5 cm apart.</p><p><strong>Features:</strong> Rich tonal harmony between leather and buckle, single-prong closure, discreet Slipperze logo debossed on inner strap. Arrives in a branded box.</p>",
    categoryIds: [beltsCatId, viewAllCatId],
    images: [
      "Women/Leather Goods/Belts/sonora_belt_brown_primary.png",
      "Women/Leather Goods/Belts/sonora_belt_brown_hover.png",
      "Women/Leather Goods/Belts/sonora_belt_brown_flatlay.png",
      "Women/Leather Goods/Belts/sonora_belt_brown_detail.png",
      "Women/Leather Goods/Belts/sonora_belt_brown_lifestyle.png"
    ],
    sizes: ["70 cm", "75 cm", "80 cm", "85 cm", "90 cm", "95 cm"],
    color: "Dark Brown",
    stockQty: 50
  });

  // Product 12d: Sonora Suede Belt
  await seedProduct({
    title: "Sonora Suede Belt",
    slug: "sonora-suede-belt",
    brand: "Slipperze",
    price: 125.00,
    shortDesc: "Soft light brown suede belt featuring a matching caramel resin buckle.",
    longDesc: "<p>Textural luxury. The Sonora Suede Belt is crafted from premium light brown split suede, offering a velvety soft texture and a relaxed feel. Paired with a matching caramel resin buckle for a modern tone-on-tone look that transitions effortlessly from day to evening.</p><p><strong>Materials & Craftsmanship:</strong> Premium split suede from European hides, hand-polished caramel resin buckle with gold-tone pin. Suede edges are hand-skived for a clean, thin profile. Natural raw-edge finish celebrates the material's organic texture.</p><p><strong>Dimensions:</strong> Width: 4 cm. Available in lengths: 70, 75, 80, 85, 90, and 95 cm. Five adjustment holes spaced 2.5 cm apart.</p><p><strong>Features:</strong> Tonal suede-and-resin pairing, single-prong closure, Slipperze stamp on the inner strap. Suede requires special care — please store flat. Arrives in a branded box with a suede care guide.</p>",
    categoryIds: [beltsCatId, viewAllCatId],
    images: [
      "Women/Leather Goods/Belts/sonora_belt_suede_primary.png",
      "Women/Leather Goods/Belts/sonora_belt_suede_hover.png",
      "Women/Leather Goods/Belts/sonora_belt_suede_flatlay.png",
      "Women/Leather Goods/Belts/sonora_belt_suede_detail.png",
      "Women/Leather Goods/Belts/sonora_belt_suede_lifestyle.png"
    ],
    sizes: ["70 cm", "75 cm", "80 cm", "85 cm", "90 cm", "95 cm"],
    color: "Light Brown",
    stockQty: 50
  });

  // Product 12e: Sonora Ivory Belt
  await seedProduct({
    title: "Sonora Ivory Belt",
    slug: "sonora-ivory-belt",
    brand: "Slipperze",
    price: 125.00,
    shortDesc: "Sophisticated ivory cream leather belt with a transparent honey resin buckle.",
    longDesc: "<p>The ultimate chic accessory. The Sonora Ivory Belt is made of buttery smooth ivory cream leather, featuring an amber-toned honey resin buckle that captures the light beautifully. A statement piece designed to complement summer whites, pastels, and neutral palettes.</p><p><strong>Materials & Craftsmanship:</strong> Smooth full-grain calfskin leather in ivory cream, transparent honey-amber resin buckle with gold-tone pin. Edges are hand-painted in a matching cream tone. Individually inspected for consistent colour and finish.</p><p><strong>Dimensions:</strong> Width: 4 cm. Available in lengths: 70, 75, 80, 85, 90, and 95 cm. Five adjustment holes spaced 2.5 cm apart.</p><p><strong>Features:</strong> Translucent honey buckle creates a luminous accent, single-prong closure, discreet Slipperze branding on the inner strap. Light-coloured leather — we recommend avoiding contact with dark denim. Arrives in a branded box.</p>",
    categoryIds: [beltsCatId, viewAllCatId],
    images: [
      "Women/Leather Goods/Belts/sonora_belt_ivory_primary.png",
      "Women/Leather Goods/Belts/sonora_belt_ivory_hover.png",
      "Women/Leather Goods/Belts/sonora_belt_ivory_flatlay.png",
      "Women/Leather Goods/Belts/sonora_belt_ivory_detail.png",
      "Women/Leather Goods/Belts/sonora_belt_ivory_lifestyle.png"
    ],
    sizes: ["70 cm", "75 cm", "80 cm", "85 cm", "90 cm", "95 cm"],
    color: "Ivory",
    stockQty: 50
  });

  // Product 12f: Atelier Laptop Sleeve - Noir
  await seedProduct({
    title: "Atelier Laptop Sleeve - Noir",
    slug: "atelier-laptop-sleeve-noir",
    brand: "Slipperze",
    price: 195.00,
    shortDesc: "Chic and minimalist black textured leather laptop sleeve.",
    longDesc: "<p>Keep your technology safe with the Atelier Laptop Sleeve - Noir. Crafted from premium full-grain black calfskin leather, this sleeve combines elegant minimalist design with durable padded protection.</p><p><strong>Materials & Craftsmanship:</strong> Full-grain black calfskin leather, microfibre protective padding lining, solid gold-tone brass zipper. Individually hand-stitched and edge-dyed in our European workshop.</p><p><strong>Dimensions:</strong> 34 × 24 × 1.5 cm. Fits standard 13-inch and 14-inch laptops (including MacBook Pro 14\").</p><p><strong>Features:</strong> Padded shock-absorbent core, scratch-resistant interior lining, slip-in document back pocket. Arrives in a branded dust bag.</p>",
    categoryIds: [laptopSleevesCatId, viewAllCatId],
    images: [
      "Women/Leather Goods/Laptop Sleeves/atelier_noir_primary.jpg",
      "Women/Leather Goods/Laptop Sleeves/atelier_noir_hover.jpg",
      "Women/Leather Goods/Laptop Sleeves/atelier_noir_flatlay.jpg",
      "Women/Leather Goods/Laptop Sleeves/atelier_noir_detail.jpg",
      "Women/Leather Goods/Laptop Sleeves/atelier_noir_lifestyle.jpg"
    ],
    sizes: ["One Size"],
    color: "Noir",
    stockQty: 50
  });

  // Product 12g: Atelier Laptop Sleeve - Etain
  await seedProduct({
    title: "Atelier Laptop Sleeve - Etain",
    slug: "atelier-laptop-sleeve-etain",
    brand: "Slipperze",
    price: 195.00,
    shortDesc: "Sleek taupe-grey textured leather laptop sleeve.",
    longDesc: "<p>Elevate your workspace. The Atelier Laptop Sleeve - Etain is handcrafted from premium taupe-grey pebbled leather, offering a modern, neutral aesthetic with robust protection.</p><p><strong>Materials & Craftsmanship:</strong> Premium pebbled calfskin leather, microfibre protective padding lining, solid silver-tone brass zipper. Individually hand-stitched and edge-dyed in our European workshop.</p><p><strong>Dimensions:</strong> 34 × 24 × 1.5 cm. Fits standard 13-inch and 14-inch laptops (including MacBook Pro 14\").</p><p><strong>Features:</strong> Padded shock-absorbent core, scratch-resistant interior lining, slip-in document back pocket. Arrives in a branded dust bag.</p>",
    categoryIds: [laptopSleevesCatId, viewAllCatId],
    images: [
      "Women/Leather Goods/Laptop Sleeves/atelier_etain_primary.jpg",
      "Women/Leather Goods/Laptop Sleeves/atelier_etain_hover.jpg",
      "Women/Leather Goods/Laptop Sleeves/atelier_etain_flatlay.jpg",
      "Women/Leather Goods/Laptop Sleeves/atelier_etain_detail.jpg",
      "Women/Leather Goods/Laptop Sleeves/atelier_etain_lifestyle.jpg"
    ],
    sizes: ["One Size"],
    color: "Etain",
    stockQty: 50
  });

  // Product 12h: Atelier Laptop Sleeve - Alezan
  await seedProduct({
    title: "Atelier Laptop Sleeve - Alezan",
    slug: "atelier-laptop-sleeve-alezan",
    brand: "Slipperze",
    price: 195.00,
    shortDesc: "Rich tan textured leather laptop sleeve.",
    longDesc: "<p>The ultimate boardroom companion. The Atelier Laptop Sleeve - Alezan is crafted from full-grain tan calfskin leather, designed to age beautifully and develop a rich patina.</p><p><strong>Materials & Craftsmanship:</strong> Premium full-grain tan calfskin leather, microfibre protective padding lining, solid gold-tone brass zipper. Individually hand-stitched and edge-dyed in our European workshop.</p><p><strong>Dimensions:</strong> 34 × 24 × 1.5 cm. Fits standard 13-inch and 14-inch laptops (including MacBook Pro 14\").</p><p><strong>Features:</strong> Padded shock-absorbent core, scratch-resistant interior lining, slip-in document back pocket. Arrives in a branded dust bag.</p>",
    categoryIds: [laptopSleevesCatId, viewAllCatId],
    images: [
      "Women/Leather Goods/Laptop Sleeves/atelier_alezan_primary.jpg",
      "Women/Leather Goods/Laptop Sleeves/atelier_alezan_hover.jpg",
      "Women/Leather Goods/Laptop Sleeves/atelier_alezan_flatlay.jpg",
      "Women/Leather Goods/Laptop Sleeves/atelier_alezan_detail.jpg",
      "Women/Leather Goods/Laptop Sleeves/atelier_alezan_lifestyle.jpg"
    ],
    sizes: ["One Size"],
    color: "Alezan",
    stockQty: 50
  });

  // Product 13a: Mabillon Nude Latte Wallet
  await seedProduct({
    title: "Mabillon Nude Latte",
    slug: "mabillon-nude-latte",
    brand: "Slipperze",
    price: 175.00,
    shortDesc: "Sophisticated zip-around leather card case wallet in nude latte beige.",
    longDesc: "<p>Elegant and compact. The Mabillon Nude Latte is a zip-around card case wallet handcrafted from top-grade grained leather in a warm nude-beige tone that pairs with every outfit. Designed to hold all your essentials without the bulk.</p><p><strong>Materials & Craftsmanship:</strong> Premium cross-grain calfskin leather, gold-tone metal zip with custom Slipperze zip puller, jacquard-woven fabric lining. Each wallet is individually hand-cut and edge-painted in our European workshop.</p><p><strong>Dimensions:</strong> 11 × 8 × 2 cm (closed). Weight: 85 g.</p><p><strong>Interior:</strong> 6 card slots, 2 flat note compartments, 1 central zip coin pocket. Expandable gusset design allows the wallet to open flat for easy access.</p><p><strong>Features:</strong> 270° zip-around closure for secure carry, embossed Slipperze logo on front, tonal edge-painting. Arrives in a branded gift box.</p>",
    categoryIds: [smallLeatherGoodsCatId, viewAllCatId],
    images: [
      "Women/Leather Goods/Small Leather Goods/mabillon_nude_primary.png",
      "Women/Leather Goods/Small Leather Goods/mabillon_nude_hover.png",
      "Women/Leather Goods/Small Leather Goods/mabillon_nude_flatlay.png",
      "Women/Leather Goods/Small Leather Goods/mabillon_nude_detail.png",
      "Women/Leather Goods/Small Leather Goods/mabillon_nude_lifestyle.png"
    ],
    sizes: ["One Size"],
    color: "Nude Latte",
    stockQty: 50
  });

  // Product 13b: Mabillon Oran Earth Wallet
  await seedProduct({
    title: "Mabillon Oran Earth",
    slug: "mabillon-oran-earth",
    brand: "Slipperze",
    price: 175.00,
    shortDesc: "Vibrant orange textured leather zip-around card wallet.",
    longDesc: "<p>Brighten up your accessories. The Mabillon Oran Earth features a vibrant burnt-orange tone crafted from textured calfskin leather, designed to stand out in your bag and bring a pop of warmth to any look.</p><p><strong>Materials & Craftsmanship:</strong> Textured calfskin leather with cross-hatch embossing, matching orange zip puller with gold-plated hardware, jacquard-woven fabric lining. Hand-assembled and edge-finished in our European workshop.</p><p><strong>Dimensions:</strong> 11 × 8 × 2 cm (closed). Weight: 85 g.</p><p><strong>Interior:</strong> 6 card slots, 2 flat note compartments, 1 central zip coin pocket. Expandable gusset for easy access to cards and cash.</p><p><strong>Features:</strong> 270° zip-around closure, embossed Slipperze logo, tonal stitching and edge-painting. Arrives in a branded gift box.</p>",
    categoryIds: [smallLeatherGoodsCatId, viewAllCatId],
    images: [
      "Women/Leather Goods/Small Leather Goods/mabillon_oran_primary.png",
      "Women/Leather Goods/Small Leather Goods/mabillon_oran_hover.png",
      "Women/Leather Goods/Small Leather Goods/mabillon_oran_flatlay.png",
      "Women/Leather Goods/Small Leather Goods/mabillon_oran_detail.png",
      "Women/Leather Goods/Small Leather Goods/mabillon_oran_lifestyle.png"
    ],
    sizes: ["One Size"],
    color: "Oran Earth",
    stockQty: 50
  });

  // Product 13c: Mabillon Sunrise Wallet
  await seedProduct({
    title: "Mabillon Sunrise",
    slug: "mabillon-sunrise",
    brand: "Slipperze",
    price: 175.00,
    shortDesc: "Bold coral-red textured leather card case wallet.",
    longDesc: "<p>A fresh, energetic pop of colour. The Mabillon Sunrise is crafted from coral-red textured leather with precision stitching and a warm gold zip, designed to fit easily into small crossbody bags, coat pockets, or clutches.</p><p><strong>Materials & Craftsmanship:</strong> Textured calfskin leather in coral-red, gold-plated metal zip with Slipperze-engraved puller, jacquard-woven fabric lining. Hand-cut, hand-painted edges with heat-sealed finish for durability.</p><p><strong>Dimensions:</strong> 11 × 8 × 2 cm (closed). Weight: 85 g.</p><p><strong>Interior:</strong> 6 card slots, 2 flat note compartments, 1 central zip coin pocket. Gusset construction opens flat for full visibility.</p><p><strong>Features:</strong> 270° zip-around closure, contrast edge-painting, embossed logo on front panel. Arrives in a branded gift box.</p>",
    categoryIds: [smallLeatherGoodsCatId, viewAllCatId],
    images: [
      "Women/Leather Goods/Small Leather Goods/mabillon_sunrise_primary.png",
      "Women/Leather Goods/Small Leather Goods/mabillon_sunrise_hover.png",
      "Women/Leather Goods/Small Leather Goods/mabillon_sunrise_flatlay.png",
      "Women/Leather Goods/Small Leather Goods/mabillon_sunrise_detail.png",
      "Women/Leather Goods/Small Leather Goods/mabillon_sunrise_lifestyle.png"
    ],
    sizes: ["One Size"],
    color: "Sunrise",
    stockQty: 50
  });

  // Product 13d: Mabillon Champagne Wallet
  await seedProduct({
    title: "Mabillon Iridescent Champagne",
    slug: "mabillon-iridescent-champagne",
    brand: "Slipperze",
    price: 175.00,
    shortDesc: "Luxe metallic gold-champagne leather card case wallet.",
    longDesc: "<p>A touch of glamour. The Mabillon Iridescent Champagne is handcrafted from premium metallic champagne-gold leather that catches and reflects light beautifully, adding a luminous elegance to your everyday carry.</p><p><strong>Materials & Craftsmanship:</strong> Metallic-finish calfskin leather in iridescent champagne gold, gold-plated metal zip with Slipperze logo puller, satin-finish fabric lining. The metallic finish is achieved through a specialised foil-transfer process on full-grain leather.</p><p><strong>Dimensions:</strong> 11 × 8 × 2 cm (closed). Weight: 85 g.</p><p><strong>Interior:</strong> 6 card slots, 2 flat note compartments, 1 central zip coin pocket. Expandable gusset allows the wallet to open fully flat.</p><p><strong>Features:</strong> 270° zip-around closure, iridescent shimmer effect that shifts in different lighting, embossed Slipperze logo. Handle with care to preserve the metallic finish. Arrives in a branded gift box.</p>",
    categoryIds: [smallLeatherGoodsCatId, viewAllCatId],
    images: [
      "Women/Leather Goods/Small Leather Goods/mabillon_champagne_primary.png",
      "Women/Leather Goods/Small Leather Goods/mabillon_champagne_hover.png",
      "Women/Leather Goods/Small Leather Goods/mabillon_champagne_flatlay.png",
      "Women/Leather Goods/Small Leather Goods/mabillon_champagne_detail.png",
      "Women/Leather Goods/Small Leather Goods/mabillon_champagne_lifestyle.png"
    ],
    sizes: ["One Size"],
    color: "Iridescent Champagne",
    stockQty: 50
  });

  // Product 13e: Mabillon Noir Wallet
  await seedProduct({
    title: "Mabillon Noir",
    slug: "mabillon-noir",
    brand: "Slipperze",
    price: 175.00,
    shortDesc: "Classic black textured leather zip-around card case wallet.",
    longDesc: "<p>The ultimate classic. The Mabillon Noir is handcrafted from textured black calfskin leather, offering timeless elegance that works with every wardrobe. A compact, secure zip-around design keeps your cards, cash, and coins perfectly organised.</p><p><strong>Materials & Craftsmanship:</strong> Cross-grain textured calfskin leather in deep black, palladium-tone metal zip with Slipperze logo puller, jacquard-woven fabric lining. Hand-assembled with precision edge-painting and heat-sealed seams for a flawless finish.</p><p><strong>Dimensions:</strong> 11 × 8 × 2 cm (closed). Weight: 85 g.</p><p><strong>Interior:</strong> 6 card slots, 2 flat note compartments, 1 central zip coin pocket. Expandable gusset design opens fully flat.</p><p><strong>Features:</strong> 270° zip-around closure, discrete embossed Slipperze logo on front, tonal black stitching and edge-painting. The most versatile piece in the Mabillon collection. Arrives in a branded gift box.</p>",
    categoryIds: [smallLeatherGoodsCatId, viewAllCatId],
    images: [
      "Women/Leather Goods/Small Leather Goods/mabillon_noir_primary.png",
      "Women/Leather Goods/Small Leather Goods/mabillon_noir_hover.png",
      "Women/Leather Goods/Small Leather Goods/mabillon_noir_flatlay.png",
      "Women/Leather Goods/Small Leather Goods/mabillon_noir_detail.png",
      "Women/Leather Goods/Small Leather Goods/mabillon_noir_lifestyle.png"
    ],
    sizes: ["One Size"],
    color: "Noir",
    stockQty: 50
  });

  console.log("\n=== Seeding Finished Successfully! ===");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
