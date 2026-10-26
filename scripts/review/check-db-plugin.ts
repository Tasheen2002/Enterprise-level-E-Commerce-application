// Only creates/removes its own empty database in the labelled disposable audit container.
import { execFileSync } from "node:child_process";
import { randomUUID, createHash } from "node:crypto";
import fs from "node:fs";
import Fastify, { type FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import configPlugin from "../../apps/api/src/plugins/config";
import dbPlugin from "../../apps/api/src/plugins/db";
import { requireTestDatabaseAdmin } from "../testing/operational-database";

async function main() {
  const container = "slipperze-audit-p00-postgres";
  const docker = (...args: string[]) =>
    execFileSync("docker", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 15000,
    });
  const inspect = () => JSON.parse(docker("inspect", container))[0];
  let info = inspect();
  if (
    info.Config.Labels?.["slipperze.audit"] !== "p00-disposable" ||
    info.HostConfig.PortBindings?.["5432/tcp"]?.[0]?.HostIp !== "127.0.0.1"
  )
    throw new Error("Unsafe audit container");
  const wasRunning: boolean = info.State.Running;
  let started = false;
  let admin: PrismaClient | undefined;
  let created = false;
  let roleCreated = false;
  const role = `p01_audit_${randomUUID().replace(/-/g, "")}`;
  let database = "";
  let failed = false;
  let restored = false;
  let stage = "container-start";
  let failedStage: string | undefined;
  let failureCode: string | undefined;
  const apps: FastifyInstance[] = [];
  const results: Record<string, boolean> = {};
  const oldAmbient = process.env.DATABASE_URL;
  try {
    if (!wasRunning) {
      docker("start", container);
      started = true;
    }
    let ready = false;
    for (let attempt = 0; attempt < 20; attempt++) {
      try {
        docker("exec", container, "pg_isready", "-U", "audit_admin");
        ready = true;
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
    if (!ready) throw new Error("Disposable PostgreSQL unavailable");
    stage = "runtime-binding";
    info = inspect();
    const port = info.NetworkSettings.Ports["5432/tcp"]?.[0];
    if (!info.State.Running || port?.HostIp !== "127.0.0.1")
      throw new Error("Unsafe runtime binding");
    stage = "audit-identities";
    const credentials = Object.fromEntries(
      info.Config.Env.map((entry: string) => {
        const i = entry.indexOf("=");
        return [entry.slice(0, i), entry.slice(i + 1)];
      }),
    );
    if (credentials.POSTGRES_USER !== "audit_admin" || !credentials.POSTGRES_PASSWORD)
      throw new Error("Unexpected audit identity");
    const maintenance = new URL(`postgresql://127.0.0.1:${port.HostPort}/postgres`);
    maintenance.username = credentials.POSTGRES_USER;
    maintenance.password = credentials.POSTGRES_PASSWORD;
    const target = new URL(maintenance);
    target.username = role;
    target.password = randomUUID().replace(/-/g, "");
    database = `p01_db_${randomUUID().replace(/-/g, "")}_test`;
    target.pathname = "/" + database;
    requireTestDatabaseAdmin({
      NODE_ENV: "test",
      ALLOW_DATABASE_TEST_CLEANUP: "1",
      ALLOW_OPERATIONAL_DATABASE_WRITES: "1",
      TEST_DATABASE_URL: target.toString(),
      TEST_DATABASE_ADMIN_URL: maintenance.toString(),
    });
    stage = "database-creation";
    admin = new PrismaClient({ datasources: { db: { url: maintenance.toString() } } });
    // Fresh identifiers/password contain only a fixed prefix and UUID hex; never reuse/alter a role.
    await admin.$executeRawUnsafe(
      `CREATE ROLE "${role}" LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD '${target.password}'`,
    );
    roleCreated = true;
    await admin.$executeRawUnsafe(`CREATE DATABASE "${database}" OWNER "${role}"`);
    created = true;
    process.env.DATABASE_URL =
      "postgresql://synthetic:synthetic@127.0.0.1:1/refused_test?connect_timeout=1";
    const sessions = async () =>
      Number(
        (
          await admin!.$queryRaw<
            Array<{ count: bigint }>
          >`SELECT count(*) FROM pg_stat_activity WHERE datname = ${database}`
        )[0]!.count,
      );
    stage = "plugin-registration";
    for (let index = 0; index < 2; index++) {
      const app = Fastify({ logger: false });
      apps.push(app);
      await app.register(configPlugin, {
        environment: {
          DATABASE_URL: target.toString(),
          JWT_SECRET: "synthetic-check-only",
          NODE_ENV: "test",
        },
      });
      await app.register(dbPlugin);
      await app.ready();
    }
    stage = "lazy-session-check";
    if ((await sessions()) !== 0) throw new Error("Expected lazy clients");
    results.lazyBeforeFirstQuery = true;
    stage = "datasource-query";
    for (const app of apps) {
      const row = (
        await app.prisma.$queryRaw<
          Array<{ database: string; role: string }>
        >`SELECT current_database() AS database, current_user AS role`
      )[0]!;
      if (row.database !== database || row.role !== role) throw new Error("Datasource mismatch");
    }
    if (apps[0]!.prisma === apps[1]!.prisma || (await sessions()) < 2)
      throw new Error("Expected distinct client sessions");
    results.explicitValidatedDatasourceDespiteAmbient = true;
    await apps[0]!.close();
    await apps[1]!.prisma.$queryRaw`SELECT 1`;
    results.independentClientOwnership = true;
    await apps[1]!.close();
    if ((await sessions()) !== 0) throw new Error("Database sessions leaked");
    results.disconnectReleasesAllTargetSessions = true;
  } catch (error) {
    failedStage = stage;
    const candidate = error as { code?: unknown; meta?: { code?: unknown } };
    const codes = [candidate?.code, candidate?.meta?.code].filter(
      (value): value is string => typeof value === "string" && /^[A-Z0-9]{4,6}$/.test(value),
    );
    failureCode = codes.join("/") || "unclassified";
    failed = true;
  } finally {
    for (const app of apps) {
      try {
        await app.close();
      } catch {
        failed = true;
      }
    }
    if (oldAmbient === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = oldAmbient;
    if (admin) {
      try {
        if (created) {
          // Never FORCE/terminate sessions: a leaked session must fail the check.
          await admin.$executeRawUnsafe(`DROP DATABASE "${database}"`);
          const rows = await admin.$queryRaw<
            Array<{ exists: boolean }>
          >`SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = ${database}) AS exists`;
          results.temporaryDatabaseRemoved = !rows[0]!.exists;
          if (rows[0]!.exists) failed = true;
        }
        if (roleCreated && (!created || results.temporaryDatabaseRemoved)) {
          await admin.$executeRawUnsafe(`DROP ROLE "${role}"`);
          const roles = await admin.$queryRaw<
            Array<{ exists: boolean }>
          >`SELECT EXISTS(SELECT 1 FROM pg_roles WHERE rolname = ${role}) AS exists`;
          results.temporaryRoleRemoved = !roles[0]!.exists;
          if (roles[0]!.exists) failed = true;
        }
      } catch {
        failed = true;
      } finally {
        await admin.$disconnect().catch(() => {
          failed = true;
        });
      }
    }
    if (started) {
      try {
        if (inspect().Config.Labels?.["slipperze.audit"] === "p00-disposable") {
          docker("stop", container);
          restored = !inspect().State.Running;
        } else failed = true;
      } catch {
        failed = true;
      }
    } else restored = inspect().State.Running === wasRunning;
  }
  const report = {
    date: new Date().toISOString().slice(0, 10),
    passed: !failed && restored,
    results,
    initial_container_running: wasRunning,
    container_state_restored: restored,
    failed_stage: failedStage,
    failure_code: failureCode,
    production_data: "not accessed",
    providers: "not called",
    scope:
      "New empty disposable database; actual Prisma plugin raw-query/session lifecycle, no schema migration or business data",
    verified_source_sha256: Object.fromEntries(
      [
        "apps/api/src/plugins/db.ts",
        "apps/api/src/plugins/config.ts",
        "scripts/review/check-db-plugin.ts",
      ].map((file) => [file, createHash("sha256").update(fs.readFileSync(file)).digest("hex")]),
    ),
  };
  fs.writeFileSync("coverage/p01-db-live.json", JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report));
  if (!report.passed) process.exitCode = 1;
}
void main().catch(() => {
  console.error("Isolated database-plugin check failed; raw connection details withheld.");
  process.exitCode = 1;
});
