import { IQuery } from "@/api/src/shared/application";

export interface GetUserProfileQuery extends IQuery {
  userId: string;
}

export interface UserProfileResult {
  userId: string;
  defaultAddressId?: string;
  defaultPaymentMethodId?: string;
  preferences: Record<string, any>;
  locale?: string;
  currency?: string;
  stylePreferences: Record<string, any>;
  preferredSizes: Record<string, any>;
}
