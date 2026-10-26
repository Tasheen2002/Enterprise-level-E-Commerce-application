export const BEARER_AUTH_CHALLENGE = 'Bearer realm="api"';

/** Only credential rejections may become anonymous/401; infrastructure errors must propagate. */
export function isUnauthorizedError(error: unknown): boolean {
  return (
    error !== null && typeof error === "object" && "statusCode" in error && error.statusCode === 401
  );
}
