import type { PrismaClient } from "@prisma/client";
import { runDatabaseInspection } from "./database-inspection";

export interface WalletInspectionSummary {
  scope: "product-title-prefix";
  productsTruncated: boolean;
  products: Array<{
    title: string;
    slug: string;
    mediaTruncated: boolean;
    media: Array<{
      position: number | null;
      isCover: boolean;
      mime: string;
      storageKeyPresent: boolean;
    }>;
  }>;
}

/** Inspect attachment metadata for an explicit test-product prefix, not a wallet category. */
export async function inspectWalletProducts(
  env: NodeJS.ProcessEnv,
  createClient: (url: string) => PrismaClient,
  report: (summary: WalletInspectionSummary) => void,
): Promise<void> {
  const prefix = env.TEST_PRODUCT_TITLE_PREFIX?.trim();
  // eslint-disable-next-line no-control-regex -- Control characters and LIKE metacharacters are deliberately refused.
  if (!prefix || prefix.length > 100 || /[%_\\\x00-\x1f\x7f]/.test(prefix)) {
    throw new Error("Provide a literal TEST_PRODUCT_TITLE_PREFIX of 1 to 100 characters");
  }
  await runDatabaseInspection<WalletInspectionSummary>(
    env,
    createClient,
    async (prisma) => {
      const products = await prisma.product.findMany({
        where: { title: { startsWith: prefix } },
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
      return {
        scope: "product-title-prefix",
        productsTruncated: products.length > 20,
        products: products.slice(0, 20).map((product) => ({
          title: product.title,
          slug: product.slug,
          mediaTruncated: product.media.length > 20,
          media: product.media.slice(0, 20).map((media) => ({
            position: media.position,
            isCover: media.isCover,
            mime: media.asset.mime,
            storageKeyPresent: media.asset.storageKey.trim().length > 0,
          })),
        })),
      };
    },
    report,
  );
}
