import {
  IPreorderRepository,
  PreorderQueryOptions,
} from "../../domain/repositories/preorder.repository";
import { Preorder, PreorderDTO } from "../../domain/entities/preorder.entity";
import {
  PreorderNotFoundError,
  PreorderAlreadyExistsError,
  DomainValidationError,
} from "../../domain/errors/order-management.errors";

interface CreatePreorderParams {
  orderItemId: string;
  releaseDate?: Date;
}

export class PreorderManagementService {
  constructor(private readonly preorderRepository: IPreorderRepository) {}

  async createPreorder(params: CreatePreorderParams): Promise<PreorderDTO> {
    if (!params.orderItemId || params.orderItemId.trim().length === 0) {
      throw new DomainValidationError("Order item ID is required");
    }

    const existingPreorder = await this.preorderRepository.findByOrderItemId(
      params.orderItemId,
    );
    if (existingPreorder) {
      throw new PreorderAlreadyExistsError(params.orderItemId);
    }

    const preorder = Preorder.create({
      orderItemId: params.orderItemId,
      releaseDate: params.releaseDate,
    });

    await this.preorderRepository.save(preorder);

    return Preorder.toDTO(preorder);
  }

  async getPreorderByOrderItemId(orderItemId: string): Promise<PreorderDTO | null> {
    if (!orderItemId || orderItemId.trim().length === 0) {
      throw new DomainValidationError("Order item ID is required");
    }

    const preorder = await this.preorderRepository.findByOrderItemId(orderItemId);
    return preorder ? Preorder.toDTO(preorder) : null;
  }

  async getAllPreorders(options?: PreorderQueryOptions): Promise<PreorderDTO[]> {
    const preorders = await this.preorderRepository.findAll(options);
    return preorders.map((p) => Preorder.toDTO(p));
  }

  async getNotifiedPreorders(
    options?: PreorderQueryOptions,
  ): Promise<PreorderDTO[]> {
    const preorders = await this.preorderRepository.findNotified(options);
    return preorders.map((p) => Preorder.toDTO(p));
  }

  async getUnnotifiedPreorders(
    options?: PreorderQueryOptions,
  ): Promise<PreorderDTO[]> {
    const preorders = await this.preorderRepository.findUnnotified(options);
    return preorders.map((p) => Preorder.toDTO(p));
  }

  async getReleasedPreorders(
    options?: PreorderQueryOptions,
  ): Promise<PreorderDTO[]> {
    const preorders = await this.preorderRepository.findReleased(options);
    return preorders.map((p) => Preorder.toDTO(p));
  }

  async getPreordersByReleaseDateBefore(
    date: Date,
    options?: PreorderQueryOptions,
  ): Promise<PreorderDTO[]> {
    if (!date) {
      throw new DomainValidationError("Date is required");
    }

    const preorders = await this.preorderRepository.findByReleaseDateBefore(date, options);
    return preorders.map((p) => Preorder.toDTO(p));
  }

  async getPreordersReleasingSoon(
    daysAhead: number = 7,
    options?: PreorderQueryOptions,
  ): Promise<PreorderDTO[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const preorders = await this.preorderRepository.findByReleaseDateBefore(
      futureDate,
      options,
    );
    return preorders.map((p) => Preorder.toDTO(p));
  }

  async updateReleaseDate(
    orderItemId: string,
    releaseDate: Date,
  ): Promise<PreorderDTO> {
    if (!releaseDate) {
      throw new DomainValidationError("Release date is required");
    }

    const preorder = await this.preorderRepository.findByOrderItemId(orderItemId);
    if (!preorder) throw new PreorderNotFoundError(orderItemId);

    preorder.updateReleaseDate(releaseDate);
    await this.preorderRepository.save(preorder);

    return Preorder.toDTO(preorder);
  }

  async markAsNotified(orderItemId: string): Promise<PreorderDTO> {
    const preorder = await this.preorderRepository.findByOrderItemId(orderItemId);
    if (!preorder) throw new PreorderNotFoundError(orderItemId);

    preorder.markAsNotified();
    await this.preorderRepository.save(preorder);

    return Preorder.toDTO(preorder);
  }

  async notifyMultiplePreorders(orderItemIds: string[]): Promise<PreorderDTO[]> {
    if (!orderItemIds || orderItemIds.length === 0) {
      throw new DomainValidationError("At least one order item ID is required");
    }

    const notifiedPreorders: Preorder[] = [];

    for (const orderItemId of orderItemIds) {
      const preorder = await this.preorderRepository.findByOrderItemId(orderItemId);

      if (preorder && !preorder.isCustomerNotified()) {
        preorder.markAsNotified();
        await this.preorderRepository.save(preorder);
        notifiedPreorders.push(preorder);
      }
    }

    return notifiedPreorders.map((p) => Preorder.toDTO(p));
  }

  async notifyReleasedPreorders(): Promise<PreorderDTO[]> {
    const releasedPreorders = await this.preorderRepository.findReleased();
    const notifiedPreorders: Preorder[] = [];

    for (const preorder of releasedPreorders) {
      if (!preorder.isCustomerNotified()) {
        preorder.markAsNotified();
        await this.preorderRepository.save(preorder);
        notifiedPreorders.push(preorder);
      }
    }

    return notifiedPreorders.map((p) => Preorder.toDTO(p));
  }

  async deletePreorder(orderItemId: string): Promise<void> {
    const exists = await this.preorderRepository.exists(orderItemId);
    if (!exists) throw new PreorderNotFoundError(orderItemId);

    await this.preorderRepository.delete(orderItemId);
  }

  async getPreorderCount(): Promise<number> {
    return this.preorderRepository.count();
  }

  async getNotifiedCount(): Promise<number> {
    return this.preorderRepository.countNotified();
  }

  async getUnnotifiedCount(): Promise<number> {
    return this.preorderRepository.countUnnotified();
  }

  async getReleasedCount(): Promise<number> {
    return this.preorderRepository.countReleased();
  }

  async preorderExists(orderItemId: string): Promise<boolean> {
    if (!orderItemId || orderItemId.trim().length === 0) {
      throw new DomainValidationError("Order item ID is required");
    }

    return this.preorderRepository.exists(orderItemId);
  }

  async isPreorderReleased(orderItemId: string): Promise<boolean> {
    const preorder = await this.preorderRepository.findByOrderItemId(orderItemId);
    if (!preorder) {
      return false;
    }

    return preorder.isReleased();
  }
}
