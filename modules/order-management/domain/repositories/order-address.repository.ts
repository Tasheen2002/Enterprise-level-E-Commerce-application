import { OrderAddress } from "../entities/order-address.entity";

export interface IOrderAddressRepository {
  // Basic CRUD
  save(orderAddress: OrderAddress): Promise<void>;
  delete(orderId: string): Promise<void>;

  // Finders
  findByOrderId(orderId: string): Promise<OrderAddress | null>;

  // Existence checks
  exists(orderId: string): Promise<boolean>;
}
