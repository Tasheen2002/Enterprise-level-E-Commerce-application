import { parseResultError } from "./result-error";

export class CommandResult<T> {
  constructor(
    public readonly success: boolean,
    public readonly data?: T,
    public readonly error?: string,
    public readonly errors?: string[],
    public readonly statusCode?: number,
  ) {}

  static success<T>(data?: T): CommandResult<T> {
    return new CommandResult(true, data);
  }

  static failure<T>(error: string, fieldErrors?: string[], statusCode?: number): CommandResult<T> {
    return new CommandResult<T>(false, undefined, error, fieldErrors, statusCode);
  }

  static fromError<T>(error: unknown): CommandResult<T> {
    const { message, statusCode } = parseResultError(error, "Command failed");
    return CommandResult.failure<T>(message, undefined, statusCode);
  }
}
