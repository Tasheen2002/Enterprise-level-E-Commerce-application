import { AddressManagementService } from '../services/address-management.service';
import { AddressDTO } from '../../domain/entities/address.entity';
import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from '../../../../packages/core/src/application/cqrs';

export interface ListAddressesQuery extends IQuery {
  readonly userId: string;
}

export class ListAddressesHandler implements IQueryHandler<ListAddressesQuery, QueryResult<AddressDTO[]>> {
  constructor(private readonly addressService: AddressManagementService) {}

  async handle(query: ListAddressesQuery): Promise<QueryResult<AddressDTO[]>> {
    try {
      const data = await this.addressService.getUserAddresses(query.userId);
      return QueryResult.success(data);
    } catch (error) {
      return QueryResult.fromError(error);
    }
  }
}
