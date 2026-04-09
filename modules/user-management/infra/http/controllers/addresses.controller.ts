import { FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '@/api/src/shared/interfaces/authenticated-request.interface';
import { ResponseHelper } from '@/api/src/shared/response.helper';
import { AddAddressHandler } from '../../../application/commands/add-address.command';
import { UpdateAddressHandler } from '../../../application/commands/update-address.command';
import { DeleteAddressHandler } from '../../../application/commands/delete-address.command';
import { ListAddressesHandler } from '../../../application/queries/list-addresses.query';

export class AddressesController {
  constructor(
    private readonly addAddressHandler: AddAddressHandler,
    private readonly updateAddressHandler: UpdateAddressHandler,
    private readonly deleteAddressHandler: DeleteAddressHandler,
    private readonly listAddressesHandler: ListAddressesHandler
  ) {}

  async addCurrentUserAddress(
    request: AuthenticatedRequest<{
      Body: {
        type: 'billing' | 'shipping';
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
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user.userId;

      const result = await this.addAddressHandler.handle({
        userId,
        ...request.body,
      });

      return ResponseHelper.fromCommand(
        reply,
        result,
        'Address added successfully',
        201
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getCurrentUserAddresses(
    request: AuthenticatedRequest,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user.userId;

      const result = await this.listAddressesHandler.handle({ userId });

      return ResponseHelper.fromQuery(
        reply,
        result,
        'Addresses retrieved successfully'
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateCurrentUserAddress(
    request: AuthenticatedRequest<{
      Params: { addressId: string };
      Body: {
        type?: 'billing' | 'shipping';
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
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user.userId;
      const { addressId } = request.params;

      const result = await this.updateAddressHandler.handle({
        addressId,
        userId,
        ...request.body,
      });

      return ResponseHelper.fromCommand(
        reply,
        result,
        'Address updated successfully'
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteCurrentUserAddress(
    request: AuthenticatedRequest<{
      Params: { addressId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user.userId;
      const { addressId } = request.params;

      const result = await this.deleteAddressHandler.handle({
        addressId,
        userId,
      });

      return ResponseHelper.fromCommand(
        reply,
        result,
        'Address deleted successfully'
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async setDefaultAddress(
    request: AuthenticatedRequest<{
      Params: { addressId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user.userId;
      const { addressId } = request.params;

      const result = await this.updateAddressHandler.handle({
        addressId,
        userId,
        isDefault: true,
      });

      return ResponseHelper.fromCommand(
        reply,
        result,
        'Default address updated successfully'
      );
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
