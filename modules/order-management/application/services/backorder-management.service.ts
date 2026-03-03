import {
  IBackorderRepository,
  BackorderQueryOptions,
} from "../../domain/repositories/backorder.repository";
import { Backorder } from "../../domain/entities/backorder.entity";

export interface CreateBackorderData {
  orderItemId: string;
  promisedEta?: Date;
  notifiedAt?: Date;
}

export class BackorderManagementService {
  constructor(private readonly backorderRepository: IBackorderRepository) {}

  async createBackorder(data: CreateBackorderData): Promise<Backorder> {
    // Validate required fields
    if (!data.orderItemId || data.orderItemId.trim().length === 0) {
      throw new Error("Order item ID is required");
    }

    // Check if backorder already exists for this item
    const existingBackorder = await this.backorderRepository.findByOrderItemId(
      data.orderItemId,
    );
    if (existingBackorder) {
      throw new Error("Backorder already exists for this order item");
    }

    // Validate promised ETA if provided
    if (data.promisedEta && data.promisedEta < new Date()) {
      throw new Error("Promised ETA cannot be in the past");
    }

    // Create the backorder entity
    const backorder = Backorder.create({
      orderItemId: data.orderItemId,
      promisedEta: data.promisedEta,
      notifiedAt: data.notifiedAt,
    });

    // Save the backorder
    await this.backorderRepository.save(backorder);

    return backorder;
  }

  async getBackorderByOrderItemId(
    orderItemId: string,
  ): Promise<Backorder | null> {
    if (!orderItemId || orderItemId.trim().length === 0) {
      throw new Error("Order item ID is required");
    }

    return await this.backorderRepository.findByOrderItemId(orderItemId);
  }

  async getAllBackorders(
    options?: BackorderQueryOptions,
  ): Promise<Backorder[]> {
    return await this.backorderRepository.findAll(options);
  }

  async getNotifiedBackorders(
    options?: BackorderQueryOptions,
  ): Promise<Backorder[]> {
    return await this.backorderRepository.findNotified(options);
  }

  async getUnnotifiedBackorders(
    options?: BackorderQueryOptions,
  ): Promise<Backorder[]> {
    return await this.backorderRepository.findUnnotified(options);
  }

  async getBackordersOverdue(
    options?: BackorderQueryOptions,
  ): Promise<Backorder[]> {
    const now = new Date();
    return await this.backorderRepository.findByPromisedEtaBefore(now, options);
  }

  async getBackordersByEtaBefore(
    date: Date,
    options?: BackorderQueryOptions,
  ): Promise<Backorder[]> {
    if (!date) {
      throw new Error("Date is required");
    }

    return await this.backorderRepository.findByPromisedEtaBefore(
      date,
      options,
    );
  }

  async updatePromisedEta(
    orderItemId: string,
    eta: Date,
  ): Promise<Backorder | null> {
    if (!orderItemId || orderItemId.trim().length === 0) {
      throw new Error("Order item ID is required");
    }

    if (!eta) {
      throw new Error("Promised ETA is required");
    }

    const backorder = await this.getBackorderByOrderItemId(orderItemId);
    if (!backorder) {
      return null;
    }

    backorder.updatePromisedEta(eta);

    await this.backorderRepository.update(backorder);

    return backorder;
  }

  async markAsNotified(orderItemId: string): Promise<Backorder | null> {
    if (!orderItemId || orderItemId.trim().length === 0) {
      throw new Error("Order item ID is required");
    }

    const backorder = await this.getBackorderByOrderItemId(orderItemId);
    if (!backorder) {
      return null;
    }

    backorder.markAsNotified();

    await this.backorderRepository.update(backorder);

    return backorder;
  }

  async notifyMultipleBackorders(orderItemIds: string[]): Promise<Backorder[]> {
    if (!orderItemIds || orderItemIds.length === 0) {
      throw new Error("At least one order item ID is required");
    }

    const notifiedBackorders: Backorder[] = [];

    for (const orderItemId of orderItemIds) {
      const backorder = await this.getBackorderByOrderItemId(orderItemId);

      if (backorder && !backorder.isCustomerNotified()) {
        backorder.markAsNotified();
        await this.backorderRepository.update(backorder);
        notifiedBackorders.push(backorder);
      }
    }

    return notifiedBackorders;
  }

  async deleteBackorder(orderItemId: string): Promise<boolean> {
    if (!orderItemId || orderItemId.trim().length === 0) {
      throw new Error("Order item ID is required");
    }

    const backorder = await this.getBackorderByOrderItemId(orderItemId);
    if (!backorder) {
      return false;
    }

    await this.backorderRepository.delete(orderItemId);
    return true;
  }

  async getBackorderCount(): Promise<number> {
    return await this.backorderRepository.count();
  }

  async getNotifiedCount(): Promise<number> {
    return await this.backorderRepository.countNotified();
  }

  async getUnnotifiedCount(): Promise<number> {
    return await this.backorderRepository.countUnnotified();
  }

  async backorderExists(orderItemId: string): Promise<boolean> {
    if (!orderItemId || orderItemId.trim().length === 0) {
      throw new Error("Order item ID is required");
    }

    return await this.backorderRepository.exists(orderItemId);
  }

  async isBackorderOverdue(orderItemId: string): Promise<boolean> {
    if (!orderItemId || orderItemId.trim().length === 0) {
      throw new Error("Order item ID is required");
    }

    const backorder = await this.getBackorderByOrderItemId(orderItemId);
    if (!backorder) {
      return false;
    }

    const promisedEta = backorder.getPromisedEta();
    if (!promisedEta) {
      return false;
    }

    return promisedEta < new Date();
  }
}
