// Entities
export { Wishlist } from "./wishlist.entity";
export { WishlistItem } from "./wishlist-item.entity";
export { Reminder } from "./reminder.entity";
export { Notification } from "./notification.entity";
export { ProductReview } from "./product-review.entity";
export { Appointment } from "./appointment.entity";
export { NewsletterSubscription } from "./newsletter-subscription.entity";

// Props interfaces
export type { WishlistProps, WishlistDTO, CreateWishlistData } from "./wishlist.entity";
export type { WishlistItemProps, WishlistItemDTO, CreateWishlistItemData } from "./wishlist-item.entity";
export type { ReminderProps, ReminderDTO, CreateReminderData } from "./reminder.entity";
export type { NotificationProps, NotificationDTO, CreateNotificationData } from "./notification.entity";
export type { ReviewProps, ReviewDTO, CreateProductReviewData } from "./product-review.entity";
export type { AppointmentProps, AppointmentDTO, CreateAppointmentData } from "./appointment.entity";
export type { SubscriptionProps, SubscriptionDTO, CreateNewsletterSubscriptionData } from "./newsletter-subscription.entity";

// Domain Events
export { WishlistCreatedEvent, WishlistOwnershipTransferredEvent } from "./wishlist.entity";
export { WishlistItemAddedEvent } from "./wishlist-item.entity";
export { ReminderCreatedEvent, ReminderStatusChangedEvent } from "./reminder.entity";
export { NotificationCreatedEvent, NotificationStatusChangedEvent } from "./notification.entity";
export { ReviewSubmittedEvent, ReviewStatusChangedEvent } from "./product-review.entity";
export { AppointmentCreatedEvent, AppointmentRescheduledEvent } from "./appointment.entity";
export { SubscriptionCreatedEvent, SubscriptionStatusChangedEvent } from "./newsletter-subscription.entity";
