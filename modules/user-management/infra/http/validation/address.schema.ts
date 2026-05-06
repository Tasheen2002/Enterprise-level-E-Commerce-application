import { z } from "zod";
import { AddressType } from "../../../domain/value-objects/address-type.vo";

// ============================================================================
// Request body schemas
// ============================================================================
// Field requirements mirror the Address VO/entity validation:
//   Required: type, addressLine1, city, country
//   Optional: firstName, lastName, company, addressLine2, state, postalCode, phone

export const addAddressSchema = z.object({
  type: z.enum(AddressType.VALUES),
  isDefault: z.boolean().optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  addressLine1: z.string().min(1).max(255),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().length(2),
  phone: z.string().max(20).optional(),
});

export const updateAddressSchema = z.object({
  type: z.enum(AddressType.VALUES).optional(),
  isDefault: z.boolean().optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  addressLine1: z.string().min(1).max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().length(2).optional(),
  phone: z.string().max(20).optional(),
});

// ============================================================================
// Path param schemas
// ============================================================================

export const addressIdParamsSchema = z.object({
  addressId: z.uuid(),
});

// ============================================================================
// Query schemas
// ============================================================================

const MAX_PAGE_SIZE = 100;

export const listAddressesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).optional(),
});

// ============================================================================
// Inferred types
// ============================================================================

export type AddAddressBody = z.infer<typeof addAddressSchema>;
export type UpdateAddressBody = z.infer<typeof updateAddressSchema>;
export type AddressIdParams = z.infer<typeof addressIdParamsSchema>;
export type ListAddressesQueryParams = z.infer<typeof listAddressesQuerySchema>;

// ============================================================================
// JSON Schema response objects (for Swagger / Fastify schema docs)
// ============================================================================

export const addressResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    type: { type: 'string', enum: [...AddressType.VALUES] },
    isDefault: { type: 'boolean' },
    firstName: { type: 'string', nullable: true },
    lastName: { type: 'string', nullable: true },
    company: { type: 'string', nullable: true },
    addressLine1: { type: 'string' },
    addressLine2: { type: 'string', nullable: true },
    city: { type: 'string' },
    state: { type: 'string', nullable: true },
    postalCode: { type: 'string', nullable: true },
    country: { type: 'string' },
    phone: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

// Matches PaginatedResult<AddressDTO> shape returned by AddressManagementService.getUserAddresses
export const addressListResponseSchema = {
  type: 'object',
  properties: {
    items: { type: 'array', items: addressResponseSchema },
    total: { type: 'number' },
    limit: { type: 'number' },
    offset: { type: 'number' },
    hasMore: { type: 'boolean' },
  },
};
