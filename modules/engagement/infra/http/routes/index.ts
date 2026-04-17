import { FastifyInstance } from "fastify";
import {
  WishlistManagementService,
  ReminderManagementService,
  NotificationService,
  AppointmentService,
  ProductReviewService,
  NewsletterService,
  CreateWishlistHandler,
  AddToWishlistHandler,
  RemoveFromWishlistHandler,
  UpdateWishlistHandler,
  DeleteWishlistHandler,
  GetWishlistHandler,
  GetUserWishlistsHandler,
  GetPublicWishlistsHandler,
  GetWishlistItemsHandler,
  CreateReminderHandler,
  UpdateReminderStatusHandler,
  UnsubscribeReminderHandler,
  DeleteReminderHandler,
  GetReminderHandler,
  GetUserRemindersHandler,
  GetVariantRemindersHandler,
  ScheduleNotificationHandler,
  SendNotificationHandler,
  GetNotificationHandler,
  GetUserNotificationsHandler,
  CreateAppointmentHandler,
  UpdateAppointmentHandler,
  CancelAppointmentHandler,
  GetAppointmentHandler,
  GetUserAppointmentsHandler,
  GetLocationAppointmentsHandler,
  CreateProductReviewHandler,
  UpdateReviewStatusHandler,
  DeleteProductReviewHandler,
  GetProductReviewHandler,
  GetProductReviewsHandler,
  GetUserReviewsHandler,
  SubscribeNewsletterHandler,
  UnsubscribeNewsletterHandler,
  GetNewsletterSubscriptionHandler,
} from "../../../application";
import {
  WishlistController,
  ReminderController,
  NotificationController,
  AppointmentController,
  ProductReviewController,
  NewsletterController,
} from "../controllers";
import { wishlistRoutes } from "./wishlist.routes";
import { reminderRoutes } from "./reminder.routes";
import { notificationRoutes } from "./notification.routes";
import { appointmentRoutes } from "./appointment.routes";
import { productReviewRoutes } from "./product-review.routes";
import { newsletterRoutes } from "./newsletter.routes";

export async function registerEngagementRoutes(
  fastify: FastifyInstance,
  services: {
    wishlistService: WishlistManagementService;
    reminderService: ReminderManagementService;
    notificationService: NotificationService;
    appointmentService: AppointmentService;
    productReviewService: ProductReviewService;
    newsletterService: NewsletterService;
  },
): Promise<void> {
  const wishlistController = new WishlistController(
    new CreateWishlistHandler(services.wishlistService),
    new AddToWishlistHandler(services.wishlistService),
    new RemoveFromWishlistHandler(services.wishlistService),
    new UpdateWishlistHandler(services.wishlistService),
    new DeleteWishlistHandler(services.wishlistService),
    new GetWishlistHandler(services.wishlistService),
    new GetUserWishlistsHandler(services.wishlistService),
    new GetPublicWishlistsHandler(services.wishlistService),
    new GetWishlistItemsHandler(services.wishlistService),
  );

  const reminderController = new ReminderController(
    new CreateReminderHandler(services.reminderService),
    new UpdateReminderStatusHandler(services.reminderService),
    new UnsubscribeReminderHandler(services.reminderService),
    new DeleteReminderHandler(services.reminderService),
    new GetReminderHandler(services.reminderService),
    new GetUserRemindersHandler(services.reminderService),
    new GetVariantRemindersHandler(services.reminderService),
  );

  const notificationController = new NotificationController(
    new ScheduleNotificationHandler(services.notificationService),
    new SendNotificationHandler(services.notificationService),
    new GetNotificationHandler(services.notificationService),
    new GetUserNotificationsHandler(services.notificationService),
  );

  const appointmentController = new AppointmentController(
    new CreateAppointmentHandler(services.appointmentService),
    new UpdateAppointmentHandler(services.appointmentService),
    new CancelAppointmentHandler(services.appointmentService),
    new GetAppointmentHandler(services.appointmentService),
    new GetUserAppointmentsHandler(services.appointmentService),
    new GetLocationAppointmentsHandler(services.appointmentService),
  );

  const productReviewController = new ProductReviewController(
    new CreateProductReviewHandler(services.productReviewService),
    new UpdateReviewStatusHandler(services.productReviewService),
    new DeleteProductReviewHandler(services.productReviewService),
    new GetProductReviewHandler(services.productReviewService),
    new GetProductReviewsHandler(services.productReviewService),
    new GetUserReviewsHandler(services.productReviewService),
  );

  const newsletterController = new NewsletterController(
    new SubscribeNewsletterHandler(services.newsletterService),
    new UnsubscribeNewsletterHandler(services.newsletterService),
    new GetNewsletterSubscriptionHandler(services.newsletterService),
  );

  await wishlistRoutes(fastify, wishlistController);
  await reminderRoutes(fastify, reminderController);
  await notificationRoutes(fastify, notificationController);
  await appointmentRoutes(fastify, appointmentController);
  await productReviewRoutes(fastify, productReviewController);
  await newsletterRoutes(fastify, newsletterController);
}
