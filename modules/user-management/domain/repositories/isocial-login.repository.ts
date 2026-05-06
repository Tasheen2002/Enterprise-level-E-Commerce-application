import { SocialLogin } from "../entities/social-login.entity";
import { SocialProvider } from "../value-objects/social-provider.vo";
import { SocialLoginId } from "../value-objects/social-login-id.vo";
import { UserId } from "../value-objects/user-id.vo";

export interface ISocialLoginRepository {
  // Core CRUD operations
  save(socialLogin: SocialLogin): Promise<void>;
  findById(id: SocialLoginId): Promise<SocialLogin | null>;
  findByUserId(userId: UserId): Promise<SocialLogin[]>;
  delete(id: SocialLoginId): Promise<void>;

  // Query operations
  findByProviderUserId(
    provider: SocialProvider,
    providerUserId: string,
  ): Promise<SocialLogin | null>;
  findByUserIdAndProvider(
    userId: UserId,
    provider: SocialProvider,
  ): Promise<SocialLogin | null>;

  // Aggregation
  countByUserId(userId: UserId): Promise<number>;

  // Cleanup
  deleteByUserId(userId: UserId): Promise<number>;
}
