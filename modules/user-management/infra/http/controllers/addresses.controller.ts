import { FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '@/api/src/shared/interfaces/authenticated-request.interface';
import { ResponseHelper } from '@/api/src/shared/response.helper';
import {
  AddAddressHandler,
  UpdateAddressHandler,
  DeleteAddressHandler,
  ListAddressesHandler,
} from '../../../application';
import {
  AddAddressBody,
  UpdateAddressBody,
  AddressIdParams,
} from '../validation/address.schema';

export class AddressesController {
  constructor(
    private readonly addAddressHandler: AddAddressHandler,
    private readonly updateAddressHandler: UpdateAddressHandler,
    private readonly deleteAddressHandler: DeleteAddressHandler,
    private readonly listAddressesHandler: ListAddressesHandler,
  ) {}

  async addCurrentUserAddress(
    request: AuthenticatedRequest<{ Body: AddAddressBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.addAddressHandler.handle({
        userId: request.user.userId,
        ...request.body,
      });
      return ResponseHelper.fromCommand(reply, result, 'Address added successfully', 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getCurrentUserAddresses(
    request: AuthenticatedRequest,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.listAddressesHandler.handle({ userId: request.user.userId });
      return ResponseHelper.ok(reply, 'Addresses retrieved successfully', result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateCurrentUserAddress(
    request: AuthenticatedRequest<{ Params: AddressIdParams; Body: UpdateAddressBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.updateAddressHandler.handle({
        addressId: request.params.addressId,
        userId: request.user.userId,
        ...request.body,
      });
      return ResponseHelper.fromCommand(reply, result, 'Address updated successfully');
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteCurrentUserAddress(
    request: AuthenticatedRequest<{ Params: AddressIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.deleteAddressHandler.handle({
        addressId: request.params.addressId,
        userId: request.user.userId,
      });
      return ResponseHelper.fromCommand(reply, result, 'Address deleted successfully', undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async setDefaultAddress(
    request: AuthenticatedRequest<{ Params: AddressIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.updateAddressHandler.handle({
        addressId: request.params.addressId,
        userId: request.user.userId,
        isDefault: true,
      });
      return ResponseHelper.fromCommand(reply, result, 'Default address updated successfully');
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
