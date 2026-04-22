import {
  IBackorderRepository,
  BackorderQueryOptions,
} from "../../domain/repositories/backorder.repository";
import {
  Backorder,
  BackorderDTO,
} from "../../domain/entities/backorder.entity";
import {
  BackorderNotFoundError,
  BackorderAlreadyExistsError,
  DomainValidationError,
} from "../../domain/errors/order-management.errors";

interface CreateBackorderParams {
  orderItemId: string;
  promisedEta?: Date;
}

export class BackorderManagementService {
  constructor(private readonly backorderRepository: IBackorderRepository) {}

  async createBackorder(params: CreateBackorderParams): Promise<BackorderDTO> {
    if (!params.orderItemId || params.orderItemId.trim().length === 0) {
      throw new DomainValidationError("Order item ID is required");
    }

    const existingBackorder = await this.backorderRepository.findByOrderItemId(
      params.orderItemId,
    );
    if (existingBackorder) {
      throw new BackorderAlreadyExistsError(params.orderItemId);
    }

    if (params.promisedEta && params.promisedEta < new Date()) {
      throw new DomainValidationError("Promised ETA cannot be in the past");
    }

    const backorder = Backorder.create({
      orderItemId: params.orderItemId,
      promisedEta: params.promisedEta,
    });

    await this.backorderRepository.save(backorder);

    return Backorder.toDTO(backorder);
  }

  async getBackorderByOrderItemId(
    orderItemId: string,
  ): Promise<BackorderDTO | null> {
    if (!orderItemId || orderItemId.trim().length === 0) {
      throw new DomainValidationError("Order item ID is required");
    }

    const backorder =
      await this.backorderRepository.findByOrderItemId(orderItemId);
    return backorder ? Backorder.toDTO(backorder) : null;
  }

  async getAllBackorders(
    options?: BackorderQueryOptions,
  ): Promise<BackorderDTO[]> {
    const backorders = await this.backorderRepository.findAll(options);
    return backorders.map((b) => Backorder.toDTO(b));
  }

  async getNotifiedBackorders(
    options?: BackorderQueryOptions,
  ): Promise<BackorderDTO[]> {
    const backorders = await this.backorderRepository.findNotified(options);
    return backorders.map((b) => Backorder.toDTO(b));
  }

  async getUnnotifiedBackorders(
    options?: BackorderQueryOptions,
  ): Promise<BackorderDTO[]> {
    const backorders = await this.backorderRepository.findUnnotified(options);
    return backorders.map((b) => Backorder.toDTO(b));
  }

  async getBackordersOverdue(
    options?: BackorderQueryOptions,
  ): Promise<BackorderDTO[]> {
    const now = new Date();
    const backorders = await this.backorderRepository.findByPromisedEtaBefore(
      now,
      options,
    );
    return backorders.map((b) => Backorder.toDTO(b));
  }

  async getBackordersByEtaBefore(
    date: Date,
    options?: BackorderQueryOptions,
  ): Promise<BackorderDTO[]> {
    if (!date) {
      throw new DomainValidationError("Date is required");
    }

    const backorders = await this.backorderRepository.findByPromisedEtaBefore(
      date,
      options,
    );
    return backorders.map((b) => Backorder.toDTO(b));
  }

  async updatePromisedEta(
    orderItemId: string,
    eta: Date,
  ): Promise<BackorderDTO> {
    if (!eta) {
      throw new DomainValidationError("Promised ETA is required");
    }

    const backorder =
      await this.backorderRepository.findByOrderItemId(orderItemId);
    if (!backorder) throw new BackorderNotFoundError(orderItemId);

    backorder.updatePromisedEta(eta);
    await this.backorderRepository.save(backorder);

    return Backorder.toDTO(backorder);
  }

  async markAsNotified(orderItemId: string): Promise<BackorderDTO> {
    const backorder =
      await this.backorderRepository.findByOrderItemId(orderItemId);
    if (!backorder) throw new BackorderNotFoundError(orderItemId);

    backorder.markAsNotified();
    await this.backorderRepository.save(backorder);

    return Backorder.toDTO(backorder);
  }

  async notifyMultipleBackorders(
    orderItemIds: string[],
  ): Promise<BackorderDTO[]> {
    if (!orderItemIds || orderItemIds.length === 0) {
      throw new DomainValidationError("At least one order item ID is required");
    }

    const backorders = await Promise.all(
      orderItemIds.map((id) => this.backorderRepository.findByOrderItemId(id)),
    );

    const toNotify = backorders.filter(
      (b): b is Backorder => b !== null && !b.isCustomerNotified(),
    );

    toNotify.forEach((b) => b.markAsNotified());

    await Promise.all(toNotify.map((b) => this.backorderRepository.save(b)));

    return toNotify.map((b) => Backorder.toDTO(b));
  }

  async deleteBackorder(orderItemId: string): Promise<void> {
    const exists = await this.backorderRepository.exists(orderItemId);
    if (!exists) throw new BackorderNotFoundError(orderItemId);

    await this.backorderRepository.delete(orderItemId);
  }

  async getBackorderCount(): Promise<number> {
    return this.backorderRepository.count();
  }

  async getNotifiedCount(): Promise<number> {
    return this.backorderRepository.countNotified();
  }

  async getUnnotifiedCount(): Promise<number> {
    return this.backorderRepository.countUnnotified();
  }

  async getOverdueCount(): Promise<number> {
    return this.backorderRepository.countByPromisedEtaBefore(new Date());
  }

  async backorderExists(orderItemId: string): Promise<boolean> {
    if (!orderItemId || orderItemId.trim().length === 0) {
      throw new DomainValidationError("Order item ID is required");
    }

    return this.backorderRepository.exists(orderItemId);
  }

  async isBackorderOverdue(orderItemId: string): Promise<boolean> {
    const backorder =
      await this.backorderRepository.findByOrderItemId(orderItemId);
    if (!backorder) {
      return false;
    }

    const promisedEta = backorder.promisedEta;
    if (!promisedEta) {
      return false;
    }

    return promisedEta < new Date();
  }
}
