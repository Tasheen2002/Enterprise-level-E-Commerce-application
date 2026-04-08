import { ICommand } from "@/api/src/shared/application";

export interface UpdateProfileCommand extends ICommand {
  userId: string;
  defaultAddressId?: string;
  defaultPaymentMethodId?: string;
  prefs?: Record<string, any>;
  locale?: string;
  currency?: string;
  stylePreferences?: Record<string, any>;
  preferredSizes?: Record<string, any>;
  firstName?: string;
  lastName?: string;
  phone?: string;
  title?: string;
  dateOfBirth?: string;
  residentOf?: string;
  nationality?: string;
}

export interface UpdateProfileResult {
  userId: string;
  defaultAddressId?: string | null;
  defaultPaymentMethodId?: string | null;
  prefs: Record<string, any>;
  locale?: string | null;
  currency?: string | null;
  stylePreferences: Record<string, any>;
  preferredSizes: Record<string, any>;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  title?: string | null;
  dateOfBirth?: string | null;
  residentOf?: string | null;
  nationality?: string | null;
  updatedAt: string;
}
