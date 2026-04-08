// Barrel for command handlers
// Export base interfaces and classes from first command file
export {
  CommandResult,
  CreateWishlistHandler,
} from "./create-wishlist.command.js";
export type {
  ICommand,
  ICommandHandler,
  CreateWishlistCommand,
  WishlistResult
} from "./create-wishlist.command.js";

export {
  AddToWishlistHandler,
} from "./add-to-wishlist.command.js";
export type { AddToWishlistCommand, WishlistItemResult } from "./add-to-wishlist.command.js";

export {
  RemoveFromWishlistHandler,
} from "./remove-from-wishlist.command.js";
export type { RemoveFromWishlistCommand } from "./remove-from-wishlist.command.js";

export {
  UpdateWishlistHandler,
} from "./update-wishlist.command.js";
export type { UpdateWishlistCommand } from "./update-wishlist.command.js";

export {
  DeleteWishlistHandler,
} from "./delete-wishlist.command.js";
export type { DeleteWishlistCommand } from "./delete-wishlist.command.js";

export {
  CreateReminderHandler,
} from "./create-reminder.command.js";
export type { CreateReminderCommand, ReminderResult } from "./create-reminder.command.js";

export {
  UpdateReminderStatusHandler,
} from "./update-reminder-status.command.js";
export type { UpdateReminderStatusCommand } from "./update-reminder-status.command.js";

export {
  UnsubscribeReminderHandler,
} from "./unsubscribe-reminder.command.js";
export type { UnsubscribeReminderCommand } from "./unsubscribe-reminder.command.js";

export {
  DeleteReminderHandler,
} from "./delete-reminder.command.js";
export type { DeleteReminderCommand } from "./delete-reminder.command.js";

export {
  ScheduleNotificationHandler,
} from "./schedule-notification.command.js";
export type { ScheduleNotificationCommand, NotificationResult } from "./schedule-notification.command.js";

export {
  SendNotificationHandler,
} from "./send-notification.command.js";
export type { SendNotificationCommand } from "./send-notification.command.js";

export {
  CreateAppointmentHandler,
} from "./create-appointment.command.js";
export type { CreateAppointmentCommand, AppointmentResult } from "./create-appointment.command.js";

export {
  UpdateAppointmentHandler,
} from "./update-appointment.command.js";
export type { UpdateAppointmentCommand } from "./update-appointment.command.js";

export {
  CancelAppointmentHandler,
} from "./cancel-appointment.command.js";
export type { CancelAppointmentCommand } from "./cancel-appointment.command.js";

export {
  CreateProductReviewHandler,
} from "./create-product-review.command.js";
export type { CreateProductReviewCommand, ProductReviewResult } from "./create-product-review.command.js";

export {
  UpdateReviewStatusHandler,
} from "./update-review-status.command.js";
export type { UpdateReviewStatusCommand } from "./update-review-status.command.js";

export {
  DeleteProductReviewHandler,
} from "./delete-product-review.command.js";
export type { DeleteProductReviewCommand } from "./delete-product-review.command.js";

export {
  SubscribeNewsletterHandler,
} from "./subscribe-newsletter.command.js";
export type { SubscribeNewsletterCommand, NewsletterSubscriptionResult } from "./subscribe-newsletter.command.js";

export {
  UnsubscribeNewsletterHandler,
} from "./unsubscribe-newsletter.command.js";
export type { UnsubscribeNewsletterCommand } from "./unsubscribe-newsletter.command.js";
