import { AddressManagementService } from '../services/address-management.service';
import { AddressDTO } from '../../domain/entities/address.entity';
import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';

export interface ListAddressesInput extends IQuery {
  userId: string;
}

export class ListAddressesHandler implements IQueryHandler<ListAddressesInput, AddressDTO[]> {
  constructor(private readonly addressService: AddressManagementService) {}

  async handle(input: ListAddressesInput): Promise<AddressDTO[]> {
    return this.addressService.getUserAddresses(input.userId);
  }
}
