import { OrderAddress } from "../entities/order-address.entity";
import { OrderId } from "../value-objects/order-id.vo";

export interface IOrderAddressRepository {
  // Basic CRUD
  save(orderAddress: OrderAddress): Promise<void>;
  delete(orderId: OrderId): Promise<void>;

  // Finders
  findByOrderId(orderId: OrderId): Promise<OrderAddress | null>;

  // Existence checks
  exists(orderId: OrderId): Promise<boolean>;
}
