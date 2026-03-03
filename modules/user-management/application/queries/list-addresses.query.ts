import {
  AddressManagementService,
  AddressResponseDto,
} from "../services/address-management.service";
import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "@/api/src/shared/application";

export interface ListAddressesQuery extends IQuery {
  userId: string;
  type?: "billing" | "shipping";
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface AddressListItem {
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
}

export interface ListAddressesResult {
  userId: string;
  addresses: AddressListItem[];
  totalCount: number;
}

export class ListAddressesHandler implements IQueryHandler<
  ListAddressesQuery,
  QueryResult<ListAddressesResult>
> {
  constructor(private readonly addressService: AddressManagementService) {}

  async handle(
    query: ListAddressesQuery,
  ): Promise<QueryResult<ListAddressesResult>> {
    try {
      // Validate query
      if (!query.userId) {
        return QueryResult.failure<ListAddressesResult>("User ID is required");
      }

      // Get addresses through service with pagination
      const addresses = await this.addressService.getUserAddresses(
        query.userId,
      );

      // Filter by type if specified
      let filteredAddresses = query.type
        ? addresses.filter(
            (addr: AddressResponseDto) => addr.type === query.type,
          )
        : addresses;

      // Apply sorting
      if (query.sortBy) {
        const sortOrder = query.sortOrder || "desc";
        filteredAddresses.sort((a, b) => {
          const aValue = a[query.sortBy as keyof AddressResponseDto];
          const bValue = b[query.sortBy as keyof AddressResponseDto];

          if (aValue instanceof Date && bValue instanceof Date) {
            return sortOrder === "asc"
              ? aValue.getTime() - bValue.getTime()
              : bValue.getTime() - aValue.getTime();
          }

          return 0;
        });
      }

      // Get total count before pagination
      const totalCount = filteredAddresses.length;

      // Apply pagination
      const page = query.page || 1;
      const limit = query.limit || 20;
      const offset = (page - 1) * limit;
      const paginatedAddresses = filteredAddresses.slice(
        offset,
        offset + limit,
      );

      // Map to result format
      const addressItems: AddressListItem[] = paginatedAddresses.map(
        (address: AddressResponseDto) => ({
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
        }),
      );

      const result: ListAddressesResult = {
        userId: query.userId,
        addresses: addressItems,
        totalCount: totalCount,
      };

      return QueryResult.success<ListAddressesResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<ListAddressesResult>(
          "Failed to retrieve addresses",
        );
      }

      return QueryResult.failure<ListAddressesResult>(
        "An unexpected error occurred while retrieving addresses",
      );
    }
  }
}
