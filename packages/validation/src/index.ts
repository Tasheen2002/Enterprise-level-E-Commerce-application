/**
 * Tasheen shared Zod schemas.
 *
 * Each subdirectory mirrors a backend bounded context. The intent is for the
 * BACKEND'S Zod schemas (currently in `modules/<x>/infra/http/validation/`)
 * to be migrated/re-exported here so the frontend can reuse the exact same
 * validators in form components — eliminating wire-shape drift between
 * client and server. Until that migration lands, this package starts empty
 * with the directory shape ready.
 */

export * from "./common";
