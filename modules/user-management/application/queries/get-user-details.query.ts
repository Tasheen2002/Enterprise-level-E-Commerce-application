import { IUserRepository } from "../../domain/repositories/iuser.repository";
import { IAddressRepository } from "../../domain/repositories/iaddress.repository";
import { UserId } from "../../domain/value-objects/user-id.vo";
import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "@/api/src/shared/application";

export interface GetUserDetailsQuery extends IQuery {
  userId: string;
}

export interface GetUserDetailsResult {
  userId: string;
  email: string;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  title: string | null;
  dateOfBirth: Date | null;
  residentOf: string | null;
  nationality: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  isGuest: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class GetUserDetailsHandler
  implements IQueryHandler<GetUserDetailsQuery, QueryResult<GetUserDetailsResult>>
{
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly addressRepository: IAddressRepository,
  ) {}

  async handle(
    query: GetUserDetailsQuery,
  ): Promise<QueryResult<GetUserDetailsResult>> {
    try {
      if (!query.userId) {
        return QueryResult.failure<GetUserDetailsResult>("User ID is required");
      }

      const userId = UserId.fromString(query.userId);
      const user = await this.userRepository.findById(userId);

      if (!user) {
        return QueryResult.failure<GetUserDetailsResult>("User not found");
      }

      const addresses = await this.addressRepository.findByUserId(userId);
      const defaultAddress = addresses.find((addr) => addr.getIsDefault());
      const addressToUse = defaultAddress || addresses[0];

      const userData = user.toData();

      let firstName: string | null = userData.firstName;
      let lastName: string | null = userData.lastName;
      let phone: string | null = userData.phone;

      if ((!firstName || !lastName) && addressToUse) {
        const addressValue = addressToUse.getAddressValue();
        firstName = firstName || addressValue.getFirstName() || null;
        lastName = lastName || addressValue.getLastName() || null;
        phone = phone || addressValue.getPhone() || null;
      }

      return QueryResult.success<GetUserDetailsResult>({
        userId: userData.id,
        email: userData.email,
        phone,
        firstName,
        lastName,
        title: userData.title,
        dateOfBirth: userData.dateOfBirth,
        residentOf: userData.residentOf,
        nationality: userData.nationality,
        role: userData.role,
        status: userData.status,
        emailVerified: userData.emailVerified,
        phoneVerified: userData.phoneVerified,
        isGuest: userData.isGuest,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      });
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<GetUserDetailsResult>(
          error.message || "Failed to get user details",
        );
      }
      return QueryResult.failure<GetUserDetailsResult>(
        "An unexpected error occurred while retrieving user details",
      );
    }
  }
}
