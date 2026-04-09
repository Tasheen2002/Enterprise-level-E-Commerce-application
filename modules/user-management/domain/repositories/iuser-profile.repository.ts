import { UserProfile } from "../entities/user-profile.entity";
import { UserId } from "../value-objects/user-id.vo";

export interface IUserProfileRepository {
  // Core CRUD operations
  save(userProfile: UserProfile): Promise<void>;
  findByUserId(userId: UserId): Promise<UserProfile | null>;
  delete(userId: UserId): Promise<void>;
}
