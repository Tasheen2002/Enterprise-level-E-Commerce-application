/** Internal exception conversion; explicit validation-failure factories retain their own contract. */
export function parseResultError(
  error: unknown,
  fallbackMessage: string,
): { message: string; statusCode: number } {
  try {
    const candidateMessage = error instanceof Error ? error.message : undefined;
    const message = typeof candidateMessage === "string" ? candidateMessage : fallbackMessage;
    const candidateStatus =
      error !== null && typeof error === "object"
        ? (error as { statusCode?: unknown }).statusCode
        : undefined;
    const statusCode =
      typeof candidateStatus === "number" &&
      Number.isInteger(candidateStatus) &&
      candidateStatus >= 400 &&
      candidateStatus <= 599
        ? candidateStatus
        : 500;
    return { message, statusCode };
  } catch {
    // Unknown exceptions may refuse property/prototype access. Do not replace them with a throw.
    return { message: fallbackMessage, statusCode: 500 };
  }
}
