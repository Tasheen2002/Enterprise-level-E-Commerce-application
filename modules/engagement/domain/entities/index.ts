// Entities
export { Wishlist } from "./wishlist.entity";
export { WishlistItem } from "./wishlist-item.entity";
export { Reminder } from "./reminder.entity";
export { Notification } from "./notification.entity";
export { ProductReview } from "./product-review.entity";
export { Appointment } from "./appointment.entity";
export { NewsletterSubscription } from "./newsletter-subscription.entity";

// Wishlist interfaces
export type {
  CreateWishlistData,
  WishlistEntityData,
  WishlistDatabaseRow,
} from "./wishlist.entity";

// Wishlist Item interfaces
export type {
  CreateWishlistItemData,
  WishlistItemEntityData,
  WishlistItemDatabaseRow,
} from "./wishlist-item.entity";

// Reminder interfaces
export type {
  CreateReminderData,
  ReminderEntityData,
  ReminderDatabaseRow,
} from "./reminder.entity";

// Notification interfaces
export type {
  CreateNotificationData,
  NotificationEntityData,
  NotificationDatabaseRow,
} from "./notification.entity";

// Product Review interfaces
export type {
  CreateProductReviewData,
  ProductReviewEntityData,
  ProductReviewDatabaseRow,
} from "./product-review.entity";

// Appointment interfaces
export type {
  CreateAppointmentData,
  AppointmentEntityData,
  AppointmentDatabaseRow,
} from "./appointment.entity";

// Newsletter Subscription interfaces
export type {
  CreateNewsletterSubscriptionData,
  NewsletterSubscriptionEntityData,
  NewsletterSubscriptionDatabaseRow,
} from "./newsletter-subscription.entity";
