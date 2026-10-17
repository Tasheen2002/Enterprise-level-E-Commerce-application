// Parse fixture literals only. Never import/execute the destructive legacy seed.
const fs = require("node:fs");
const ts = require("typescript");
const file = "scratch/seed-development-db.ts";
const source = ts.createSourceFile(
  file,
  fs.readFileSync(file, "utf8"),
  ts.ScriptTarget.Latest,
  true,
);
if (source.parseDiagnostics.length) throw new Error("Seed source has syntax diagnostics");
const products = [];
const categories = [];
const deletions = [];
const prop = (node, name) =>
  node.properties.find((item) => item.name?.getText(source) === name)?.initializer;
const literal = (node) => {
  if (node && ts.isStringLiteral(node)) return node.text;
  if (node && ts.isNumericLiteral(node)) return Number(node.text);
  throw new Error("Expected a fixture literal");
};
const strings = (node) => node.elements.map(literal);
function visit(node) {
  if (ts.isCallExpression(node)) {
    const name = node.expression.getText(source);
    if (name === "seedProduct") {
      const options = node.arguments[0];
      products.push({
        slug: literal(prop(options, "slug")),
        price: literal(prop(options, "price")),
        color: literal(prop(options, "color")),
        sizes: strings(prop(options, "sizes")),
        images: strings(prop(options, "images")),
        categories: prop(options, "categoryIds").elements.map((item) => item.getText(source)),
        stock: prop(options, "stockQty") ? literal(prop(options, "stockQty")) : 15,
      });
    }
    if (name === "prisma.category.create") {
      const data = prop(node.arguments[0], "data");
      categories.push({
        id: prop(data, "id").getText(source),
        slug: literal(prop(data, "slug")),
        parent: prop(data, "parentId").getText(source),
      });
    }
    if (/^prisma\.\w+\.deleteMany$/.test(name)) deletions.push(name.split(".")[1]);
  }
  ts.forEachChild(node, visit);
}
visit(source);
const failures = [];
const unique = (values, label) => {
  if (new Set(values).size !== values.length) failures.push(`Duplicate ${label}`);
};
unique(
  products.map((product) => product.slug),
  "product slug",
);
unique(
  categories.map((category) => category.slug),
  "category slug",
);
unique(
  categories.map((category) => category.id),
  "category identifier",
);
const seenCategories = new Set();
for (const category of categories) {
  if (category.parent !== "null" && !seenCategories.has(category.parent))
    failures.push(`Parent not created first: ${category.slug}`);
  seenCategories.add(category.id);
}
const skus = [];
for (const product of products) {
  if (
    !Number.isFinite(product.price) ||
    product.price <= 0 ||
    !Number.isInteger(product.stock) ||
    product.stock < 0
  )
    failures.push(`Invalid price/stock: ${product.slug}`);
  if (!product.images.length || !product.sizes.length || !product.categories.length)
    failures.push(`Missing fixture collections: ${product.slug}`);
  if (product.categories.some((category) => !seenCategories.has(category)))
    failures.push(`Unknown category: ${product.slug}`);
  unique(product.images, `images for ${product.slug}`);
  for (const size of product.sizes)
    skus.push(
      `${product.slug.toUpperCase()}-${product.color.toUpperCase().slice(0, 3)}-${size.toUpperCase().replace(/\s+/g, "-")}`,
    );
}
unique(skus, "generated SKU");
const report = {
  date: "2026-10-17",
  file,
  mode: "TypeScript AST inspection only; no seed execution, Prisma or network calls",
  products: products.length,
  categories: categories.length,
  variants: skus.length,
  productMediaLinks: products.reduce((sum, product) => sum + product.images.length, 0),
  deletionOrder: deletions,
  checks:
    "Unique fixture slugs/category identifiers/generated SKUs; created-first category parents; product category references; positive prices/nonnegative integer stock; nonempty media/sizes/categories and per-product image uniqueness",
  failures,
  safetyChanges:
    "Guarded explicit test datasource; single transaction; nonzero failure exit; JPG/PNG MIME selection. Refusal-path tripwire verified separately; see p00-operational-database-check.json for separate real-DB verification.",
  unresolved: [
    "Business-module fixture completeness and cleanup under additional real-world relational states remain subject to module review",
    "EUR, SGD and USD numeric prices are copied from the same value; this is fixture data, not currency conversion",
    "Random IDs and destructive replacement are unsuitable as repeatable integration fixtures without redesign",
    "Asset existence and media delivery were not checked; no provider requests",
  ],
};
fs.writeFileSync(
  "docs/reviews/p00-seed-fixture-check.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
