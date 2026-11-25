import type {
  PaginatedResult,
  PaginationOptions,
  DomainEventHandler,
  EventEmittingAggregate,
  IEventBus,
  ICommand,
  ICommandHandler,
  IQuery,
  IQueryHandler,
  SupportedCurrency,
} from "../src";
import type { PaginatedResult as DirectResult } from "../src/domain/interfaces";
import type { LoyaltyAccountRepositoryImpl } from "../../../modules/loyalty/infra/persistence/repositories/loyalty-account.repository.impl";

export const options: PaginationOptions = { limit: 10, offset: 0, sortOrder: "asc" };
export const empty: PaginatedResult<string> = {
  items: [],
  total: 0,
  limit: 10,
  offset: 0,
  hasMore: false,
};
export const compatible: DirectResult<string> = empty;
// @ts-expect-error A page requires continuation metadata.
export const incomplete: PaginatedResult<string> = { items: [], total: 0, limit: 10, offset: 0 };
// @ts-expect-error Item types must survive the public barrel.
export const incorrectItems: PaginatedResult<number> = empty;
// @ts-expect-error Only the two supported directions are accepted.
export const incorrectSort: PaginationOptions = { sortOrder: "descending" };

export type ActualRepositoryPage = Awaited<
  ReturnType<LoyaltyAccountRepositoryImpl["findWithFilters"]>
>;
export function repositoryCompatibility(
  page: ActualRepositoryPage,
): PaginatedResult<ActualRepositoryPage["items"][number]> {
  return page;
}

// Resolve every public type-only contract through the package root.
export type PublicContracts = [
  DomainEventHandler,
  EventEmittingAggregate,
  IEventBus,
  ICommand,
  ICommandHandler<ICommand>,
  IQuery,
  IQueryHandler<IQuery>,
  SupportedCurrency,
];
