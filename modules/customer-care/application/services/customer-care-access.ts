import { IExternalOrderQueryPort } from "../../domain/external-services.js";

/** Who is asking: the signed-in user (if any) and whether they are customer care staff. */
export interface CustomerCareActor {
  userId?: string;
  isStaff: boolean;
}

/**
 * Customers may only attach their own orders to tickets and feedback; staff
 * may reference any order. Fails closed when the order lookup is not wired.
 */
export async function assertCanReferenceOrder(
  orderQueryPort: IExternalOrderQueryPort | undefined,
  orderId: string,
  actor: CustomerCareActor,
): Promise<void> {
  if (actor.isStaff) return;
  if (!actor.userId) {
    throw new Error("Sign in to reference an order");
  }
  const order = orderQueryPort ? await orderQueryPort.findOrderOwner(orderId) : null;
  if (!order || order.userId !== actor.userId) {
    throw new Error(`Order ${orderId} not found`);
  }
}
