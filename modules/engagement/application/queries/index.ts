// Barrel for query handlers
// Export base interfaces from first query file
export {
  QueryResult,
  GetWishlistHandler,
} from "./get-wishlist.query.js";
export type {
  IQuery,
  IQueryHandler,
  GetWishlistQuery,
  WishlistDto
} from "./get-wishlist.query.js";

export {
  GetUserWishlistsHandler,
} from "./get-user-wishlists.query.js";
export type { GetUserWishlistsQuery } from "./get-user-wishlists.query.js";

export {
  GetPublicWishlistsHandler,
} from "./get-public-wishlists.query.js";
export type { GetPublicWishlistsQuery } from "./get-public-wishlists.query.js";

export {
  GetWishlistItemsHandler,
} from "./get-wishlist-items.query.js";
export type { GetWishlistItemsQuery, WishlistItemDto } from "./get-wishlist-items.query.js";

export {
  GetReminderHandler,
} from "./get-reminder.query.js";
export type { GetReminderQuery, ReminderDto } from "./get-reminder.query.js";

export {
  GetUserRemindersHandler,
} from "./get-user-reminders.query.js";
export type { GetUserRemindersQuery } from "./get-user-reminders.query.js";

export {
  GetVariantRemindersHandler,
} from "./get-variant-reminders.query.js";
export type { GetVariantRemindersQuery } from "./get-variant-reminders.query.js";

export {
  GetNotificationHandler,
} from "./get-notification.query.js";
export type { GetNotificationQuery, NotificationDto } from "./get-notification.query.js";

export {
  GetUserNotificationsHandler,
} from "./get-user-notifications.query.js";
export type { GetUserNotificationsQuery } from "./get-user-notifications.query.js";

export {
  GetAppointmentHandler,
} from "./get-appointment.query.js";
export type { GetAppointmentQuery, AppointmentDto } from "./get-appointment.query.js";

export {
  GetUserAppointmentsHandler,
} from "./get-user-appointments.query.js";
export type { GetUserAppointmentsQuery } from "./get-user-appointments.query.js";

export {
  GetLocationAppointmentsHandler,
} from "./get-location-appointments.query.js";
export type { GetLocationAppointmentsQuery } from "./get-location-appointments.query.js";

export {
  GetProductReviewHandler,
} from "./get-product-review.query.js";
export type { GetProductReviewQuery, ProductReviewDto } from "./get-product-review.query.js";

export {
  GetProductReviewsHandler,
} from "./get-product-reviews.query.js";
export type { GetProductReviewsQuery } from "./get-product-reviews.query.js";

export {
  GetUserReviewsHandler,
} from "./get-user-reviews.query.js";
export type { GetUserReviewsQuery } from "./get-user-reviews.query.js";

export {
  GetNewsletterSubscriptionHandler,
} from "./get-newsletter-subscription.query.js";
export type { GetNewsletterSubscriptionQuery, NewsletterSubscriptionDto } from "./get-newsletter-subscription.query.js";
