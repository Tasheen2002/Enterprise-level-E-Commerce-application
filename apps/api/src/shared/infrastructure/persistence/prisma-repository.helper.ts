import {
  PaginatedResult,
  PaginationOptions,
} from '../../../../../../packages/core/src/domain/interfaces/paginated-result.interface';

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
   * @param paginationOptions - Optional pagination parameters (limit, offset)
   */
  static async paginate<TRecord, TEntity>(
    model: any,
    queryOptions: {
      where?: any;
      orderBy?: any;
      include?: any;
      select?: any;
    },
    toDomain: (record: TRecord) => TEntity,
    options?: PaginationOptions
  ): Promise<PaginatedResult<TEntity>> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const [records, total] = await Promise.all([
      model.findMany({
        ...queryOptions,
        take: limit,
        skip: offset,
      }),
      model.count({ where: queryOptions.where }),
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
