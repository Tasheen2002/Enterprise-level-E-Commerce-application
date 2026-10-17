import { FastifyReply } from "fastify";
import { CommandResult } from "../../../../packages/core/src/application/command-result";
import { QueryResult } from "../../../../packages/core/src/application/query-result";
import { serializeError, errorStatus, type ErrorEnvelope } from "./http/error-response";

export interface SuccessResponse<T = any> {
  success: true;
  statusCode: number;
  message: string;
  data?: T;
}

export type ErrorResponse = ErrorEnvelope;

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
    const response = serializeError(error);
    if (response.statusCode >= 500) reply.log.error({ err: error }, "Request failed");
    return reply.status(response.statusCode).send(response);
  }

  static unauthorized(
    reply: FastifyReply,
    message: string = "User not authenticated",
  ): FastifyReply {
    return reply.status(401).send({ success: false, statusCode: 401, message });
  }

  static forbidden(reply: FastifyReply, message: string = "Access forbidden"): FastifyReply {
    return reply.status(403).send({ success: false, statusCode: 403, message });
  }

  static notFound(reply: FastifyReply, message: string = "Resource not found"): FastifyReply {
    return reply.status(404).send({ success: false, statusCode: 404, message });
  }

  static badRequest(reply: FastifyReply, message: string, errors?: string[]): FastifyReply {
    return reply.status(400).send({
      success: false,
      statusCode: 400,
      message,
      ...(errors && errors.length > 0 ? { details: { _root: errors } } : {}),
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
    const failureStatus = result.statusCode === undefined ? 400 : errorStatus(result.statusCode);
    if (failureStatus >= 500) reply.log.error({ message: result.error }, "Command failed");
    return reply.status(failureStatus).send({
      success: false,
      statusCode: failureStatus,
      message:
        failureStatus >= 500 ? "An unexpected error occurred" : (result.error ?? "Request failed"),
      ...(failureStatus < 500 && result.errors && result.errors.length > 0
        ? { details: { _root: result.errors } }
        : {}),
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
    const failureStatus = result.statusCode === undefined ? 400 : errorStatus(result.statusCode);
    if (failureStatus >= 500) reply.log.error({ message: result.error }, "Query failed");
    return reply.status(failureStatus).send({
      success: false,
      statusCode: failureStatus,
      message:
        failureStatus >= 500 ? "An unexpected error occurred" : (result.error ?? "Request failed"),
      ...(failureStatus < 500 && result.errors?.length
        ? { details: { _root: result.errors } }
        : {}),
    });
  }

  static created<T>(reply: FastifyReply, message: string, data?: T): FastifyReply {
    return this.success(reply, 201, message, data);
  }

  static ok<T>(reply: FastifyReply, message: string, data?: T): FastifyReply {
    return this.success(reply, 200, message, data);
  }

  static noContent(reply: FastifyReply): FastifyReply {
    return reply.status(204).send();
  }
}
