import { parseResultError } from "./result-error";

export class QueryResult<T> {
  constructor(
    public readonly success: boolean,
    public readonly data: T | null,
    public readonly error?: string,
    public readonly statusCode?: number,
    public readonly errors?: string[],
  ) {}

  static success<T = void>(data?: T): QueryResult<T> {
    return new QueryResult<T>(true, data ?? null);
  }

  static failure<T>(
    error: string,
    statusOrErrors?: number | string[],
    statusCode?: number,
  ): QueryResult<T> {
    return new QueryResult<T>(
      false,
      null,
      error,
      typeof statusOrErrors === "number" ? statusOrErrors : statusCode,
      Array.isArray(statusOrErrors) ? statusOrErrors : undefined,
    );
  }

  static fromError<T>(error: unknown): QueryResult<T> {
    const { message, statusCode } = parseResultError(error, "Query failed");
    return QueryResult.failure<T>(message, statusCode);
  }

  get isSuccess(): boolean {
    return this.success;
  }

  get isFailure(): boolean {
    return !this.success;
  }
}
