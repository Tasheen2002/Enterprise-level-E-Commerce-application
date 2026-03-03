import { FastifyRequest, FastifyReply } from "fastify";
import {
  AddAddressCommand,
  AddAddressHandler,
  UpdateAddressCommand,
  UpdateAddressHandler,
  DeleteAddressCommand,
  DeleteAddressHandler,
  ListAddressesQuery,
  ListAddressesHandler,
} from "../../../application";
import { AddressManagementService } from "../../../application/services/address-management.service";

// Constants for better maintainability
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

const ERROR_MESSAGES = {
  AUTH_REQUIRED: "Authentication required",
  ADDRESS_NOT_FOUND: "Address not found",
  INVALID_ADDRESS_ID: "Invalid address ID format",
  INVALID_USER_ID: "Invalid user ID format",
  REQUIRED_FIELDS_MISSING: "Required fields are missing",
  INTERNAL_ERROR: "Internal server error",
  ACCESS_DENIED: "Access denied - you can only modify your own addresses",
} as const;

// Request DTOs
export interface AddAddressRequest {
  type: "billing" | "shipping";
  isDefault?: boolean;
  firstName?: string;
  lastName?: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phone?: string;
}

export interface UpdateAddressRequest {
  type?: "billing" | "shipping";
  isDefault?: boolean;
  firstName?: string;
  lastName?: string;
  company?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
}

export interface ListAddressesQueryParams {
  type?: "billing" | "shipping";
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

// Response DTOs
export interface AddressResponse {
  success: boolean;
  data?: {
    addressId: string;
    userId: string;
    type: string;
    isDefault: boolean;
    firstName?: string;
    lastName?: string;
    company?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
    phone?: string;
    createdAt: Date;
    updatedAt: Date;
  };
  error?: string;
  errors?: string[];
}

export interface AddressListResponse {
  success: boolean;
  data?: {
    userId: string;
    addresses: Array<{
      addressId: string;
      type: string;
      isDefault: boolean;
      firstName?: string;
      lastName?: string;
      company?: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state?: string;
      postalCode?: string;
      country: string;
      phone?: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
    totalCount: number;
  };
  error?: string;
  errors?: string[];
}

export interface AddressActionResponse {
  success: boolean;
  data?: {
    addressId: string;
    userId: string;
    action: "created" | "updated" | "deleted";
    message: string;
  };
  error?: string;
  errors?: string[];
}

// Utility functions for validation and sanitization
class AddressValidation {
  static sanitizeStringInput(input?: string): string | undefined {
    if (!input) return input;
    return input.trim().replace(/\s+/g, " ");
  }

  static validatePostalCode(postalCode?: string, country?: string): boolean {
    if (!postalCode || !country) return true; // Optional field

    const patterns: Record<string, RegExp> = {
      US: /^\d{5}(-\d{4})?$/,
      UK: /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i,
      CA: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i,
      DE: /^\d{5}$/,
      FR: /^\d{5}$/,
    };

    const pattern = patterns[country.toUpperCase()];
    return !pattern || pattern.test(postalCode);
  }

  static validatePhoneNumber(phone?: string): boolean {
    if (!phone) return true; // Optional field
    // Basic international phone number validation
    const phonePattern = /^[\+]?[1-9][\d]{0,15}$/;
    return phonePattern.test(phone.replace(/[\s\-\(\)]/g, ""));
  }

  static validateRequiredFields(data: AddAddressRequest): string[] {
    const errors: string[] = [];

    if (!data.type) errors.push("type");
    if (!data.addressLine1?.trim()) errors.push("addressLine1");
    if (!data.city?.trim()) errors.push("city");
    if (!data.country?.trim()) errors.push("country");

    return errors;
  }

