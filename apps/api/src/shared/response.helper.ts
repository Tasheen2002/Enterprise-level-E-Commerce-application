import { FastifyReply } from "fastify";
import { ZodError } from "zod";
import { CommandResult } from "../../../../packages/core/src/application/command-result";
import { QueryResult } from "../../../../packages/core/src/application/query-result";

export interface SuccessResponse<T = any> {
  success: true;
  statusCode: number;
  message: string;
  data?: T;
}

export interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error?: string;
  errors?: string[];
}

export class ResponseHelper {
  static success<T>(
    reply: FastifyReply,
    statusCode: number,
    message: string,
    data?: T,
  ): FastifyReply {
    const response: SuccessResponse<T> = { success: true, statusCode, message };
    if (data !== undefined) {
      response.data = data;
    }
    return reply.status(statusCode).send(response);
  }

  static error(reply: FastifyReply, error: unknown): FastifyReply {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        success: false,
        statusCode: 400,
        message: "Validation failed",
        error: error.format(),
      });
    }

    const statusCode =
      error && typeof error === "object" && "statusCode" in error
        ? (error as { statusCode: number }).statusCode
        : 500;

    const message =
      error instanceof Error ? error.message : "Internal server error";

    const errorCode =
      error && typeof error === "object" && "code" in error
        ? (error as { code: string }).code
        : undefined;

    const errorName =
      statusCode === 409 ? "Conflict"
        : statusCode === 404 ? "Not Found"
        : statusCode === 401 ? "Unauthorized"
        : statusCode === 403 ? "Forbidden"
        : statusCode === 400 ? "Bad Request"
        : "Internal Server Error";

    return reply.status(statusCode).send({
      success: false,
      statusCode,
      error: errorName,
      code: errorCode,
      message,
    });
  }

  static unauthorized(
    reply: FastifyReply,
    message: string = "User not authenticated",
  ): FastifyReply {
    return reply.status(401).send({ success: false, statusCode: 401, message });
  }

  static forbidden(
    reply: FastifyReply,
    message: string = "Access forbidden",
  ): FastifyReply {
    return reply.status(403).send({ success: false, statusCode: 403, message });
  }

  static notFound(
    reply: FastifyReply,
    message: string = "Resource not found",
  ): FastifyReply {
    return reply.status(404).send({ success: false, statusCode: 404, message });
  }

  static badRequest(
    reply: FastifyReply,
    message: string,
    errors?: string[],
  ): FastifyReply {
    return reply.status(400).send({
      success: false,
      statusCode: 400,
      message,
      ...(errors && errors.length > 0 ? { errors } : {}),
    });
  }

  // Handles CommandResult directly — maps success/failure to the correct HTTP response
  static fromCommand<T>(
    reply: FastifyReply,
    result: CommandResult<T>,
    successMessage: string,
    statusCode?: 200 | 201,
    noContentCode?: 204,
  ): FastifyReply {
    if (result.success) {
      if (noContentCode === 204) {
        return reply.status(204).send();
      }
      return ResponseHelper.success(reply, statusCode ?? 200, successMessage, result.data);
    }
    return reply.status(400).send({
      success: false,
      statusCode: 400,
      message: result.error ?? "Request failed",
      ...(result.errors && result.errors.length > 0 ? { errors: result.errors } : {}),
    });
  }

  // Handles QueryResult directly — maps success/failure to the correct HTTP response
  static fromQuery<T>(
    reply: FastifyReply,
    result: QueryResult<T>,
    successMessage: string,
    notFoundMessage?: string,
  ): FastifyReply {
    if (result.success) {
      if (result.data === null && notFoundMessage) {
        return ResponseHelper.notFound(reply, notFoundMessage);
      }
      return ResponseHelper.ok(reply, successMessage, result.data ?? undefined);
    }
    return reply.status(400).send({
      success: false,
      statusCode: 400,
      message: result.error ?? "Request failed",
    });
  }

  static created<T>(
    reply: FastifyReply,
    message: string,
    data?: T,
  ): FastifyReply {
    return this.success(reply, 201, message, data);
  }

  static ok<T>(
    reply: FastifyReply,
    message: string,
    data?: T,
  ): FastifyReply {
    return this.success(reply, 200, message, data);
  }

  static noContent(reply: FastifyReply): FastifyReply {
    return reply.status(204).send();
  }
}
