import { AddressManagementService } from '../services/address-management.service';
import { AddressDTO } from '../../domain/entities/address.entity';
import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';
import { QueryResult } from '../../../../packages/core/src/application/query-result';

export interface ListAddressesInput extends IQuery {
  userId: string;
}

export class ListAddressesHandler implements IQueryHandler<
  ListAddressesInput,
  QueryResult<AddressDTO[]>
> {
  constructor(private readonly addressService: AddressManagementService) {}

  async handle(
    input: ListAddressesInput
  ): Promise<QueryResult<AddressDTO[]>> {
    const addresses = await this.addressService.getUserAddresses(input.userId);
    return QueryResult.success(addresses);
  }
}