  static sanitizeAddressData(
    data: AddAddressRequest | UpdateAddressRequest,
  ): any {
    return {
      ...data,
      firstName: this.sanitizeStringInput(data.firstName),
      lastName: this.sanitizeStringInput(data.lastName),
      company: this.sanitizeStringInput(data.company),
      addressLine1: this.sanitizeStringInput(data.addressLine1),
      addressLine2: this.sanitizeStringInput(data.addressLine2),
      city: this.sanitizeStringInput(data.city),
      state: this.sanitizeStringInput(data.state),
      postalCode: this.sanitizeStringInput(data.postalCode),
      country: this.sanitizeStringInput(data.country),
      phone: this.sanitizeStringInput(data.phone),
    };
  }
}

export class AddressesController {
  private addAddressHandler: AddAddressHandler;
  private updateAddressHandler: UpdateAddressHandler;
  private deleteAddressHandler: DeleteAddressHandler;
  private listAddressesHandler: ListAddressesHandler;

  constructor(addressService: AddressManagementService) {
    this.addAddressHandler = new AddAddressHandler(addressService);
    this.updateAddressHandler = new UpdateAddressHandler(addressService);
    this.deleteAddressHandler = new DeleteAddressHandler(addressService);
    this.listAddressesHandler = new ListAddressesHandler(addressService);
  }

  private logError(method: string, error: any, context?: any): void {
    console.error(`AddressesController.${method} error:`, {
      error: error.message || error,
      stack: error.stack,
      context,
    });
  }

  private validateUuidFormat(id: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  async addAddress(
    request: FastifyRequest<{
      Params: { userId: string };
      Body: AddAddressRequest;
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { userId } = request.params;
      const rawData = request.body;

      // Validate UUID format
      if (!this.validateUuidFormat(userId)) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: ERROR_MESSAGES.INVALID_USER_ID,
          errors: ["userId"],
        });
        return;
      }

      // Sanitize input data
      const sanitizedData = AddressValidation.sanitizeAddressData(rawData);

