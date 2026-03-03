import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { AddressManagementService, AddressResponseDto } from "../services/address-management.service";
import { ListAddressesQuery, ListAddressesResult, AddressListItem } from "./list-addresses.query";

export class ListAddressesHandler implements IQueryHandler<ListAddressesQuery, QueryResult<ListAddressesResult>> {
  constructor(private readonly addressService: AddressManagementService) {}

  async handle(query: ListAddressesQuery): Promise<QueryResult<ListAddressesResult>> {
    try {
      const addresses = await this.addressService.getUserAddresses(query.userId);

      let filtered = query.type
        ? addresses.filter((addr: AddressResponseDto) => addr.type === query.type)
        : addresses;

      if (query.sortBy) {
        const sortOrder = query.sortOrder || "desc";
        filtered = [...filtered].sort((a, b) => {
          const aVal = a[query.sortBy as keyof AddressResponseDto];
          const bVal = b[query.sortBy as keyof AddressResponseDto];
          if (aVal instanceof Date && bVal instanceof Date) {
            return sortOrder === "asc" ? aVal.getTime() - bVal.getTime() : bVal.getTime() - aVal.getTime();
          }
          return 0;
        });
      }

      const totalCount = filtered.length;
      const page = query.page || 1;
      const limit = query.limit || 20;
      const paginated = filtered.slice((page - 1) * limit, (page - 1) * limit + limit);

      const addressItems: AddressListItem[] = paginated.map((address: AddressResponseDto) => ({
        addressId: address.id,
        userId: address.userId,
        type: address.type,
        isDefault: address.isDefault,
        firstName: address.firstName,
        lastName: address.lastName,
        company: address.company,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
        phone: address.phone,
        createdAt: address.createdAt,
      }));

      return QueryResult.success<ListAddressesResult>({
        userId: query.userId,
        addresses: addressItems,
        totalCount,
      });
    } catch (error) {
      return QueryResult.failure<ListAddressesResult>(
        error instanceof Error ? error.message : "Failed to retrieve addresses",
      );
    }
  }
}
