import { config } from "@/lib/config";
import { getAuthToken, onUnauthorized } from "@/lib/auth";
import { refreshAccessToken } from "@/lib/auth-refresh";

export const API_PREFIX = "/api/v1";

export class ApiCallError extends Error {
  readonly statusCode: number;
  readonly code?: string;
  readonly fieldErrors?: Record<string, string>;

  constructor(
    message: string,
    statusCode: number,
    code?: string,
    fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiCallError";
    this.statusCode = statusCode;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

interface BackendErrorBody {
  success: false;
  statusCode: number;
  message: string;
  code?: string;
  error?: unknown;
  errors?: string[];
}

interface BackendSuccessBody<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
}

export type BackendBody<T> = BackendSuccessBody<T> | BackendErrorBody;

/**
 * Standardized Request Engine
 * Used across all features for robust, authenticated API calls.
 */
export async function request<T>(
  path: string,
  init: RequestInit & { body?: BodyInit | null },
): Promise<T> {
  return doRequest<T>(path, init, false);
}

async function doRequest<T>(
  path: string,
  init: RequestInit & { body?: BodyInit | null },
  isRetry: boolean,
): Promise<T> {
  const token = getAuthToken();
  const normalizedPath = path.startsWith(API_PREFIX)
    ? path
    : `${API_PREFIX}${path}`;

  const response = await fetch(`${config.apiBaseUrl}${normalizedPath}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (response.status === 401 && !isRetry && path !== "/auth/refresh") {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return doRequest<T>(path, init, true);
    }
    void onUnauthorized();
  }

  if (response.status === 204) {
    return {} as T;
  }

  let body: BackendBody<T>;
  try {
    const text = await response.text();
    if (!text) return {} as T;
    body = JSON.parse(text) as BackendBody<T>;
  } catch {
    throw new ApiCallError(
      "The server returned an unreadable response.",
      response.status,
    );
  }

  if (!body.success) {
    const fieldErrors = extractFieldErrors(body.error);
    throw new ApiCallError(
      body.message ?? "Request failed",
      body.statusCode ?? response.status,
      body.code,
      fieldErrors,
    );
  }

  return body.data;
}

function extractFieldErrors(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const out: Record<string, string> = {};
  for (const [field, value] of Object.entries(raw)) {
    if (
      value &&
      typeof value === "object" &&
      "_errors" in value &&
      Array.isArray((value as { _errors: unknown })._errors) &&
      (value as { _errors: string[] })._errors.length > 0
    ) {
      out[field] = (value as { _errors: string[] })._errors[0]!;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * Helper to unwrap data from our canonical response envelope.
 * Throws if the data is unexpectedly missing.
 */
export function unwrap<T>(data: T | undefined | null): T {
  if (data === undefined || data === null) {
    throw new Error("Expected data to be defined in response");
  }
  return data;
}

/**
 * Shared API client instance.
 * Provides clean HTTP verb methods for feature services.
 * Supports both lowercase (throws error) and uppercase (returns {data, error}) patterns.
 */
export const api = {
  // Lowercase methods: throw ApiCallError on failure
  get: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body: any, options?: RequestInit) =>
    request<T>(path, { ...options, method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: any, options?: RequestInit) =>
    request<T>(path, { ...options, method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: any, options?: RequestInit) =>
    request<T>(path, { ...options, method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: "DELETE" }),

  // Uppercase aliases: return { data, error } object (openapi-fetch style)
  GET: <T>(path: string, options?: any) => safeRequest<T>(path, "GET", options),
  POST: <T>(path: string, options?: any) => safeRequest<T>(path, "POST", options),
  PUT: <T>(path: string, options?: any) => safeRequest<T>(path, "PUT", options),
  PATCH: <T>(path: string, options?: any) => safeRequest<T>(path, "PATCH", options),
  DELETE: <T>(path: string, options?: any) => safeRequest<T>(path, "DELETE", options),
};

/**
 * Internal helper for the uppercase { data, error } pattern.
 */
async function safeRequest<T>(path: string, method: string, options?: any) {
  try {
    const data = await request<T>(path, {
      ...options,
      method,
      ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
