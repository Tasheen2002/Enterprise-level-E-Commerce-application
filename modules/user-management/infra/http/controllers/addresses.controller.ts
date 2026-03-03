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
import { ResponseHelper } from "@/api/src/shared/response.helper";

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

  async addAddress(
    request: FastifyRequest<{
      Params: { userId: string };
      Body: AddAddressRequest;
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { userId } = request.params;
      const command: AddAddressCommand = {
        userId,
        ...request.body,
        timestamp: new Date(),
      };
      const result = await this.addAddressHandler.handle(command);
      ResponseHelper.fromCommand(reply, result, "Address added", 201);
    } catch (error) {
      ResponseHelper.error(reply, error);
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

      const page = Math.max(1, Number(queryPage) || 1);
      const limit = Math.max(1, Math.min(100, Number(queryLimit) || 20));

      const query: ListAddressesQuery = {
        userId,
        type,
        page,
        limit,
        sortBy,
        sortOrder,
        timestamp: new Date(),
      };

      const result = await this.listAddressesHandler.handle(query);
      ResponseHelper.fromQuery(reply, result, "Addresses retrieved");
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async addCurrentUserAddress(
    request: FastifyRequest<{ Body: AddAddressRequest }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const userId = (request as any).user?.userId;
      if (!userId) {
        return ResponseHelper.unauthorized(reply);
      }

      const command: AddAddressCommand = {
        userId,
        ...request.body,
        timestamp: new Date(),
      };
      const result = await this.addAddressHandler.handle(command);
      ResponseHelper.fromCommand(reply, result, "Address added", 201);
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async getCurrentUserAddresses(
    request: FastifyRequest<{ Querystring: ListAddressesQueryParams }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const userId = (request as any).user?.userId;
      if (!userId) {
        return ResponseHelper.unauthorized(reply);
      }

      const {
        type,
        page: queryPage = 1,
        limit: queryLimit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = request.query;

      const page = Math.max(1, Number(queryPage) || 1);
      const limit = Math.max(1, Math.min(100, Number(queryLimit) || 20));

      const query: ListAddressesQuery = {
        userId,
        type,
        page,
        limit,
        sortBy,
        sortOrder,
        timestamp: new Date(),
      };

      const result = await this.listAddressesHandler.handle(query);
      ResponseHelper.fromQuery(reply, result, "Addresses retrieved");
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async updateCurrentUserAddress(
    request: FastifyRequest<{
      Params: { addressId: string };
      Body: UpdateAddressRequest;
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const userId = (request as any).user?.userId;
      if (!userId) {
        return ResponseHelper.unauthorized(reply);
      }

      const { addressId } = request.params;
      const command: UpdateAddressCommand = {
        addressId,
        userId,
        ...request.body,
        timestamp: new Date(),
      };
      const result = await this.updateAddressHandler.handle(command);
      ResponseHelper.fromCommand(reply, result, "Address updated");
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async deleteCurrentUserAddress(
    request: FastifyRequest<{ Params: { addressId: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const userId = (request as any).user?.userId;
      if (!userId) {
        return ResponseHelper.unauthorized(reply);
      }

      const { addressId } = request.params;
      const command: DeleteAddressCommand = {
        addressId,
        userId,
        timestamp: new Date(),
      };
      const result = await this.deleteAddressHandler.handle(command);
      ResponseHelper.fromCommand(reply, result, "Address deleted");
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async updateAddress(
    request: FastifyRequest<{
      Params: { userId: string; addressId: string };
      Body: UpdateAddressRequest;
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { userId, addressId } = request.params;
      const command: UpdateAddressCommand = {
        addressId,
        userId,
        ...request.body,
        timestamp: new Date(),
      };
      const result = await this.updateAddressHandler.handle(command);
      ResponseHelper.fromCommand(reply, result, "Address updated");
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async setDefaultAddress(
    request: FastifyRequest<{ Params: { addressId: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const userId = (request as any).user?.userId;
      if (!userId) {
        return ResponseHelper.unauthorized(reply);
      }

      const { addressId } = request.params;
      const command: UpdateAddressCommand = {
        addressId,
        userId,
        isDefault: true,
        timestamp: new Date(),
      };
      const result = await this.updateAddressHandler.handle(command);
      ResponseHelper.fromCommand(reply, result, "Default address updated");
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }

  async deleteAddress(
    request: FastifyRequest<{
      Params: { userId: string; addressId: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { userId, addressId } = request.params;
      const command: DeleteAddressCommand = {
        addressId,
        userId,
        timestamp: new Date(),
      };
      const result = await this.deleteAddressHandler.handle(command);
      ResponseHelper.fromCommand(reply, result, "Address deleted");
    } catch (error) {
      ResponseHelper.error(reply, error);
    }
  }
}
