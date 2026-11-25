import type { ICommand, ICommandHandler, IQuery, IQueryHandler } from "../src/application";

export async function unspecifiedQueryMustBeNarrowed(handler: IQueryHandler<IQuery>) {
  const value = await handler.handle({});
  // @ts-expect-error An unspecified query result must be narrowed before property access.
  return value.total;
}

export async function typedQueryKeepsItsContract(
  handler: IQueryHandler<IQuery, { total: number }>,
) {
  const value = await handler.handle({});
  return value.total.toFixed(0);
}

export async function unspecifiedCommandHasNoResult(handler: ICommandHandler<ICommand>) {
  const value = await handler.handle({});
  // @ts-expect-error The default command result is void.
  return value.total;
}

export function metadataRemainsReadonly(command: ICommand, query: IQuery) {
  // @ts-expect-error Request metadata is readonly.
  command.commandId = "changed";
  // @ts-expect-error Request metadata is readonly.
  query.queryId = "changed";
}
