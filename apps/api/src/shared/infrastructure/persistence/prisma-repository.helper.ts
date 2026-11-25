import {
  PaginatedResult,
  PaginationOptions,
} from "../../../../../../packages/core/src/domain/interfaces/paginated-result.interface";

interface PaginationQueryOptions {
  where?: unknown;
  orderBy?: unknown;
  include?: unknown;
  select?: unknown;
}

type PaginationWhere<TQuery extends PaginationQueryOptions> = "where" extends keyof TQuery
  ? TQuery["where"]
  : undefined;

interface PaginationDelegate<TRecord, TQuery extends PaginationQueryOptions> {
  findMany(args: TQuery & { take: number; skip: number }): PromiseLike<TRecord[]>;
  count(args: { where?: PaginationWhere<TQuery> }): PromiseLike<number>;
}

/**
 * Helper utilities for Prisma repository operations.
 * Provides pagination, filtering, and common query patterns.
 */
export class PrismaRepositoryHelper {
  /**
   * Execute a paginated query on a Prisma model.
   *
   * @param model - The Prisma model delegate (e.g. prisma.user)
   * @param queryOptions - Prisma query options (where, orderBy, include, etc.)
   * @param toDomain - Function to convert a database record to a domain entity
   * @param options - Optional pagination parameters (limit, offset)
   * Ordering belongs in queryOptions.orderBy. The page and count are separate
   * concurrent reads, not a transactionally consistent snapshot. Callers needing
   * snapshot consistency must provide that boundary separately.
   */
  static async paginate<
    TRecord,
    TEntity,
    const TQuery extends PaginationQueryOptions = PaginationQueryOptions,
  >(
    // Infer the mapper's input without widening a selected row to the full model.
    model: PaginationDelegate<NoInfer<TRecord>, TQuery>,
    queryOptions: TQuery,
    toDomain: (record: TRecord) => TEntity,
    options?: Pick<PaginationOptions, "limit" | "offset">,
  ): Promise<PaginatedResult<TEntity>> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    if (!Number.isSafeInteger(limit) || limit <= 0 || !Number.isSafeInteger(offset) || offset < 0)
      throw new Error("Invalid pagination options");

    const [records, total] = await Promise.all([
      model.findMany({
        ...queryOptions,
        take: limit,
        skip: offset,
      }),
      model.count({ where: queryOptions.where as PaginationWhere<TQuery> }),
    ]);

    return {
      items: records.map((record: TRecord) => toDomain(record)),
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }
}
