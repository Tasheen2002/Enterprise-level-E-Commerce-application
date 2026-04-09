import { SocialLogin, SocialProvider } from "../entities/social-login.entity";
import { UserId } from "../value-objects/user-id.vo";

export interface ISocialLoginRepository {
  save(socialLogin: SocialLogin): Promise<void>;
  findById(id: string): Promise<SocialLogin | null>;
  findByUserId(userId: UserId): Promise<SocialLogin[]>;
  delete(id: string): Promise<void>;
  findByProviderUserId(
    provider: SocialProvider,
    providerUserId: string
  ): Promise<SocialLogin | null>;
  findByUserIdAndProvider(
    userId: UserId,
    provider: SocialProvider
  ): Promise<SocialLogin | null>;
  countByUserId(userId: UserId): Promise<number>;
  deleteByUserId(userId: UserId): Promise<number>;
}
