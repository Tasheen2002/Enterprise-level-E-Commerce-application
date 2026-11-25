// Real route-registration functions with inert controllers. No request/DB/provider calls.
const fs = require("node:fs");
const Fastify = require("fastify");
const entries = [
  ["user-management", "registerUserManagementRoutes"],
  ["product-catalog", "registerProductCatalogRoutes"],
  ["inventory-management", "registerInventoryManagementRoutes"],
  ["cart", "registerCartModuleRoutes"],
  ["order-management", "registerOrderManagementRoutes"],
  ["payment", "registerPaymentRoutes"],
  ["loyalty", "registerLoyaltyRoutes"],
  ["engagement", "registerEngagementRoutes"],
];
function inert() {
  const target = function () {
    throw new Error("A controller must never execute in registration capture");
  };
  return new Proxy(target, {
    get(_target, key) {
      if (key === "then") return undefined;
      if (key === "bind") return target.bind.bind(target);
      return inert();
    },
  });
}
async function capture(profile) {
  const app = Fastify({ logger: false, ajv: { customOptions: { keywords: ["example"] } } });
  const rows = [];
  let currentArea = "initializing";
  app.addHook("onRoute", (options) => {
    for (const method of Array.isArray(options.method) ? options.method : [options.method]) {
      rows.push({
        profile,
        area: currentArea,
        method,
        path: options.url,
        declared_prefix: options.prefix,
        controller_execution: "none",
        authorization_verification: "pending-real-container-and-request-tests",
      });
    }
  });
  try {
    for (const [area, exported] of entries) {
      currentArea = area;
      const { [exported]: register } = require(`../../modules/${area}/infra/http/routes/index.ts`);
      const proxy = inert();
      const controllers = new Proxy(proxy, {
        get(target, key) {
          if (
            profile === "providers-disabled" &&
            ["stripeController", "stripeCardSetupController"].includes(key)
          )
            return null;
          return target[key];
        },
      });
      await register(app, controllers);
    }
    await app.ready();
    return { profile, status: "registered-and-schema-compiled", routes: rows, error: null };
  } catch (error) {
    return {
      profile,
      status: "registration-failed",
      routes: rows,
      error: { name: error.name, code: error.code ?? "", message: error.message },
      area_at_failure: currentArea,
    };
  } finally {
    await app.close();
  }
}
(async () => {
  const results = [];
  for (const profile of ["providers-disabled", "stripe-controllers-stubbed"])
    results.push(await capture(profile));
  fs.writeFileSync(
    "docs/reviews/p00-route-registration.json",
    JSON.stringify(
      {
        date: "2026-10-17",
        mode: "real-registrars-inert-controllers",
        limitations:
          "No production container/plugin initialization, HTTP requests, effective policy proof, DB/provider calls or Next runtime. HEAD routes can be generated automatically. Stubbed Stripe controllers expose conditional registration only, not Stripe behavior.",
        results,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    JSON.stringify(
      results.map(({ routes, ...result }) => ({
        ...result,
        route_count_including_generated_head: routes.length,
      })),
      null,
      2,
    ),
  );
  if (results.some((result) => result.status !== "registered-and-schema-compiled"))
    process.exitCode = 1;
})();
