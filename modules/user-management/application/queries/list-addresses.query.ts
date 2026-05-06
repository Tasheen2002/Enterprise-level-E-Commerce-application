import { IQuery, IQueryHandler } from '../../../../packages/core/src/application/cqrs';
import { AddressManagementService } from '../services/address-management.service';
import { AddressDTO } from '../../domain/entities/address.entity';
import { PaginatedResult } from '../../../../packages/core/src/domain/interfaces/paginated-result.interface';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_LIMIT, MIN_PAGE } from '../../domain/constants/pagination.constants';

export interface ListAddressesQuery extends IQuery {
  readonly userId: string;
  readonly page?: number;
  readonly limit?: number;
}

export class ListAddressesHandler implements IQueryHandler<ListAddressesQuery, PaginatedResult<AddressDTO>> {
  constructor(private readonly addressService: AddressManagementService) { }

  async handle(query: ListAddressesQuery): Promise<PaginatedResult<AddressDTO>> {
    return this.addressService.getUserAddresses(query.userId, {
      page: Math.max(MIN_PAGE, query.page ?? MIN_PAGE),
      limit: Math.min(MAX_PAGE_SIZE, Math.max(MIN_LIMIT, query.limit ?? DEFAULT_PAGE_SIZE)),
    });
  }
}
