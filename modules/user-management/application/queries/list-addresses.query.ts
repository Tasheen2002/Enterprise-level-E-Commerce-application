import { AddressManagementService } from '../services/address-management.service';
import { AddressDTO } from '../../domain/entities/address.entity';
import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';

export interface ListAddressesQuery extends IQuery {
  userId: string;
}

export class ListAddressesHandler implements IQueryHandler<ListAddressesQuery, AddressDTO[]> {
  constructor(private readonly addressService: AddressManagementService) {}

  async handle(query: ListAddressesQuery): Promise<AddressDTO[]> {
    return this.addressService.getUserAddresses(query.userId);
  }
}