      // Validate required fields
      const missingFields =
        AddressValidation.validateRequiredFields(sanitizedData);
      if (missingFields.length > 0) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: `${ERROR_MESSAGES.REQUIRED_FIELDS_MISSING}: ${missingFields.join(", ")}`,
          errors: missingFields,
        });
        return;
      }

      // Validate postal code format
      if (
        !AddressValidation.validatePostalCode(
          sanitizedData.postalCode,
          sanitizedData.country,
        )
      ) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: "Invalid postal code format for the specified country",
          errors: ["postalCode"],
        });
        return;
      }

      // Validate phone number format
      if (!AddressValidation.validatePhoneNumber(sanitizedData.phone)) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: "Invalid phone number format",
          errors: ["phone"],
        });
        return;
      }

      // Create command
      const command: AddAddressCommand = {
        userId,
        ...sanitizedData,
        timestamp: new Date(),
      };

      // Execute command
      const result = await this.addAddressHandler.handle(command);

      if (result.success) {
        reply.status(HTTP_STATUS.CREATED).send({
          success: true,
          data: {
            ...result.data,
            action: "created" as const,
            message: "Address added successfully",
          },
        });
      } else {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      this.logError("addAddress", error, { userId: request.params?.userId });
      reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: `${ERROR_MESSAGES.INTERNAL_ERROR} while adding address`,
      });
    }
  }

  async listAddresses(
    request: FastifyRequest<{
      Params: { userId: string };
      Querystring: ListAddressesQueryParams;
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { userId } = request.params;
      const {
        type,
        page: queryPage = 1,
        limit: queryLimit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = request.query;

      // Ensure valid pagination values
      const page = Math.max(1, Number(queryPage) || 1);
      const limit = Math.max(1, Math.min(100, Number(queryLimit) || 20));

      // Validate UUID format
      if (!this.validateUuidFormat(userId)) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: ERROR_MESSAGES.INVALID_USER_ID,
          errors: ["userId"],
        });
        return;
      }

      // Create query with pagination parameters
      const query: ListAddressesQuery = {
        userId,
        type,
        page,
        limit,
        sortBy,
        sortOrder,
        timestamp: new Date(),
      };

      // Execute query
      const result = await this.listAddressesHandler.handle(query);

      if (result.success) {
        const addressData = result.data as any;
        const addresses = addressData?.addresses || [];
        const total = addressData?.totalCount || addresses.length;
        const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

        reply.status(HTTP_STATUS.OK).send({
          success: true,
          data: {
            userId: addressData?.userId,
            addresses,
            totalCount: total,
          },
          meta: {
            total,
            page,
            limit,
            totalPages,
          },
        });
      } else {
        const statusCode = result.error?.includes("not found")
          ? HTTP_STATUS.NOT_FOUND
          : HTTP_STATUS.BAD_REQUEST;
        reply.status(statusCode).send({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      this.logError("listAddresses", error, { userId: request.params?.userId });
      reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: `${ERROR_MESSAGES.INTERNAL_ERROR} while retrieving addresses`,
      });
    }
  }

  async addCurrentUserAddress(
    request: FastifyRequest<{ Body: AddAddressRequest }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const userId = (request as any).user?.userId;
      const rawData = request.body;

      // Auth check is now handled by middleware, but keeping for safety
      if (!userId) {
        reply.status(HTTP_STATUS.UNAUTHORIZED).send({
          success: false,
          error: ERROR_MESSAGES.AUTH_REQUIRED,
        });
        return;
      }

      // Sanitize input data
      const sanitizedData = AddressValidation.sanitizeAddressData(rawData);

      // Validate required fields
      const missingFields =
        AddressValidation.validateRequiredFields(sanitizedData);
      if (missingFields.length > 0) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: `${ERROR_MESSAGES.REQUIRED_FIELDS_MISSING}: ${missingFields.join(", ")}`,
          errors: missingFields,
        });
        return;
      }

      // Validate postal code format
      if (
        !AddressValidation.validatePostalCode(
          sanitizedData.postalCode,
          sanitizedData.country,
        )
      ) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: "Invalid postal code format for the specified country",
          errors: ["postalCode"],
        });
        return;
      }

      // Validate phone number format
      if (!AddressValidation.validatePhoneNumber(sanitizedData.phone)) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: "Invalid phone number format",
          errors: ["phone"],
        });
        return;
      }

      // Create command
      const command: AddAddressCommand = {
        userId,
        ...sanitizedData,
        timestamp: new Date(),
      };

      // Execute command
      const result = await this.addAddressHandler.handle(command);

      if (result.success) {
        reply.status(HTTP_STATUS.CREATED).send({
          success: true,
          data: {
            ...result.data,
            action: "created" as const,
            message: "Address added successfully",
          },
        });
      } else {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      this.logError("addCurrentUserAddress", error, {
        userId: (request as any).user?.userId,
      });
      reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: `${ERROR_MESSAGES.INTERNAL_ERROR} while adding address for current user`,
      });
    }
  }

  async getCurrentUserAddresses(
    request: FastifyRequest<{
      Querystring: ListAddressesQueryParams;
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const userId = (request as any).user?.userId;
      const {
        type,
        page: queryPage = 1,
        limit: queryLimit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = request.query;

      // Ensure valid pagination values
      const page = Math.max(1, Number(queryPage) || 1);
      const limit = Math.max(1, Math.min(100, Number(queryLimit) || 20));

      // Auth check is now handled by middleware, but keeping for safety
      if (!userId) {
        reply.status(HTTP_STATUS.UNAUTHORIZED).send({
          success: false,
          error: ERROR_MESSAGES.AUTH_REQUIRED,
        });
        return;
      }

      // Create query with pagination parameters
      const query: ListAddressesQuery = {
        userId,
        type,
        page,
        limit,
        sortBy,
        sortOrder,
        timestamp: new Date(),
      };

      // Execute query
      const result = await this.listAddressesHandler.handle(query);

      if (result.success) {
        // The result.data should be a ListAddressesResult with an addresses array
        const addressData = result.data as any;
        const addresses = addressData?.addresses || [];
        const total = addressData?.totalCount || addresses.length;
        const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

        reply.status(HTTP_STATUS.OK).send({
          success: true,
          data: addresses,
          meta: {
            total,
            page,
            limit,
            totalPages,
          },
        });
      } else {
        const statusCode = result.error?.includes("not found")
          ? HTTP_STATUS.NOT_FOUND
          : HTTP_STATUS.BAD_REQUEST;
        reply.status(statusCode).send({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      this.logError("getCurrentUserAddresses", error, {
        userId: (request as any).user?.userId,
      });
      reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: `${ERROR_MESSAGES.INTERNAL_ERROR} while retrieving current user addresses`,
      });
    }
  }

  // NEW: Update current user address
  async updateCurrentUserAddress(
    request: FastifyRequest<{
      Params: { addressId: string };
      Body: UpdateAddressRequest;
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const userId = (request as any).user?.userId;
      const { addressId } = request.params;
      const rawData = request.body;

      if (!userId) {
        reply.status(HTTP_STATUS.UNAUTHORIZED).send({
          success: false,
          error: ERROR_MESSAGES.AUTH_REQUIRED,
        });
        return;
      }

      // Validate UUID format
      if (!this.validateUuidFormat(addressId)) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: ERROR_MESSAGES.INVALID_ADDRESS_ID,
          errors: ["addressId"],
        });
        return;
      }

      // Sanitize input data
      const sanitizedData = AddressValidation.sanitizeAddressData(rawData);

      // Validate postal code format if provided
      if (
        sanitizedData.postalCode &&
        sanitizedData.country &&
        !AddressValidation.validatePostalCode(
          sanitizedData.postalCode,
          sanitizedData.country,
        )
      ) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: "Invalid postal code format for the specified country",
          errors: ["postalCode"],
        });
        return;
      }

      // Validate phone number format if provided
      if (
        sanitizedData.phone &&
        !AddressValidation.validatePhoneNumber(sanitizedData.phone)
      ) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: "Invalid phone number format",
          errors: ["phone"],
        });
        return;
      }

      // Create command
      const command: UpdateAddressCommand = {
        addressId,
        userId,
        ...sanitizedData,
        timestamp: new Date(),
      };

      // Execute command
      const result = await this.updateAddressHandler.handle(command);

      if (result.success) {
        reply.status(HTTP_STATUS.OK).send({
          success: true,
          data: {
            ...result.data,
            action: "updated" as const,
          },
        });
      } else {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      this.logError("updateCurrentUserAddress", error, {
        userId: (request as any).user?.userId,
        addressId: request.params?.addressId,
      });
      reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: `${ERROR_MESSAGES.INTERNAL_ERROR} while updating current user address`,
      });
    }
  }

  // NEW: Delete current user address
  async deleteCurrentUserAddress(
    request: FastifyRequest<{
      Params: { addressId: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const userId = (request as any).user?.userId;
      const { addressId } = request.params;

      if (!userId) {
        reply.status(HTTP_STATUS.UNAUTHORIZED).send({
          success: false,
          error: ERROR_MESSAGES.AUTH_REQUIRED,
        });
        return;
      }

      // Validate UUID format
      if (!this.validateUuidFormat(addressId)) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: ERROR_MESSAGES.INVALID_ADDRESS_ID,
          errors: ["addressId"],
        });
        return;
      }

      // Create command
      const command: DeleteAddressCommand = {
        addressId,
        userId,
        timestamp: new Date(),
      };

      // Execute command
      const result = await this.deleteAddressHandler.handle(command);

      if (result.success) {
        reply.status(HTTP_STATUS.OK).send({
          success: true,
          data: {
            ...result.data,
            action: "deleted" as const,
          },
        });
      } else {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      this.logError("deleteCurrentUserAddress", error, {
        userId: (request as any).user?.userId,
        addressId: request.params?.addressId,
      });
      reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: `${ERROR_MESSAGES.INTERNAL_ERROR} while deleting current user address`,
      });
    }
  }

  // NEW: Admin update address
  async updateAddress(
    request: FastifyRequest<{
      Params: { userId: string; addressId: string };
      Body: UpdateAddressRequest;
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { userId, addressId } = request.params;
      const rawData = request.body;

      // Validate UUID formats
      if (!this.validateUuidFormat(userId)) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: ERROR_MESSAGES.INVALID_USER_ID,
          errors: ["userId"],
        });
        return;
      }

      if (!this.validateUuidFormat(addressId)) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: ERROR_MESSAGES.INVALID_ADDRESS_ID,
          errors: ["addressId"],
        });
        return;
      }

      // Sanitize input data
      const sanitizedData = AddressValidation.sanitizeAddressData(rawData);

      // Validate postal code format if provided
      if (
        sanitizedData.postalCode &&
        sanitizedData.country &&
        !AddressValidation.validatePostalCode(
          sanitizedData.postalCode,
          sanitizedData.country,
        )
      ) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: "Invalid postal code format for the specified country",
          errors: ["postalCode"],
        });
        return;
      }

      // Validate phone number format if provided
      if (
        sanitizedData.phone &&
        !AddressValidation.validatePhoneNumber(sanitizedData.phone)
      ) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: "Invalid phone number format",
          errors: ["phone"],
        });
        return;
      }

      // Create command
      const command: UpdateAddressCommand = {
        addressId,
        userId,
        ...sanitizedData,
        timestamp: new Date(),
      };

      // Execute command
      const result = await this.updateAddressHandler.handle(command);

      if (result.success) {
        reply.status(HTTP_STATUS.OK).send({
          success: true,
          data: {
            ...result.data,
            action: "updated" as const,
          },
        });
      } else {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      this.logError("updateAddress", error, {
        userId: request.params?.userId,
        addressId: request.params?.addressId,
      });
      reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: `${ERROR_MESSAGES.INTERNAL_ERROR} while updating address`,
      });
    }
  }

  async setDefaultAddress(
    request: FastifyRequest<{
      Params: { addressId: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const userId = (request as any).user?.userId;
      const { addressId } = request.params;

      if (!userId) {
        reply.status(HTTP_STATUS.UNAUTHORIZED).send({
          success: false,
          error: ERROR_MESSAGES.AUTH_REQUIRED,
        });
        return;
      }

      if (!this.validateUuidFormat(addressId)) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: ERROR_MESSAGES.INVALID_ADDRESS_ID,
          errors: ["addressId"],
        });
        return;
      }

      const command: UpdateAddressCommand = {
        addressId,
        userId,
        isDefault: true,
        timestamp: new Date(),
      };

      const result = await this.updateAddressHandler.handle(command);

      if (result.success) {
        reply.status(HTTP_STATUS.OK).send({
          success: true,
          message: "Default address updated successfully",
        });
      } else {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      this.logError("setDefaultAddress", error, {
        userId: (request as any).user?.userId,
        addressId: request.params?.addressId,
      });
      reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: `${ERROR_MESSAGES.INTERNAL_ERROR} while setting default address`,
      });
    }
  }

  // NEW: Admin delete address
  async deleteAddress(
    request: FastifyRequest<{
      Params: { userId: string; addressId: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { userId, addressId } = request.params;

      // Validate UUID formats
      if (!this.validateUuidFormat(userId)) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: ERROR_MESSAGES.INVALID_USER_ID,
          errors: ["userId"],
        });
        return;
      }

      if (!this.validateUuidFormat(addressId)) {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: ERROR_MESSAGES.INVALID_ADDRESS_ID,
          errors: ["addressId"],
        });
        return;
      }

      // Create command
      const command: DeleteAddressCommand = {
        addressId,
        userId,
        timestamp: new Date(),
      };

      // Execute command
      const result = await this.deleteAddressHandler.handle(command);

      if (result.success) {
        reply.status(HTTP_STATUS.OK).send({
          success: true,
          data: {
            ...result.data,
            action: "deleted" as const,
          },
        });
      } else {
        reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: result.error,
          errors: result.errors,
        });
      }
    } catch (error) {
      this.logError("deleteAddress", error, {
        userId: request.params?.userId,
        addressId: request.params?.addressId,
      });
      reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: `${ERROR_MESSAGES.INTERNAL_ERROR} while deleting address`,
      });
    }
  }
}
