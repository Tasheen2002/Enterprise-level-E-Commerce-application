import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { DomainValidationError } from "../../../../../packages/core/src/domain/domain-error";

export interface ErrorEnvelope {
  success: false;
  statusCode: number;
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

export function errorStatus(value: unknown, fallback = 500): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 400 && value <= 599
    ? value
    : fallback;
}

export function serializeError(error: unknown): ErrorEnvelope {
  if (error instanceof ZodError) {
    const details: Record<string, string[]> = Object.create(null);
    for (const issue of error.issues)
      (details[issue.path.join(".") || "_root"] ??= []).push(issue.message);
    return {
      success: false,
      statusCode: 400,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      details,
    };
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = {
      P2002: [409, "Resource already exists"],
      P2025: [404, "Resource not found"],
      P2003: [400, "Invalid reference to related resource"],
    } as const;
    const known = Object.hasOwn(mapped, error.code)
      ? mapped[error.code as keyof typeof mapped]
      : undefined;
    if (known) return { success: false, statusCode: known[0], message: known[1], code: error.code };
  }
  if (error instanceof Prisma.PrismaClientValidationError)
    return {
      success: false,
      statusCode: 400,
      message: "Invalid database operation",
      code: "VALIDATION_ERROR",
    };
  const candidate =
    error && typeof error === "object"
      ? (error as { statusCode?: unknown; message?: unknown; code?: unknown })
      : {};
  const statusCode = errorStatus(candidate.statusCode);
  return {
    success: false,
    statusCode,
    message:
      statusCode >= 500
        ? "An unexpected error occurred"
        : typeof candidate.message === "string"
          ? candidate.message
          : "Request failed",
    code:
      statusCode >= 500
        ? "INTERNAL_ERROR"
        : typeof candidate.code === "string"
          ? candidate.code
          : undefined,
    ...(statusCode < 500 &&
    error instanceof DomainValidationError &&
    typeof error.field === "string" &&
    error.field.length > 0
      ? { details: { [error.field]: [error.message] } }
      : {}),
  };
}
