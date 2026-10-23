// Only touches a newly named database inside the labelled, disposable P00 container.
import { execFileSync, spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { compare, getRounds } from "bcryptjs";
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
    TEST_PRODUCT_TITLE_PREFIX: "Mabillon",
  };
  requireTestDatabaseAdmin(env);
  const results: Record<string, string> = {};
  let stage = "database-creation";
  let failedStage = "initialization";
  const run = (file: string, expected = 0) => {
    stage = file;
    console.log(`P00 isolated CLI check: ${file} (expected exit ${expected})`);
    const child = spawnSync(process.execPath, ["--import", "tsx", `scratch/${file}.ts`], {
      env,
      encoding: "utf8",
      timeout: 90_000,
    });
    if (child.error || child.status !== expected) {
      console.error(
        JSON.stringify({
          command: file,
          expectedExit: expected,
          actualExit: child.status,
          timedOut: child.error?.message.includes("ETIMEDOUT") ?? false,
          launchError: !!child.error,
          signal: child.signal,
        }),
      );
      if (file === "test-expiry-renewal") {
        const safe = child.stderr?.match(/Cart expiry probe refused or failed\./)?.[0];
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
    const expectDatabaseExists = (exists: boolean) => {
      if (
        JSON.stringify(JSON.parse(run("list-databases"))) !==
        JSON.stringify({ scope: "selected-test-database", exists })
      )
        throw new Error("Selected test database existence output mismatch");
    };
    expectDatabaseExists(false);
    run("create-test-db");
    created = true;
    expectDatabaseExists(true);
    run("create-test-db");
    results.createAndExisting = "passed";
    // Give only the new database to the existing restricted test role.
    stage = "restricted-owner-assignment";
    await admin.$executeRawUnsafe(`ALTER DATABASE "${database}" OWNER TO audit_test`);
    stage = "restricted-configuration";
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
    stage = "schema-synchronization";
    const schema = spawnSync(
      process.execPath,
      ["node_modules/prisma/build/index.js", "db", "push", "--skip-generate"],
      { env, encoding: "utf8", timeout: 90_000 },
    );
    if (schema.error || schema.status !== 0)
      throw new Error("Disposable schema synchronization failed");
    results.schemaSynchronization = "passed; migration history not replayed";
    client = new PrismaClient({ datasources: { db: { url: restricted.toString() } } });
    await client.$queryRaw`SELECT 1`;
    run("drop-test-db", 1);
    const activeDatabase = await admin.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = ${database}) AS exists
    `;
    if (!activeDatabase[0]?.exists) throw new Error("Active disposable database was dropped");
    await client.$queryRaw`SELECT 1`;
    results.dropActiveSessionsRefused =
      "passed; DROP refuses a connected selected test database without terminating its sessions; existing client remains usable";
    stage = "catalog-fixtures";
    // Own fixtures only; this malicious-looking name is a legal quoted PostgreSQL identifier.
    const quotedTable = 'public."p00_quoted""; DROP TABLE p00_sentinel; --"';
    await client.$executeRawUnsafe(`CREATE TABLE ${quotedTable} (id integer)`);
    await client.$executeRawUnsafe(`INSERT INTO ${quotedTable} VALUES (1),(2),(3)`);
    await client.$executeRawUnsafe(`CREATE TABLE public.p00_sentinel (id integer)`);
    await client.$executeRawUnsafe(`INSERT INTO public.p00_sentinel VALUES (42)`);
    await client.$executeRawUnsafe(`CREATE TABLE public.p00_empty (id integer)`);
    await client.$executeRawUnsafe(`CREATE TABLE public._prisma_migrations (id integer)`);
    await client.$executeRawUnsafe(`CREATE SCHEMA p00_unrelated_schema`);
    await client.$executeRawUnsafe(`CREATE TABLE p00_unrelated_schema.private_table (id integer)`);
    await client.$executeRawUnsafe(`INSERT INTO p00_unrelated_schema.private_table VALUES (7)`);
    const tableSnapshot = async () =>
      JSON.stringify(
        await Promise.all([
          client!.$queryRawUnsafe(`SELECT * FROM ${quotedTable} ORDER BY id`),
          client!.$queryRawUnsafe(`SELECT * FROM public.p00_sentinel ORDER BY id`),
          client!.$queryRawUnsafe(`SELECT * FROM p00_unrelated_schema.private_table ORDER BY id`),
        ]),
      );
    const beforeTables = await tableSnapshot();
    const initialTables = JSON.parse(run("inspect-databases-local"));
    const findTable = (name: string) =>
      initialTables.tables.find(
        (row: { schema: string; table: string }) => row.schema === "public" && row.table === name,
      );
    if (
      initialTables.scope !== "selected-test-database-application-tables" ||
      initialTables.tablesTruncated ||
      findTable('p00_quoted"; DROP TABLE p00_sentinel; --')?.rows !== "3" ||
      findTable("p00_sentinel")?.rows !== "1" ||
      findTable("p00_empty")?.rows !== "0" ||
      initialTables.tables.some(
        (row: { schema: string; table: string; rows: string }) =>
          row.schema === "p00_unrelated_schema" ||
          row.schema.startsWith("pg_") ||
          row.table === "_prisma_migrations" ||
          !/^[0-9]+$/.test(row.rows) ||
          Object.keys(row).sort().join(",") !== "rows,schema,table",
      ) ||
      (await tableSnapshot()) !== beforeTables
    )
      throw new Error("Table catalog scope, escaping, count output or snapshot assertion failed");
    results.tableCatalogScopeAndEscaping =
      "passed; only selected test DB/application schemas, no migration/system/unrelated tables, legal quoted SQL-like identifier counted safely, zero/nonzero string counts and unchanged sentinel/full fixture snapshots";
    await client.$executeRawUnsafe(`REVOKE SELECT ON ${quotedTable} FROM audit_test`);
    run("inspect-databases-local", 1);
    await client.$executeRawUnsafe(`GRANT SELECT ON ${quotedTable} TO audit_test`);
    if ((await tableSnapshot()) !== beforeTables)
      throw new Error("Failed table counts modified records");
    results.tableCatalogDeniedCount =
      "passed; denied count exits 1 with no partial report or changed rows";
    const extras = 101 - initialTables.tables.length;
    if (extras < 2)
      throw new Error("Unexpected catalog baseline too large for exact-limit fixture");
    for (let i = 0; i < extras; i++) {
      await client.$executeRawUnsafe(`CREATE TABLE public.p00_catalog_extra_${i} (id integer)`);
      if (i === extras - 2 || i === extras - 1) {
        const bounded = JSON.parse(run("inspect-databases-local"));
        if (
          bounded.tables.length !== 100 ||
          bounded.tablesTruncated !== (i === extras - 1) ||
          (await tableSnapshot()) !== beforeTables
        )
          throw new Error("Catalog exact/overflow limit or snapshot assertion failed");
      }
    }
    results.tableCatalogBounds =
      "passed; actual 100/101-table sets return 100 counts with truthful truncation; snapshots unchanged";
    for (let i = 0; i < extras; i++)
      await client.$executeRawUnsafe(`DROP TABLE public.p00_catalog_extra_${i}`);
    await client.$executeRawUnsafe(`DROP TABLE ${quotedTable}`);
    await client.$executeRawUnsafe(
      `DROP TABLE public.p00_sentinel, public.p00_empty, public._prisma_migrations`,
    );
    await client.$executeRawUnsafe(`DROP TABLE p00_unrelated_schema.private_table`);
    await client.$executeRawUnsafe(`DROP SCHEMA p00_unrelated_schema`);
    expectDatabaseExists(true);
    const correctMaintenance = env.TEST_DATABASE_ADMIN_URL;
    const badMaintenance = new URL(correctMaintenance!);
    badMaintenance.password = randomUUID();
    try {
      env.TEST_DATABASE_ADMIN_URL = badMaintenance.toString();
      run("list-databases", 1);
    } finally {
      env.TEST_DATABASE_ADMIN_URL = correctMaintenance;
    }
    results.selectedDatabaseExistence =
      "passed; missing/present exact selected database only; bad maintenance authentication fails; no server-wide database names emitted; existence is not readiness";
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
    if (
      JSON.stringify(JSON.parse(run("inspect-wallets"))) !==
      JSON.stringify({
        scope: "product-title-prefix",
        productsTruncated: false,
        products: [],
      })
    )
      throw new Error("Incorrect empty wallet inspection");
    results.walletInspectionEmpty = "passed; explicit prefix and no matches";
    const inspectLoyalty = (expected: {
      accounts: {
        rows: number;
        currentBalance: string;
        lifetimePoints: string;
        totalPointsEarned: string;
        totalPointsRedeemed: string;
      };
      transactions: { rows: number; storedPointsTotal: string };
    }) => {
      const actual = JSON.parse(run("inspect-loyalty-data"));
      if (JSON.stringify(actual) !== JSON.stringify({ scope: "all-loyalty-rows", ...expected }))
        throw new Error("Incorrect loyalty aggregate or unexpected output fields");
      if (fs.existsSync("scratch/loyalty-data.txt"))
        throw new Error("Loyalty inspector recreated the removed local export");
    };
    // Do not overwrite or delete a user's local export; require absence before any invocation.
    if (fs.existsSync("scratch/loyalty-data.txt"))
      throw new Error("Unexpected local loyalty export");
    inspectLoyalty({
      accounts: {
        rows: 0,
        currentBalance: "0",
        lifetimePoints: "0",
        totalPointsEarned: "0",
        totalPointsRedeemed: "0",
      },
      transactions: { rows: 0, storedPointsTotal: "0" },
    });
    results.loyaltyInspectionEmpty =
      "passed; empty aggregate sums are string zero and no export is written";
    const loyaltyUsers = [randomUUID(), randomUUID()];
    const loyaltyAccounts = [randomUUID(), randomUUID()];
    const loyaltyTransactions = [randomUUID(), randomUUID(), randomUUID()];
    await client.$transaction(async (tx) => {
      await tx.user.createMany({
        data: loyaltyUsers.map((id, i) => ({
          id,
          email: `p00-loyalty-${i}@example.invalid`,
          firstName: "Synthetic",
          lastName: "Private",
        })),
      });
      await tx.loyaltyAccount.createMany({
        data: [
          {
            accountId: loyaltyAccounts[0],
            userId: loyaltyUsers[0],
            joinedAt: new Date(0),
            currentBalance: 9007199254740993n,
            lifetimePoints: 9007199254741000n,
            totalPointsEarned: 9007199254741010n,
            totalPointsRedeemed: 17n,
          },
          {
            accountId: loyaltyAccounts[1],
            userId: loyaltyUsers[1],
            joinedAt: new Date(0),
            currentBalance: 7n,
            lifetimePoints: 5n,
            totalPointsEarned: 10n,
            totalPointsRedeemed: 3n,
          },
        ],
      });
      await tx.loyaltyTransaction.createMany({
        data: [
          {
            transactionId: loyaltyTransactions[0],
            accountId: loyaltyAccounts[0],
            type: "EARN",
            reason: "PRIVATE_REASON",
            description: "PRIVATE_DESCRIPTION",
            points: 9007199254740993n,
            balanceAfter: 9007199254740993n,
          },
          {
            transactionId: loyaltyTransactions[1],
            accountId: loyaltyAccounts[1],
            type: "REDEEM",
            reason: "PRIVATE_REASON",
            points: 7n,
            balanceAfter: 7n,
          },
          {
            transactionId: loyaltyTransactions[2],
            accountId: loyaltyAccounts[1],
            type: "ADJUST",
            reason: "PRIVATE_REASON",
            points: 0n,
            balanceAfter: 7n,
          },
        ],
      });
    });
    const loyaltySnapshot = async () =>
      JSON.stringify(
        await Promise.all([
          client!.user.findMany({ orderBy: { id: "asc" } }),
          client!.loyaltyAccount.findMany({ orderBy: { accountId: "asc" } }),
          client!.loyaltyTransaction.findMany({ orderBy: { transactionId: "asc" } }),
        ]),
        (_key, value) => (typeof value === "bigint" ? value.toString() : value),
      );
    let beforeLoyalty = await loyaltySnapshot();
    const expectedLoyalty = {
      accounts: {
        rows: 2,
        currentBalance: "9007199254741000",
        lifetimePoints: "9007199254741005",
        totalPointsEarned: "9007199254741020",
        totalPointsRedeemed: "20",
      },
      transactions: { rows: 3, storedPointsTotal: "9007199254741000" },
    };
    inspectLoyalty(expectedLoyalty);
    if ((await loyaltySnapshot()) !== beforeLoyalty)
      throw new Error("Loyalty inspection changed records");
    results.loyaltyInspectionExact =
      "passed; two accounts/three transactions, zero and positive stored points, exact totals above Number.MAX_SAFE_INTEGER; fixed identity-free schema and full snapshots unchanged; no export";
    await client.loyaltyAccount.update({
      where: { accountId: loyaltyAccounts[1] },
      data: { currentBalance: -9007199254741000n },
    });
    await client.loyaltyTransaction.update({
      where: { transactionId: loyaltyTransactions[0] },
      data: { points: -9007199254741000n },
    });
    beforeLoyalty = await loyaltySnapshot();
    expectedLoyalty.accounts.currentBalance = "-7";
    expectedLoyalty.transactions.storedPointsTotal = "-9007199254740993";
    inspectLoyalty(expectedLoyalty);
    if ((await loyaltySnapshot()) !== beforeLoyalty)
      throw new Error("Signed loyalty inspection changed records");
    results.loyaltyInspectionSigned =
      "passed; deliberately invalid synthetic negative balances/points remain exact raw totals, without clamping or ledger-validity claims; snapshots unchanged";
    await client.$executeRawUnsafe(`REVOKE SELECT ON user_management.users FROM audit_test`);
    inspectLoyalty(expectedLoyalty);
    await client.$executeRawUnsafe(`GRANT SELECT ON user_management.users TO audit_test`);
    if ((await loyaltySnapshot()) !== beforeLoyalty)
      throw new Error("Identity-denied loyalty inspection changed records");
    results.loyaltyInspectionNoUserReads =
      "passed without SELECT on users; no identity relation required; snapshots unchanged";
    for (const table of ["loyalty_accounts", "loyalty_transactions"]) {
      await client.$executeRawUnsafe(`REVOKE SELECT ON payment_loyalty.${table} FROM audit_test`);
      run("inspect-loyalty-data", 1);
      await client.$executeRawUnsafe(`GRANT SELECT ON payment_loyalty.${table} TO audit_test`);
      if ((await loyaltySnapshot()) !== beforeLoyalty)
        throw new Error("Denied loyalty inspection changed records");
    }
    results.loyaltyInspectionDenied =
      "passed; denied account and transaction SELECT each exit 1 without data changes or local export";
    await client.user.deleteMany({ where: { id: { in: loyaltyUsers } } });
    if ((await client.loyaltyAccount.count()) || (await client.loyaltyTransaction.count()))
      throw new Error("Synthetic loyalty fixtures remain after owned-user cleanup");
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
    const seedOutput = run("seed-development-db");
    if (
      seedOutput.includes("seeded successfully") ||
      !seedOutput.trimEnd().endsWith("Disposable test catalog seed committed.")
    )
      throw new Error("Catalog seed completion output mismatch");
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
    const walletSnapshot = async () =>
      JSON.stringify(
        await Promise.all([
          client!.product.findMany({ orderBy: { id: "asc" } }),
          client!.productMedia.findMany({ orderBy: { id: "asc" } }),
          client!.mediaAsset.findMany({ orderBy: { id: "asc" } }),
        ]),
        (_key, value) => (typeof value === "bigint" ? value.toString() : value),
      );
    let beforeWallet = await walletSnapshot();
    const seededWallets = JSON.parse(run("inspect-wallets"));
    const expectedWalletTitles = [
      "Mabillon Iridescent Champagne",
      "Mabillon Noir",
      "Mabillon Nude Latte",
      "Mabillon Oran Earth",
      "Mabillon Sunrise",
    ];
    if (
      seededWallets.scope !== "product-title-prefix" ||
      seededWallets.productsTruncated ||
      JSON.stringify(seededWallets.products.map((p: { title: string }) => p.title).sort()) !==
        JSON.stringify(expectedWalletTitles) ||
      seededWallets.products.some(
        (p: { mediaTruncated: boolean; media: Array<{ storageKeyPresent: boolean }> }) =>
          p.mediaTruncated || !p.media.length || p.media.some((m) => !m.storageKeyPresent),
      ) ||
      (await walletSnapshot()) !== beforeWallet
    )
      throw new Error("Seeded wallet inspection incorrect or changed records");
    results.walletInspectionSeeded =
      "passed; five Mabillon products with linked media; full product/media/asset snapshots unchanged";
    const walletPrefix = `P00Wallet-${randomUUID()}`;
    const walletIds = Array.from({ length: 21 }, () => randomUUID());
    const walletAssetIds = Array.from({ length: 21 }, () => randomUUID());
    await client.$transaction(async (tx) => {
      await tx.mediaAsset.createMany({
        data: walletAssetIds.map((id, i) => ({
          id,
          mime: "image/jpeg",
          storageKey: i === 0 ? "  " : "PRIVATE_STORAGE_PATH",
        })),
      });
      for (const [i, id] of walletIds.entries()) {
        await tx.product.create({
          data: {
            id,
            title: `${walletPrefix} ${i}`,
            slug: `${walletPrefix.toLowerCase()}-${String(i).padStart(2, "0")}`,
            media:
              i === 0
                ? {
                    create: walletAssetIds.map((assetId, j) => ({
                      id: `00000000-0000-4000-8000-${String(j).padStart(12, "0")}`,
                      assetId,
                      position: j === 20 ? null : Math.floor(j / 2),
                      isCover: j === 0,
                    })),
                  }
                : undefined,
          },
        });
      }
    });
    env.TEST_PRODUCT_TITLE_PREFIX = walletPrefix;
    beforeWallet = await walletSnapshot();
    const boundedWallets = JSON.parse(run("inspect-wallets"));
    const expectedBoundedWallets = {
      scope: "product-title-prefix",
      productsTruncated: true,
      products: walletIds.slice(0, 20).map((_id, i) => ({
        title: `${walletPrefix} ${i}`,
        slug: `${walletPrefix.toLowerCase()}-${String(i).padStart(2, "0")}`,
        mediaTruncated: i === 0,
        media:
          i === 0
            ? walletAssetIds.slice(0, 20).map((_assetId, j) => ({
                position: Math.floor(j / 2),
                isCover: j === 0,
                mime: "image/jpeg",
                storageKeyPresent: j !== 0,
              }))
            : [],
      })),
    };
    if (
      JSON.stringify(boundedWallets) !== JSON.stringify(expectedBoundedWallets) ||
      (await walletSnapshot()) !== beforeWallet
    )
      throw new Error("Wallet bounds, ordering, metadata or unchanged snapshot assertion failed");
    results.walletInspectionBounds =
      "passed; 21 matching products and 21 linked assets yield 20/20 limits with explicit truncation; slug/position/id ordering, null-last and blank key handling; no raw storage paths; exact output schema; snapshots unchanged";
    await client.product.delete({ where: { id: walletIds[20] } });
    await client.productMedia.deleteMany({ where: { assetId: walletAssetIds[20] } });
    beforeWallet = await walletSnapshot();
    expectedBoundedWallets.productsTruncated = false;
    expectedBoundedWallets.products[0].mediaTruncated = false;
    if (
      JSON.stringify(JSON.parse(run("inspect-wallets"))) !==
        JSON.stringify(expectedBoundedWallets) ||
      (await walletSnapshot()) !== beforeWallet
    )
      throw new Error(
        "Exact-limit wallet inspection incorrectly indicates truncation or changed data",
      );
    results.walletInspectionExactLimit =
      "passed; exactly 20 products/media have no truncation flag; snapshots unchanged";
    await client.$executeRawUnsafe(`REVOKE SELECT ON product_catalog.media_assets FROM audit_test`);
    run("inspect-wallets", 1);
    await client.$executeRawUnsafe(`GRANT SELECT ON product_catalog.media_assets TO audit_test`);
    if ((await walletSnapshot()) !== beforeWallet)
      throw new Error("Denied wallet inspection changed records");
    results.walletInspectionDenied =
      "passed; denied asset SELECT yields unsuccessful exit and unchanged snapshots";
    await client.product.deleteMany({ where: { id: { in: walletIds } } });
    await client.mediaAsset.deleteMany({ where: { id: { in: walletAssetIds } } });
    env.TEST_PRODUCT_TITLE_PREFIX = "Mabillon";
    await client.$executeRawUnsafe(
      `CREATE FUNCTION product_catalog.p00_reject_variant() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'P00 injected seed failure'; END $$`,
    );
    await client.$executeRawUnsafe(
      `CREATE TRIGGER p00_reject_variant BEFORE INSERT ON product_catalog.product_variants FOR EACH ROW EXECUTE FUNCTION product_catalog.p00_reject_variant()`,
    );
    const seedSnapshot = async () =>
      JSON.stringify(
        await Promise.all([
          client!.wishlistItem.findMany({ orderBy: [{ wishlistId: "asc" }, { variantId: "asc" }] }),
          client!.wishlist.findMany({ orderBy: { id: "asc" } }),
          client!.cartItem.findMany({ orderBy: { id: "asc" } }),
          client!.shoppingCart.findMany({ orderBy: { id: "asc" } }),
          client!.inventoryTransaction.findMany({ orderBy: { invTxnId: "asc" } }),
          client!.stockAlert.findMany({ orderBy: { alertId: "asc" } }),
          client!.reservation.findMany({ orderBy: { id: "asc" } }),
          client!.inventoryStock.findMany({
            orderBy: [{ variantId: "asc" }, { locationId: "asc" }],
          }),
          client!.productCategory.findMany({
            orderBy: [{ productId: "asc" }, { categoryId: "asc" }],
          }),
          client!.productMedia.findMany({ orderBy: { id: "asc" } }),
          client!.mediaAsset.findMany({ orderBy: { id: "asc" } }),
          client!.productVariant.findMany({ orderBy: { id: "asc" } }),
          client!.product.findMany({ orderBy: { id: "asc" } }),
          client!.category.findMany({ orderBy: { id: "asc" } }),
          client!.location.findMany({ orderBy: { id: "asc" } }),
        ]),
        (_key, value) => (typeof value === "bigint" ? value.toString() : value),
      );
    const beforeSeedFailure = await seedSnapshot();
    const failedSeedOutput = run("seed-development-db", 1);
    if (/seeded successfully|catalog seed committed/.test(failedSeedOutput))
      throw new Error("Failed catalog seed announced success");
    if ((await seedSnapshot()) !== beforeSeedFailure)
      throw new Error("Failed seed changed catalog-related rows");
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
    results.failedSeedRollback =
      "passed; full ordered snapshots of all 15 seed-touched tables preserved after variant insert failure; no success output";
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
    run("verify-admin", 1);
    results.adminInspectionMissing =
      "passed; missing configured test account fails without seeding or changing data";
    const seedPassword = env.TEST_ADMIN_PASSWORD;
    for (const password of ["a".repeat(73), "é".repeat(37)]) {
      env.TEST_ADMIN_PASSWORD = password;
      run("seed-admin", 1);
      if (await client.user.findUnique({ where: { email: env.TEST_ADMIN_EMAIL } }))
        throw new Error("Unsupported test password created an account");
    }
    env.TEST_ADMIN_PASSWORD = seedPassword;
    results.adminSeedRejectedTruncatingPasswords =
      "passed; over-72-byte ASCII and multibyte test passwords are refused and create no account";
    const seedEmail = env.TEST_ADMIN_EMAIL!;
    env.TEST_ADMIN_EMAIL = `  ${seedEmail.toUpperCase()}  `;
    run("seed-admin");
    env.TEST_ADMIN_EMAIL = seedEmail;
    const user = await client.user.findUniqueOrThrow({ where: { email: env.TEST_ADMIN_EMAIL } });
    if (
      user.role !== "ADMIN" ||
      user.status !== "active" ||
      !user.emailVerified ||
      user.isGuest ||
      !user.passwordHash ||
      getRounds(user.passwordHash) !== 12 ||
      !(await compare(env.TEST_ADMIN_PASSWORD!, user.passwordHash))
    )
      throw new Error("Invalid test administrator");
    run("seed-admin", 1);
    const existing = await client.user.findUniqueOrThrow({
      where: { email: env.TEST_ADMIN_EMAIL },
    });
    if (JSON.stringify(user) !== JSON.stringify(existing))
      throw new Error("Existing administrator was changed");
    results.adminCreateAndConflict =
      "passed; normalized configured identity and expected flags; real password hash cost 12 and match verified; duplicate insert preserves full account snapshot";
    const adminSnapshot = async () =>
      JSON.stringify(await client!.user.findUniqueOrThrow({ where: { id: existing.id } }));
    const beforeAdminInspection = await adminSnapshot();
    const expectedAdminInspection = { verified: true, role: "ADMIN", status: "active" };
    if (JSON.stringify(JSON.parse(run("verify-admin"))) !== JSON.stringify(expectedAdminInspection))
      throw new Error("Unexpected administrator inspection output fields");
    if ((await adminSnapshot()) !== beforeAdminInspection)
      throw new Error("Administrator inspection modified account data");
    results.adminInspectionActive =
      "passed; seeded active ADMIN verified with exact safe schema; full account unchanged";
    for (const patch of [
      { role: "CUSTOMER", status: "active" },
      { role: "ADMIN", status: "inactive" },
      { role: "ADMIN", status: "blocked" },
    ] as const) {
      await client.user.update({ where: { id: existing.id }, data: patch });
      const beforeRejectedAdmin = await adminSnapshot();
      run("verify-admin", 1);
      if ((await adminSnapshot()) !== beforeRejectedAdmin)
        throw new Error("Rejected administrator inspection modified account data");
    }
    await client.user.update({
      where: { id: existing.id },
      data: { role: "ADMIN", status: "active", updatedAt: existing.updatedAt },
    });
    if ((await adminSnapshot()) !== beforeAdminInspection)
      throw new Error("Synthetic administrator state was not restored");
    results.adminInspectionWrongState =
      "passed; CUSTOMER, inactive ADMIN and blocked ADMIN fail without changes; fixture state restored";
    // Prisma internally reads the primary key even when only role/status are requested.
    // Permit that key and the email predicate; keep secret columns unavailable.
    await client.$executeRawUnsafe(`REVOKE SELECT ON user_management.users FROM audit_test`);
    await client.$executeRawUnsafe(
      `GRANT SELECT (user_id, email, role, status) ON user_management.users TO audit_test`,
    );
    const secretRights = await client.$queryRaw<
      Array<{ password_read: boolean; mfa_read: boolean }>
    >`SELECT has_column_privilege('audit_test','user_management.users','password_hash','SELECT') AS password_read, has_column_privilege('audit_test','user_management.users','two_factor_secret','SELECT') AS mfa_read`;
    if (secretRights[0]?.password_read !== false || secretRights[0]?.mfa_read !== false)
      throw new Error("Secret user columns remain readable during restricted verification");
    if (JSON.stringify(JSON.parse(run("verify-admin"))) !== JSON.stringify(expectedAdminInspection))
      throw new Error("Administrator inspection requires unexpected user columns");
    await client.$executeRawUnsafe(
      `REVOKE SELECT (user_id, email, role, status) ON user_management.users FROM audit_test`,
    );
    run("verify-admin", 1);
    await client.$executeRawUnsafe(`GRANT SELECT ON user_management.users TO audit_test`);
    if ((await adminSnapshot()) !== beforeAdminInspection)
      throw new Error("Permission-failed administrator inspection modified data");
    results.adminInspectionColumnAccess =
      "passed with SELECT limited to email predicate, ORM-required primary key and role/status; password/MFA columns unreadable; output contains no identity; full denied SELECT fails and account unchanged";
    await client.$executeRawUnsafe(
      `CREATE FUNCTION product_catalog.p00_reject_cleanup() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'P00 injected cleanup failure'; END $$`,
    );
    await client.$executeRawUnsafe(
      `CREATE TRIGGER p00_reject_cleanup BEFORE DELETE ON product_catalog.products FOR EACH ROW EXECUTE FUNCTION product_catalog.p00_reject_cleanup()`,
    );
    const beforeCleanupFailure = await seedSnapshot();
    const cleanupFailureOutput = run("clear-database", 1);
    if (cleanupFailureOutput.includes("Test catalog cleanup committed."))
      throw new Error("Failed cleanup announced success");
    if ((await seedSnapshot()) !== beforeCleanupFailure)
      throw new Error("Failed cleanup changed catalog-related rows");
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
    results.failedCleanupRollback =
      "passed; full ordered snapshots of all 15 catalog-related tables preserved after product-delete failure; no success output";
    const cleanupOutput = run("clear-database");
    if (cleanupOutput.trim() !== "Test catalog cleanup committed.")
      throw new Error("Catalog cleanup completion output mismatch");
    const remainingCatalogRows = await Promise.all([
      client.inventoryStock.count(),
      client.productCategory.count(),
      client.productMedia.count(),
      client.mediaAsset.count(),
      client.productVariant.count(),
      client.product.count(),
      client.category.count(),
      client.location.count(),
    ]);
    if (remainingCatalogRows.some((count) => count !== 0))
      throw new Error("Catalog cleanup incomplete");
    const emptyCatalog = await seedSnapshot();
    run("clear-database");
    if (
      (await seedSnapshot()) !== emptyCatalog ||
      (await adminSnapshot()) !== beforeAdminInspection
    )
      throw new Error("Repeated cleanup changed unrelated or empty fixture records");
    results.catalogCleanup =
      "passed; all eight target tables empty; repeated cleanup succeeds without changes and administrator row remains unchanged";
    await client.$disconnect();
    client = undefined;
  } catch (error) {
    failure = error;
    failedStage = stage;
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
      if (
        JSON.stringify(JSON.parse(run("list-databases"))) !==
        JSON.stringify({ scope: "selected-test-database", exists: false })
      )
        throw new Error("Dropped selected database reported present");
      results.dropAndMissing = "passed; newly created database removed";
    }
  } catch (error) {
    if (!failure) failedStage = stage;
    failure ??= error;
  } finally {
    await admin.$disconnect();
  }
  if (failure) throw new Error(`Verification stage failed: ${failedStage}`, { cause: failure });
  const report = {
    date: new Date().toISOString().slice(0, 10),
    verified_at_utc: new Date().toISOString(),
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
        "modules/cart/infra/persistence/repositories/reservation.repository.impl.ts",
        "modules/cart/application/services/checkout-order.service.ts",
        "modules/cart/application/commands/calculate-checkout-tax.command.ts",
        "scripts/testing/cart-expiry-inspection.ts",
        "scripts/testing/database-inspection.ts",
        "scripts/testing/reminder-inspection.ts",
        "scripts/testing/inventory-stock-inspection.ts",
        "scripts/testing/admin-inspection.ts",
        "scripts/testing/test-admin-settings.ts",
        "scripts/testing/wallet-inspection.ts",
        "scripts/testing/loyalty-inspection.ts",
        "scripts/testing/database-catalog-inspection.ts",
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
          "verify-admin",
          "inspect-wallets",
          "inspect-loyalty-data",
          "inspect-databases-local",
          "list-databases",
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

main().catch((error: unknown) => {
  console.error(
    "Isolated operational check failed; raw connection and child outputs withheld. Check probe cleanup before retrying.",
  );
  if (
    error instanceof Error &&
    (error.message === "Disposable schema synchronization failed" ||
      /^Unexpected exit: [a-z-]+$/.test(error.message) ||
      /^Verification stage failed: [a-z-]+$/.test(error.message))
  ) {
    console.error(`Safe verification stage: ${error.message}`);
  }
  process.exitCode = 1;
});
