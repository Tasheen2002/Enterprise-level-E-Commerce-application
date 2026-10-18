// Only touches a newly named database inside the labelled, disposable P00 container.
import { execFileSync, spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";
import { requireTestDatabaseAdmin } from "../testing/operational-database";
import { inspectCartExpiry } from "../testing/cart-expiry-inspection";

async function main() {
  const container = "slipperze-audit-p00-postgres";
  const info = JSON.parse(execFileSync("docker", ["inspect", container], { encoding: "utf8" }))[0];
  const port = info.NetworkSettings.Ports["5432/tcp"]?.[0];
  if (
    info.Config.Labels?.["slipperze.audit"] !== "p00-disposable" ||
    !info.State.Running ||
    port?.HostIp !== "127.0.0.1"
  ) {
    throw new Error("Expected the labelled loopback-only disposable container");
  }
  // Keep container credentials in memory; never print driver or subprocess output.
  const config = Object.fromEntries(
    info.Config.Env.map((entry: string) => {
      const index = entry.indexOf("=");
      return [entry.slice(0, index), entry.slice(index + 1)];
    }),
  );
  const maintenance = new URL(`postgresql://127.0.0.1:${port.HostPort}/postgres`);
  maintenance.username = config.POSTGRES_USER;
  maintenance.password = config.POSTGRES_PASSWORD;
  if (maintenance.username !== "audit_admin" || !maintenance.password)
    throw new Error("Unexpected maintenance identity");
  const database = `p00_cli_${randomUUID().replace(/-/g, "")}_test`;
  const target = new URL(maintenance);
  target.pathname = "/" + database;
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: "test",
    ALLOW_DATABASE_TEST_CLEANUP: "1",
    ALLOW_OPERATIONAL_DATABASE_WRITES: "1",
    DATABASE_URL: target.toString(),
    TEST_DATABASE_URL: target.toString(),
    TEST_DATABASE_ADMIN_URL: maintenance.toString(),
    TEST_ADMIN_EMAIL: "p00-admin@example.invalid",
    TEST_ADMIN_PASSWORD: randomUUID() + randomUUID(),
  };
  requireTestDatabaseAdmin(env);
  const results: Record<string, string> = {};
  const run = (file: string, expected = 0) => {
    console.log(`P00 isolated CLI check: ${file} (expected exit ${expected})`);
    const child = spawnSync(process.execPath, ["--import", "tsx", `scratch/${file}.ts`], {
      env,
      encoding: "utf8",
      timeout: 90_000,
    });
    if (child.error || child.status !== expected) {
      if (file === "test-expiry-renewal") {
        const safe = child.stderr?.match(
          /Cart expiry probe refused or failed\. \[[A-Za-z0-9_:]+\]/,
        )?.[0];
        if (safe) console.error(safe);
      }
      throw new Error(`Unexpected exit: ${file}`);
    }
    return child.stdout;
  };
  const admin = new PrismaClient({ datasources: { db: { url: maintenance.toString() } } });
  let client: PrismaClient | undefined;
  let created = false;
  let failure: unknown;
  try {
    run("create-test-db");
    created = true;
    run("create-test-db");
    results.createAndExisting = "passed";
    // Give only the new database to the existing restricted test role.
    await admin.$executeRawUnsafe(`ALTER DATABASE "${database}" OWNER TO audit_test`);
    const local = dotenv.parse(fs.readFileSync(".env.audit.local"));
    const restricted = new URL(local.TEST_DATABASE_URL);
    if (
      restricted.username !== "audit_test" ||
      restricted.hostname !== maintenance.hostname ||
      restricted.port !== port.HostPort
    ) {
      throw new Error("Unexpected restricted audit identity");
    }
    restricted.pathname = "/" + database;
    env.DATABASE_URL = env.TEST_DATABASE_URL = restricted.toString();
    // Empty, newly created database only. This synchronizes schema, not migration history.
    const schema = spawnSync(
      process.execPath,
      ["node_modules/prisma/build/index.js", "db", "push", "--skip-generate"],
      { env, encoding: "utf8", timeout: 90_000 },
    );
    if (schema.error || schema.status !== 0)
      throw new Error("Disposable schema synchronization failed");
    results.schemaSynchronization = "passed; migration history not replayed";
    client = new PrismaClient({ datasources: { db: { url: restricted.toString() } } });
    const inspectStock = (expected: {
      rows: number;
      totalOnHand: number;
      totalReserved: number;
      netOnHandMinusReserved: number;
    }) => {
      const actual = JSON.parse(run("inspect-inventory-stock"));
      if (
        JSON.stringify(actual) !==
        JSON.stringify({ scope: "all-inventory-stock-rows", ...expected })
      )
        throw new Error("Incorrect inventory stock aggregate or unexpected output fields");
    };
    inspectStock({ rows: 0, totalOnHand: 0, totalReserved: 0, netOnHandMinusReserved: 0 });
    results.inventoryInspectionEmpty = "passed; empty database reports zero row count and totals";
    run("verify-restock-reminder");
    run("verify-restock-dispatcher");
    if (
      (await client.product.count()) ||
      (await client.productVariant.count()) ||
      (await client.user.count()) ||
      (await client.location.count()) ||
      (await client.reminder.count())
    ) {
      throw new Error("Restock probes left fixtures in the empty test database");
    }
    results.restockWithoutExistingCatalog =
      "passed; persistence rollback and simulated subscriber cleanup leave no fixtures; SMTP blocked";
    run("test-expiry-renewal");
    if (
      (await client.product.count()) ||
      (await client.productVariant.count()) ||
      (await client.user.count()) ||
      (await client.location.count()) ||
      (await client.shoppingCart.count()) ||
      (await client.cartItem.count()) ||
      (await client.reservation.count()) ||
      (await client.inventoryStock.count())
    ) {
      throw new Error("Expiry probe left fixtures in the empty database");
    }
    results.expiryRenewalWithoutExistingCatalog =
      "passed; real cart service renews cart/reservation expiry and quantity; all owned fixtures removed";
    run("verify-cart-inventory-check");
    if (
      (await client.product.count()) ||
      (await client.productVariant.count()) ||
      (await client.location.count()) ||
      (await client.inventoryStock.count()) ||
      (await client.shoppingCart.count()) ||
      (await client.reservation.count())
    )
      throw new Error("Cart inventory probe left fixtures in the empty database");
    results.cartInventoryEmptyCatalog =
      "passed; real stock aggregation/reservation repository checks; all owned fixtures removed";
    // Sentinels include the old utility's fixed IDs and heterogeneous stock rows.
    const sentinel = {
      product: randomUUID(),
      variant: randomUUID(),
      extraVariant: randomUUID(),
      locations: [randomUUID(), randomUUID()],
      carts: ["f47ac10b-58cc-4372-a567-0e02b2c3d479", "a8097c1a-6415-4df3-aa6a-f864e4307a0c"],
    };
    await client.product.create({
      data: {
        id: sentinel.product,
        title: "Preserved inventory sentinel",
        slug: `sentinel-${sentinel.product}`,
        price: 10,
      },
    });
    await client.productVariant.create({
      data: {
        id: sentinel.variant,
        productId: sentinel.product,
        sku: `KEEP-${sentinel.variant.toUpperCase()}`,
        price: 10,
        allowPreorder: true,
        allowBackorder: true,
      },
    });
    for (const [index, id] of sentinel.locations.entries()) {
      await client.location.create({ data: { id, name: `Sentinel ${id}`, type: "warehouse" } });
      await client.inventoryStock.create({
        data: {
          variantId: sentinel.variant,
          locationId: id,
          onHand: index === 0 ? 11 : 23,
          reserved: index === 0 ? 2 : 4,
        },
      });
    }
    await client.productVariant.create({
      data: {
        id: sentinel.extraVariant,
        productId: sentinel.product,
        sku: `KEEPX-${sentinel.extraVariant.toUpperCase()}`,
        price: 10,
      },
    });
    await client.inventoryStock.createMany({
      data: [
        {
          variantId: sentinel.extraVariant,
          locationId: sentinel.locations[0],
          onHand: 5,
          reserved: 5,
        },
        {
          variantId: sentinel.extraVariant,
          locationId: sentinel.locations[1],
          onHand: 0,
          reserved: 0,
        },
      ],
    });
    for (const id of sentinel.carts)
      await client.shoppingCart.create({ data: { id, currency: "EUR" } });
    await client.cartItem.create({
      data: {
        cartId: sentinel.carts[0],
        variantId: sentinel.variant,
        qty: 2,
        unitPriceSnapshot: 10,
      },
    });
    await client.reservation.create({
      data: {
        id: "e5b8dcd3-10e0-474c-a110-333d4e0e9ab7",
        cartId: sentinel.carts[0],
        variantId: sentinel.variant,
        qty: 2,
        expiresAt: new Date(Date.now() + 600_000),
      },
    });
    const snapshot = async () =>
      JSON.stringify(
        await Promise.all([
          client!.product.findMany({ orderBy: { id: "asc" } }),
          client!.productVariant.findMany({ orderBy: { id: "asc" } }),
          client!.location.findMany({ orderBy: { id: "asc" } }),
          client!.inventoryStock.findMany({
            orderBy: [{ variantId: "asc" }, { locationId: "asc" }],
          }),
          client!.shoppingCart.findMany({ orderBy: { id: "asc" } }),
          client!.cartItem.findMany({ orderBy: { id: "asc" } }),
          client!.reservation.findMany({ orderBy: { id: "asc" } }),
        ]),
      );
    const sentinelBefore = await snapshot();
    inspectStock({ rows: 4, totalOnHand: 39, totalReserved: 11, netOnHandMinusReserved: 28 });
    if ((await snapshot()) !== sentinelBefore)
      throw new Error("Inventory aggregate inspection changed existing rows");
    results.inventoryInspectionMixed =
      "passed; aggregate covers two variants/two warehouses including zero and fully reserved rows; exact safe schema and unchanged full-row snapshots";
    await client.$executeRawUnsafe(
      `REVOKE SELECT ON inventory_management.inventory_stocks FROM audit_test`,
    );
    run("inspect-inventory-stock", 1);
    await client.$executeRawUnsafe(
      `GRANT SELECT ON inventory_management.inventory_stocks TO audit_test`,
    );
    if ((await snapshot()) !== sentinelBefore)
      throw new Error("Denied inventory inspection changed fixture rows");
    results.inventoryInspectionFailure =
      "passed; real denied SELECT exits unsuccessfully and preserves records";
    const negativeStockKey = {
      variantId_locationId: { variantId: sentinel.extraVariant, locationId: sentinel.locations[1] },
    };
    // Deliberately inconsistent synthetic data tests raw reporting, not domain validation.
    await client.inventoryStock.update({ where: negativeStockKey, data: { reserved: 50 } });
    const negativeBefore = await snapshot();
    inspectStock({ rows: 4, totalOnHand: 39, totalReserved: 61, netOnHandMinusReserved: -22 });
    if ((await snapshot()) !== negativeBefore)
      throw new Error("Inventory inspection altered inconsistent test data");
    await client.inventoryStock.update({ where: negativeStockKey, data: { reserved: 0 } });
    if ((await snapshot()) !== sentinelBefore)
      throw new Error("Synthetic stock fixture was not restored");
    results.inventoryInspectionNegativeBalance =
      "passed; inconsistent synthetic reserved quantity remains visible as negative aggregate net; inspector does not clamp or mutate it";
    run("verify-cart-inventory-check");
    if ((await snapshot()) !== sentinelBefore)
      throw new Error("Inventory probe changed sentinel records");
    results.cartInventoryExistingRecords =
      "passed; full-row snapshots preserve heterogeneous warehouses, variant flags, fixed-ID carts, items and reservations";
    await client.$executeRawUnsafe(
      `CREATE FUNCTION inventory_management.p00_inventory_fault() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.on_hand = 3 THEN RAISE EXCEPTION 'P00 injected inventory fixture failure'; END IF; RETURN NEW; END $$`,
    );
    await client.$executeRawUnsafe(
      `CREATE TRIGGER p00_inventory_fault BEFORE INSERT ON inventory_management.inventory_stocks FOR EACH ROW EXECUTE FUNCTION inventory_management.p00_inventory_fault()`,
    );
    run("verify-cart-inventory-check", 1);
    if ((await snapshot()) !== sentinelBefore)
      throw new Error("Inventory setup failure left fixtures or changed sentinels");
    await client.$executeRawUnsafe(
      `DROP TRIGGER p00_inventory_fault ON inventory_management.inventory_stocks`,
    );
    await client.$executeRawUnsafe(`DROP FUNCTION inventory_management.p00_inventory_fault()`);
    results.cartInventorySetupFailure =
      "passed; partial setup rolls back, unsuccessful exit and existing records unchanged";
    await client.$executeRawUnsafe(
      `CREATE FUNCTION cart.p00_inventory_reservation_fault() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'P00 injected reservation failure'; END $$`,
    );
    await client.$executeRawUnsafe(
      `CREATE TRIGGER p00_inventory_reservation_fault BEFORE INSERT ON cart.reservations FOR EACH ROW EXECUTE FUNCTION cart.p00_inventory_reservation_fault()`,
    );
    run("verify-cart-inventory-check", 1);
    if ((await snapshot()) !== sentinelBefore)
      throw new Error("Inventory reservation failure leaked fixtures");
    await client.$executeRawUnsafe(
      `DROP TRIGGER p00_inventory_reservation_fault ON cart.reservations`,
    );
    await client.$executeRawUnsafe(`DROP FUNCTION cart.p00_inventory_reservation_fault()`);
    results.cartInventoryReservationFailure =
      "passed; failure after fixture setup exits unsuccessfully, removes owned fixtures and preserves sentinels";
    await client.$executeRawUnsafe(
      `CREATE FUNCTION inventory_management.p00_inventory_assertion_fault() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.on_hand := NEW.on_hand + 1; RETURN NEW; END $$`,
    );
    await client.$executeRawUnsafe(
      `CREATE TRIGGER p00_inventory_assertion_fault BEFORE INSERT ON inventory_management.inventory_stocks FOR EACH ROW EXECUTE FUNCTION inventory_management.p00_inventory_assertion_fault()`,
    );
    run("verify-cart-inventory-check", 1);
    if ((await snapshot()) !== sentinelBefore)
      throw new Error("Inventory assertion failure leaked fixtures");
    await client.$executeRawUnsafe(
      `DROP TRIGGER p00_inventory_assertion_fault ON inventory_management.inventory_stocks`,
    );
    await client.$executeRawUnsafe(
      `DROP FUNCTION inventory_management.p00_inventory_assertion_fault()`,
    );
    results.cartInventoryAssertionFailure =
      "passed; changed fixture availability is rejected and fixture cleanup preserves existing records";
    await client.reservation.deleteMany({ where: { cartId: { in: sentinel.carts } } });
    await client.cartItem.deleteMany({ where: { cartId: { in: sentinel.carts } } });
    await client.shoppingCart.deleteMany({ where: { id: { in: sentinel.carts } } });
    await client.inventoryStock.deleteMany({
      where: { variantId: { in: [sentinel.variant, sentinel.extraVariant] } },
    });
    await client.product.delete({ where: { id: sentinel.product } });
    await client.location.deleteMany({ where: { id: { in: sentinel.locations } } });
    const inspectionIds = {
      product: randomUUID(),
      variant: randomUUID(),
      carts: [randomUUID(), randomUUID(), randomUUID()],
    };
    const inspectionCutoff = new Date(Date.now() - 60_000);
    const futureExpiry = new Date(Date.now() + 600_000);
    const emptyInspection = JSON.parse(run("inspect-cart-expiry"));
    if (
      JSON.stringify(emptyInspection) !==
      JSON.stringify({
        asOf: emptyInspection.asOf,
        carts: { expired: 0, active: 0, withoutExpiry: 0 },
        reservations: { expired: 0, active: 0 },
        cartItems: 0,
      })
    )
      throw new Error("Incorrect empty inspection counts");
    await client.$transaction(async (tx) => {
      await tx.product.create({
        data: {
          id: inspectionIds.product,
          title: "Inspection fixture",
          slug: `inspect-${inspectionIds.product}`,
          price: 10,
        },
      });
      await tx.productVariant.create({
        data: {
          id: inspectionIds.variant,
          productId: inspectionIds.product,
          sku: `INSPECT-${inspectionIds.variant.toUpperCase()}`,
          price: 10,
        },
      });
      for (const [index, id] of inspectionIds.carts.entries())
        await tx.shoppingCart.create({
          data: {
            id,
            currency: "EUR",
            guestToken: randomUUID(),
            reservationExpiresAt:
              index === 0 ? inspectionCutoff : index === 1 ? futureExpiry : null,
          },
        });
      await tx.reservation.create({
        data: {
          cartId: inspectionIds.carts[0],
          variantId: inspectionIds.variant,
          qty: 1,
          expiresAt: inspectionCutoff,
        },
      });
      await tx.reservation.create({
        data: {
          cartId: inspectionIds.carts[1],
          variantId: inspectionIds.variant,
          qty: 1,
          expiresAt: futureExpiry,
        },
      });
      await tx.cartItem.create({
        data: {
          cartId: inspectionIds.carts[0],
          variantId: inspectionIds.variant,
          qty: 1,
          unitPriceSnapshot: 10,
        },
      });
    });
    const beforeInspection = await snapshot();
    const mixedInspection = JSON.parse(run("inspect-cart-expiry"));
    const expectedInspection = {
      asOf: mixedInspection.asOf,
      carts: { expired: 1, active: 1, withoutExpiry: 1 },
      reservations: { expired: 1, active: 1 },
      cartItems: 1,
    };
    if (
      !Number.isFinite(Date.parse(mixedInspection.asOf)) ||
      JSON.stringify(mixedInspection) !== JSON.stringify(expectedInspection)
    )
      throw new Error("Incorrect mixed inspection counts or unexpected output fields");
    await inspectCartExpiry(
      env,
      (url) => new PrismaClient({ datasources: { db: { url } } }),
      (summary) => {
        if (
          JSON.stringify(summary) !==
          JSON.stringify({ ...expectedInspection, asOf: inspectionCutoff.toISOString() })
        )
          throw new Error("Exact expiry cutoff was not classified as expired");
      },
      inspectionCutoff,
    );
    if ((await snapshot()) !== beforeInspection)
      throw new Error("Read-only inspection changed fixture records");
    results.cartExpiryInspection =
      "passed; empty/mixed/null/equal-cutoff counts; exact count-only output schema; full-row snapshots unchanged";
    await client.$executeRawUnsafe(`REVOKE SELECT ON cart.shopping_carts FROM audit_test`);
    run("inspect-cart-expiry", 1);
    await client.$executeRawUnsafe(`GRANT SELECT ON cart.shopping_carts TO audit_test`);
    if ((await snapshot()) !== beforeInspection)
      throw new Error("Failed read-only inspection changed fixture records");
    results.cartExpiryInspectionFailure =
      "passed; real SELECT permission failure exits unsuccessfully; records unchanged";
    const emptyReminders = { scope: "all-reminders", total: 0, groups: [] };
    for (const command of ["inspect-reminders", "check-db-reminders"]) {
      if (JSON.stringify(JSON.parse(run(command))) !== JSON.stringify(emptyReminders))
        throw new Error("Incorrect empty reminder summary");
    }
    const reminderUser = randomUUID();
    await client.user.create({
      data: {
        id: reminderUser,
        email: `inspection-${reminderUser}@example.invalid`,
        isGuest: true,
      },
    });
    const expectedGroups = [];
    for (const type of ["restock", "price_drop"] as const) {
      for (const status of ["pending", "sent", "unsubscribed"] as const) {
        for (const channel of ["email", "sms", "whatsapp", "push"] as const) {
          const count = type === "restock" && status === "pending" && channel === "email" ? 12 : 1;
          expectedGroups.push({ type, status, channel, count });
          await client.reminder.createMany({
            data: Array.from({ length: count }, () => ({
              type,
              status,
              channel,
              contact: channel === "email" ? ("email" as const) : ("phone" as const),
              variantId: inspectionIds.variant,
              userId: type === "restock" ? reminderUser : null,
              optInAt: status === "pending" ? new Date() : null,
            })),
          });
        }
      }
    }
    const reminderSnapshot = async () =>
      JSON.stringify([
        await snapshot(),
        await client!.reminder.findMany({ orderBy: { id: "asc" } }),
        await client!.user.findUnique({ where: { id: reminderUser } }),
      ]);
    const beforeReminderInspection = await reminderSnapshot();
    const expectedReminders = { scope: "all-reminders", total: 35, groups: expectedGroups };
    for (const command of ["inspect-reminders", "check-db-reminders"]) {
      if (JSON.stringify(JSON.parse(run(command))) !== JSON.stringify(expectedReminders))
        throw new Error("Reminder summary differs from all 24 expected enum groups");
    }
    if ((await reminderSnapshot()) !== beforeReminderInspection)
      throw new Error("Reminder inspection changed fixture records");
    results.reminderInspection =
      "passed; both entrypoints return identical empty and 35-reminder/24-group summaries across every type/status/channel; no latest-ten truncation or identity output; full-row snapshots unchanged";
    await client.$executeRawUnsafe(`REVOKE SELECT ON engagement.reminders FROM audit_test`);
    run("inspect-reminders", 1);
    run("check-db-reminders", 1);
    await client.$executeRawUnsafe(`GRANT SELECT ON engagement.reminders TO audit_test`);
    if ((await reminderSnapshot()) !== beforeReminderInspection)
      throw new Error("Failed reminder inspection changed fixture records");
    results.reminderInspectionFailure =
      "passed; both entrypoints fail on real denied SELECT and preserve all fixture records; no provider called";
    await client.reminder.deleteMany({ where: { variantId: inspectionIds.variant } });
    await client.user.delete({ where: { id: reminderUser } });
    await client.reservation.deleteMany({ where: { cartId: { in: inspectionIds.carts } } });
    await client.cartItem.deleteMany({ where: { cartId: { in: inspectionIds.carts } } });
    await client.shoppingCart.deleteMany({ where: { id: { in: inspectionIds.carts } } });
    await client.product.delete({ where: { id: inspectionIds.product } });
    run("seed-development-db");
    const before = await client.product.findMany({ select: { id: true }, orderBy: { id: "asc" } });
    if (
      before.length !== 28 ||
      (await client.category.count()) !== 24 ||
      (await client.productVariant.count()) !== 97
    )
      throw new Error("Unexpected fixture counts");
    const jpg = await client.mediaAsset.findMany({
      where: { storageKey: { endsWith: ".jpg" } },
      select: { mime: true },
    });
    if (!jpg.length || jpg.some((asset) => asset.mime !== "image/jpeg"))
      throw new Error("Incorrect JPEG metadata");
    results.seedAndMediaMetadata = "passed; 28 products, 24 categories, 97 variants";
    await client.$executeRawUnsafe(
      `CREATE FUNCTION product_catalog.p00_reject_variant() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'P00 injected seed failure'; END $$`,
    );
    await client.$executeRawUnsafe(
      `CREATE TRIGGER p00_reject_variant BEFORE INSERT ON product_catalog.product_variants FOR EACH ROW EXECUTE FUNCTION product_catalog.p00_reject_variant()`,
    );
    run("seed-development-db", 1);
    const after = await client.product.findMany({ select: { id: true }, orderBy: { id: "asc" } });
    if (
      JSON.stringify(before) !== JSON.stringify(after) ||
      (await client.productVariant.count()) !== 97
    )
      throw new Error("Failed seed did not preserve original fixtures");
    await client.$executeRawUnsafe(
      `DROP TRIGGER p00_reject_variant ON product_catalog.product_variants`,
    );
    await client.$executeRawUnsafe(`DROP FUNCTION product_catalog.p00_reject_variant()`);
    results.failedSeedRollback = "passed; original product identities and variant count preserved";
    await client.$executeRawUnsafe(
      `CREATE FUNCTION engagement.p00_reject_reminder() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'P00 injected reminder failure'; END $$`,
    );
    await client.$executeRawUnsafe(
      `CREATE TRIGGER p00_reject_reminder BEFORE INSERT ON engagement.reminders FOR EACH ROW EXECUTE FUNCTION engagement.p00_reject_reminder()`,
    );
    run("verify-restock-reminder", 1);
    run("verify-restock-dispatcher", 1);
    const preservedCatalog = await client.product.findMany({
      select: { id: true },
      orderBy: { id: "asc" },
    });
    if (
      JSON.stringify(before) !== JSON.stringify(preservedCatalog) ||
      (await client.productVariant.count()) !== 97 ||
      (await client.user.count()) ||
      (await client.reminder.count()) ||
      (await client.location.count()) !== 1
    ) {
      throw new Error("Failed restock probes changed the seeded catalog or left fixtures");
    }
    await client.$executeRawUnsafe(`DROP TRIGGER p00_reject_reminder ON engagement.reminders`);
    await client.$executeRawUnsafe(`DROP FUNCTION engagement.p00_reject_reminder()`);
    results.restockInsertFailureRollback =
      "passed; both CLIs fail without leftover fixtures or changes to existing catalog";
    await client.$executeRawUnsafe(
      `CREATE FUNCTION cart.p00_reject_expiry_probe() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'P00 injected cart reservation failure'; END $$`,
    );
    await client.$executeRawUnsafe(
      `CREATE TRIGGER p00_reject_expiry_probe BEFORE INSERT ON cart.reservations FOR EACH ROW EXECUTE FUNCTION cart.p00_reject_expiry_probe()`,
    );
    run("test-expiry-renewal", 1);
    const expiryPreserved = await client.product.findMany({
      select: { id: true },
      orderBy: { id: "asc" },
    });
    if (
      JSON.stringify(before) !== JSON.stringify(expiryPreserved) ||
      (await client.productVariant.count()) !== 97 ||
      (await client.user.count()) ||
      (await client.location.count()) !== 1 ||
      (await client.shoppingCart.count()) ||
      (await client.cartItem.count()) ||
      (await client.reservation.count()) ||
      (await client.inventoryStock.count()) !== 97
    ) {
      throw new Error("Failed expiry probe changed existing catalog or left fixtures");
    }
    await client.$executeRawUnsafe(`DROP TRIGGER p00_reject_expiry_probe ON cart.reservations`);
    await client.$executeRawUnsafe(`DROP FUNCTION cart.p00_reject_expiry_probe()`);
    results.expiryFixtureFailureRollback =
      "passed; unsuccessful exit, no fixture leak and existing catalog preserved";
    await client.$executeRawUnsafe(
      `CREATE FUNCTION cart.p00_reject_expiry_sync() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.expires_at > OLD.expires_at THEN RAISE EXCEPTION 'P00 injected expiry synchronization failure'; END IF; RETURN NEW; END $$`,
    );
    await client.$executeRawUnsafe(
      `CREATE TRIGGER p00_reject_expiry_sync BEFORE UPDATE ON cart.reservations FOR EACH ROW EXECUTE FUNCTION cart.p00_reject_expiry_sync()`,
    );
    run("test-expiry-renewal", 1);
    const syncPreserved = await client.product.findMany({
      select: { id: true },
      orderBy: { id: "asc" },
    });
    if (
      JSON.stringify(before) !== JSON.stringify(syncPreserved) ||
      (await client.productVariant.count()) !== 97 ||
      (await client.user.count()) ||
      (await client.location.count()) !== 1 ||
      (await client.shoppingCart.count()) ||
      (await client.cartItem.count()) ||
      (await client.reservation.count()) ||
      (await client.inventoryStock.count()) !== 97
    ) {
      throw new Error("Expiry synchronization failure leaked fixtures or changed existing catalog");
    }
    await client.$executeRawUnsafe(`DROP TRIGGER p00_reject_expiry_sync ON cart.reservations`);
    await client.$executeRawUnsafe(`DROP FUNCTION cart.p00_reject_expiry_sync()`);
    results.expirySynchronizationFailureCleanup =
      "passed; actual service failure after cart persistence exits unsuccessfully, removes partial fixtures and preserves existing catalog";
    run("seed-admin");
    const user = await client.user.findUniqueOrThrow({ where: { email: env.TEST_ADMIN_EMAIL } });
    if (
      user.role !== "ADMIN" ||
      !user.passwordHash ||
      !(await compare(env.TEST_ADMIN_PASSWORD!, user.passwordHash))
    )
      throw new Error("Invalid test administrator");
    run("seed-admin", 1);
    const existing = await client.user.findUniqueOrThrow({
      where: { email: env.TEST_ADMIN_EMAIL },
    });
    if (user.id !== existing.id || user.passwordHash !== existing.passwordHash)
      throw new Error("Existing administrator was changed");
    results.adminCreateAndConflict = "passed; existing account preserved";
    await client.$executeRawUnsafe(
      `CREATE FUNCTION product_catalog.p00_reject_cleanup() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'P00 injected cleanup failure'; END $$`,
    );
    await client.$executeRawUnsafe(
      `CREATE TRIGGER p00_reject_cleanup BEFORE DELETE ON product_catalog.products FOR EACH ROW EXECUTE FUNCTION product_catalog.p00_reject_cleanup()`,
    );
    run("clear-database", 1);
    const preserved = await client.product.findMany({
      select: { id: true },
      orderBy: { id: "asc" },
    });
    if (
      JSON.stringify(before) !== JSON.stringify(preserved) ||
      (await client.inventoryStock.count()) !== 97 ||
      (await client.productMedia.count()) !== 100
    ) {
      throw new Error("Failed cleanup did not restore deleted fixture relations");
    }
    await client.$executeRawUnsafe(`DROP TRIGGER p00_reject_cleanup ON product_catalog.products`);
    await client.$executeRawUnsafe(`DROP FUNCTION product_catalog.p00_reject_cleanup()`);
    results.failedCleanupRollback = "passed; product identities, stock and media links preserved";
    run("clear-database");
    if (
      (await client.product.count()) ||
      (await client.category.count()) ||
      (await client.inventoryStock.count())
    )
      throw new Error("Catalog cleanup incomplete");
    results.catalogCleanup = "passed";
    await client.$disconnect();
    client = undefined;
  } catch (error) {
    failure = error;
  }
  try {
    await client?.$disconnect();
    if (created) {
      run("drop-test-db");
      run("drop-test-db");
      const remaining = await admin.$queryRaw<
        Array<{ exists: boolean }>
      >`SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = ${database}) AS exists`;
      if (remaining[0]?.exists) throw new Error("Disposable probe database still exists");
      results.dropAndMissing = "passed; newly created database removed";
    }
  } catch (error) {
    failure ??= error;
  } finally {
    await admin.$disconnect();
  }
  if (failure) throw failure;
  const report = {
    date: "2026-10-18",
    container,
    results,
    productionData: "not accessed",
    externalProviders: "not called",
    verified_source_sha256: Object.fromEntries(
      [
        "scripts/testing/database-safety.ts",
        "scripts/testing/operational-database.ts",
        "scripts/testing/restock-probes.ts",
        "scripts/testing/cart-expiry-probe.ts",
        "scripts/testing/cart-inventory-probe.ts",
        "scripts/testing/cart-expiry-inspection.ts",
        "scripts/testing/database-inspection.ts",
        "scripts/testing/reminder-inspection.ts",
        "scripts/testing/inventory-stock-inspection.ts",
        ...[
          "create-test-db",
          "drop-test-db",
          "clear-database",
          "seed-admin",
          "seed-development-db",
          "verify-restock-reminder",
          "verify-restock-dispatcher",
          "test-expiry-renewal",
          "verify-cart-inventory-check",
          "inspect-cart-expiry",
          "inspect-reminders",
          "check-db-reminders",
          "inspect-inventory-stock",
        ].map((name) => `scratch/${name}.ts`),
      ].map((file) => [file, createHash("sha256").update(fs.readFileSync(file)).digest("hex")]),
    ),
    limitation:
      "Disposable schema synchronization and operational CLI checks only; not migration replay or business-module integration certification",
  };
  fs.writeFileSync(
    "docs/reviews/p00-operational-database-check.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
}

main().catch(() => {
  console.error(
    "Isolated operational check failed; raw connection and child outputs withheld. Check probe cleanup before retrying.",
  );
  process.exitCode = 1;
});
