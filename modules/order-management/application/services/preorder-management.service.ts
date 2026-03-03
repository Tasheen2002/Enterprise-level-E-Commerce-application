import {
  IPreorderRepository,
  PreorderQueryOptions,
} from "../../domain/repositories/preorder.repository";
import { Preorder } from "../../domain/entities/preorder.entity";

export interface CreatePreorderData {
  orderItemId: string;
  releaseDate?: Date;
}

export class PreorderManagementService {
  constructor(private readonly preorderRepository: IPreorderRepository) {}

  async createPreorder(data: CreatePreorderData): Promise<Preorder> {
    // Validate required fields
    if (!data.orderItemId || data.orderItemId.trim().length === 0) {
      throw new Error("Order item ID is required");
    }

    // Check if preorder already exists for this item
    const existingPreorder = await this.preorderRepository.findByOrderItemId(
      data.orderItemId,
    );
    if (existingPreorder) {
      throw new Error("Preorder already exists for this order item");
    }

    // Create the preorder entity
    const preorder = Preorder.create({
      orderItemId: data.orderItemId,
      releaseDate: data.releaseDate,
    });

    // Save the preorder
    await this.preorderRepository.save(preorder);

    return preorder;
  }

  async getPreorderByOrderItemId(
    orderItemId: string,
  ): Promise<Preorder | null> {
    if (!orderItemId || orderItemId.trim().length === 0) {
      throw new Error("Order item ID is required");
    }

    return await this.preorderRepository.findByOrderItemId(orderItemId);
  }

  async getAllPreorders(options?: PreorderQueryOptions): Promise<Preorder[]> {
    return await this.preorderRepository.findAll(options);
  }

  async getNotifiedPreorders(
    options?: PreorderQueryOptions,
  ): Promise<Preorder[]> {
    return await this.preorderRepository.findNotified(options);
  }

  async getUnnotifiedPreorders(
    options?: PreorderQueryOptions,
  ): Promise<Preorder[]> {
    return await this.preorderRepository.findUnnotified(options);
  }

  async getReleasedPreorders(
    options?: PreorderQueryOptions,
  ): Promise<Preorder[]> {
    return await this.preorderRepository.findReleased(options);
  }

  async getPreordersByReleaseDateBefore(
    date: Date,
    options?: PreorderQueryOptions,
  ): Promise<Preorder[]> {
    if (!date) {
      throw new Error("Date is required");
    }

    return await this.preorderRepository.findByReleaseDateBefore(date, options);
  }

  async getPreordersReleasingSoon(
    daysAhead: number = 7,
    options?: PreorderQueryOptions,
  ): Promise<Preorder[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return await this.preorderRepository.findByReleaseDateBefore(
      futureDate,
      options,
    );
  }

  async updateReleaseDate(
    orderItemId: string,
    releaseDate: Date,
  ): Promise<Preorder | null> {
    if (!orderItemId || orderItemId.trim().length === 0) {
      throw new Error("Order item ID is required");
    }

    if (!releaseDate) {
      throw new Error("Release date is required");
    }

    const preorder = await this.getPreorderByOrderItemId(orderItemId);
    if (!preorder) {
      return null;
    }

    preorder.updateReleaseDate(releaseDate);

    await this.preorderRepository.update(preorder);

    return preorder;
  }

  async markAsNotified(orderItemId: string): Promise<Preorder | null> {
    if (!orderItemId || orderItemId.trim().length === 0) {
      throw new Error("Order item ID is required");
    }

    const preorder = await this.getPreorderByOrderItemId(orderItemId);
    if (!preorder) {
      return null;
    }

    preorder.markAsNotified();

    await this.preorderRepository.update(preorder);

    return preorder;
  }

  async notifyMultiplePreorders(orderItemIds: string[]): Promise<Preorder[]> {
    if (!orderItemIds || orderItemIds.length === 0) {
      throw new Error("At least one order item ID is required");
    }

    const notifiedPreorders: Preorder[] = [];

    for (const orderItemId of orderItemIds) {
      const preorder = await this.getPreorderByOrderItemId(orderItemId);

      if (preorder && !preorder.isCustomerNotified()) {
        preorder.markAsNotified();
        await this.preorderRepository.update(preorder);
        notifiedPreorders.push(preorder);
      }
    }

    return notifiedPreorders;
  }

  async notifyReleasedPreorders(): Promise<Preorder[]> {
    const releasedPreorders = await this.preorderRepository.findReleased();
    const notifiedPreorders: Preorder[] = [];

    for (const preorder of releasedPreorders) {
      if (!preorder.isCustomerNotified()) {
        preorder.markAsNotified();
        await this.preorderRepository.update(preorder);
        notifiedPreorders.push(preorder);
      }
    }

    return notifiedPreorders;
  }

  async deletePreorder(orderItemId: string): Promise<boolean> {
    if (!orderItemId || orderItemId.trim().length === 0) {
      throw new Error("Order item ID is required");
    }

    const preorder = await this.getPreorderByOrderItemId(orderItemId);
    if (!preorder) {
      return false;
    }

    await this.preorderRepository.delete(orderItemId);
    return true;
  }

  async getPreorderCount(): Promise<number> {
    return await this.preorderRepository.count();
  }

  async getNotifiedCount(): Promise<number> {
    return await this.preorderRepository.countNotified();
  }

  async getUnnotifiedCount(): Promise<number> {
    return await this.preorderRepository.countUnnotified();
  }

  async getReleasedCount(): Promise<number> {
    return await this.preorderRepository.countReleased();
  }

  async preorderExists(orderItemId: string): Promise<boolean> {
    if (!orderItemId || orderItemId.trim().length === 0) {
      throw new Error("Order item ID is required");
    }

    return await this.preorderRepository.exists(orderItemId);
  }

  async isPreorderReleased(orderItemId: string): Promise<boolean> {
    if (!orderItemId || orderItemId.trim().length === 0) {
      throw new Error("Order item ID is required");
    }

    const preorder = await this.getPreorderByOrderItemId(orderItemId);
    if (!preorder) {
      return false;
    }

    return preorder.isReleased();
  }
}
