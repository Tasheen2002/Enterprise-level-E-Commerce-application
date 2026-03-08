import {
  IPreorderRepository,
  PreorderQueryOptions,
} from "../../domain/repositories/preorder.repository";
import { Preorder } from "../../domain/entities/preorder.entity";
import {
  PreorderNotFoundError,
  PreorderAlreadyExistsError,
  DomainValidationError,
} from "../../domain/errors/order-management.errors";

export interface CreatePreorderData {
  orderItemId: string;
  releaseDate?: Date;
}

export class PreorderManagementService {
  constructor(private readonly preorderRepository: IPreorderRepository) {}

  async createPreorder(data: CreatePreorderData): Promise<Preorder> {
    // Validate required fields
    if (!data.orderItemId || data.orderItemId.trim().length === 0) {
      throw new DomainValidationError("Order item ID is required");
    }

    // Check if preorder already exists for this item
    const existingPreorder = await this.preorderRepository.findByOrderItemId(
      data.orderItemId,
    );
    if (existingPreorder) {
      throw new PreorderAlreadyExistsError(data.orderItemId);
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

  async getPreorderByOrderItemId(orderItemId: string): Promise<Preorder> {
    if (!orderItemId || orderItemId.trim().length === 0) {
      throw new DomainValidationError("Order item ID is required");
    }

    const preorder =
      await this.preorderRepository.findByOrderItemId(orderItemId);

    if (!preorder) {
      throw new PreorderNotFoundError(orderItemId);
    }

    return preorder;
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
      throw new DomainValidationError("Date is required");
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
  ): Promise<Preorder> {
    if (!releaseDate) {
      throw new DomainValidationError("Release date is required");
    }

    const preorder = await this.getPreorderByOrderItemId(orderItemId);

    preorder.updateReleaseDate(releaseDate);

    await this.preorderRepository.update(preorder);

    return preorder;
  }

  async markAsNotified(orderItemId: string): Promise<Preorder> {
    const preorder = await this.getPreorderByOrderItemId(orderItemId);

    preorder.markAsNotified();

    await this.preorderRepository.update(preorder);

    return preorder;
  }

  async notifyMultiplePreorders(orderItemIds: string[]): Promise<Preorder[]> {
    if (!orderItemIds || orderItemIds.length === 0) {
      throw new DomainValidationError("At least one order item ID is required");
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

  async deletePreorder(orderItemId: string): Promise<void> {
    await this.getPreorderByOrderItemId(orderItemId);

    await this.preorderRepository.delete(orderItemId);
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
      throw new DomainValidationError("Order item ID is required");
    }

    return await this.preorderRepository.exists(orderItemId);
  }

  async isPreorderReleased(orderItemId: string): Promise<boolean> {
    if (!orderItemId || orderItemId.trim().length === 0) {
      throw new DomainValidationError("Order item ID is required");
    }

    const preorder = await this.getPreorderByOrderItemId(orderItemId);
    if (!preorder) {
      return false;
    }

    return preorder.isReleased();
  }
}
