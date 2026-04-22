import { FastifyInstance } from "fastify";
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

export interface EngagementRouteControllers {
  wishlistController: WishlistController;
  reminderController: ReminderController;
  notificationController: NotificationController;
  appointmentController: AppointmentController;
  productReviewController: ProductReviewController;
  newsletterController: NewsletterController;
}

export async function registerEngagementRoutes(
  fastify: FastifyInstance,
  controllers: EngagementRouteControllers,
): Promise<void> {
  await fastify.register(
    async (instance) => {
      await wishlistRoutes(instance, controllers.wishlistController);
      await reminderRoutes(instance, controllers.reminderController);
      await notificationRoutes(instance, controllers.notificationController);
      await appointmentRoutes(instance, controllers.appointmentController);
      await productReviewRoutes(instance, controllers.productReviewController);
      await newsletterRoutes(instance, controllers.newsletterController);
    },
    { prefix: "/api/v1" },
  );
}
