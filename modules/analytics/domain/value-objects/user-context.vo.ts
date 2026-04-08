export class UserContext {
  private readonly userId?: string;
  private readonly guestToken?: string;

  private constructor(userId?: string, guestToken?: string) {
    this.userId = userId;
    this.guestToken = guestToken;
  }

  static forUser(userId: string): UserContext {
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }
    return new UserContext(userId, undefined);
  }

  static forGuest(guestToken: string): UserContext {
    if (!guestToken || guestToken.trim().length === 0) {
      throw new Error('Guest token cannot be empty');
    }
    return new UserContext(undefined, guestToken);
  }

  getUserId(): string | undefined {
    return this.userId;
  }

  getGuestToken(): string | undefined {
    return this.guestToken;
  }

  isAuthenticated(): boolean {
    return !!this.userId;
  }

  isGuest(): boolean {
    return !!this.guestToken;
  }

  equals(other: UserContext): boolean {
    return this.userId === other.userId && this.guestToken === other.guestToken;
  }

  toString(): string {
    return this.userId ? `User:${this.userId}` : `Guest:${this.guestToken}`;
  }
}
