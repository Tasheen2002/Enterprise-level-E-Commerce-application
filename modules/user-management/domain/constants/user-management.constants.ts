export const USER_MANAGEMENT_CONSTANTS = {
  // Password rules
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  PASSWORD_BCRYPT_ROUNDS: 12,

  // Token expiry durations (in milliseconds)
  EMAIL_VERIFICATION_EXPIRY_MS: 24 * 60 * 60 * 1000,    // 24 hours
  PHONE_VERIFICATION_EXPIRY_MS: 10 * 60 * 1000,          // 10 minutes
  PASSWORD_RESET_EXPIRY_MS: 60 * 60 * 1000,              // 1 hour

  // Rate limiting
  MAX_VERIFICATION_ATTEMPTS: 5,
  VERIFICATION_LOCKOUT_DURATION_MS: 15 * 60 * 1000,     // 15 minutes
  MAX_LOGIN_ATTEMPTS: 10,
  LOGIN_LOCKOUT_DURATION_MS: 15 * 60 * 1000,            // 15 minutes

  // Two-factor authentication
  TOTP_WINDOW: 1,
  TOTP_STEP: 30,
  BACKUP_CODES_COUNT: 10,

  // Guest user
  GUEST_EMAIL_DOMAIN: "temp.guest.internal",

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;
