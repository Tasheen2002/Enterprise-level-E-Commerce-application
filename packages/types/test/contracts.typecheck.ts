import type {
  ApiEnvelope,
  ApiError,
  ApiSuccess,
  ISODateString,
  UUID,
  Maybe,
  Nullable,
  PaginatedResult,
  Result,
} from "../src";
import type { ErrorEnvelope } from "../../../apps/api/src/shared/http/error-response";
import type { SuccessResponse } from "../../../apps/api/src/shared/response.helper";
import type { PaginatedResult as DomainPage } from "../../core/src/domain/interfaces";
import { unwrap } from "../../api-client/src";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;
export type MatchingErrorEnvelope = Assert<Equal<ApiError, ErrorEnvelope>>;
export type MatchingPagination = Assert<Equal<PaginatedResult<string>, DomainPage<string>>>;
export type PlainWireUuid = Assert<Equal<UUID, string>>;
export type PlainWireDate = Assert<Equal<ISODateString, string>>;
export type NullAlias = Assert<Equal<Nullable<number>, number | null>>;
export type UndefinedAlias = Assert<Equal<Maybe<number>, number | undefined>>;

export const action: ApiSuccess<void> = { success: true, statusCode: 200, message: "Done" };
export function acceptsBackendSuccess(
  response: SuccessResponse<{ id: string }>,
): ApiSuccess<{ id: string }> {
  return response;
}
export function optionalPayloadMustBeChecked(envelope: ApiEnvelope<{ id: string }>) {
  const payload = unwrap(envelope);
  // @ts-expect-error A success envelope does not guarantee a data field.
  const unchecked: string = payload.id;
  return { unchecked, checked: payload?.id };
}
export function successDiscrimination(envelope: ApiEnvelope<{ id: string }>) {
  if (envelope.success) {
    // @ts-expect-error The success discriminant does not guarantee a payload.
    return envelope.data.id;
  }
  return envelope.details?.id;
}
export function requiredPayloadStaysPrecise(
  envelope: ApiEnvelope<{ id: string }> & { data: { id: string } },
): string {
  return unwrap(envelope).id;
}
export function resultDiscrimination(result: Result<number, string>): string {
  if (result.ok) {
    // @ts-expect-error The success branch has no error member.
    void result.error;
    return result.value.toFixed(0);
  }
  // @ts-expect-error The error branch has no value member.
  void result.value;
  return result.error.toUpperCase();
}
export const invalidDetails: ApiError = {
  success: false,
  statusCode: 400,
  message: "Invalid",
  // @ts-expect-error Details map fields to arrays of messages.
  details: { id: "Required" },
};
// @ts-expect-error The page metadata includes hasMore.
export const incompletePage: PaginatedResult<string> = {
  items: [],
  total: 0,
  offset: 0,
  limit: 10,
};
