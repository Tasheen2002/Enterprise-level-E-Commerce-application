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
} from "../../domain/errors/order-management.errors";
import { OrderItemId } from "../../domain/value-objects/order-item-id.vo";

interface CreateBackorderParams {
  orderItemId: string;
  promisedEta?: Date;
}

interface NotifyMultipleResult {
  notified: BackorderDTO[];
  skipped: { orderItemId: string; reason: "not_found" | "already_notified" }[];
}

export class BackorderManagementService {
  constructor(private readonly backorderRepository: IBackorderRepository) {}

  async createBackorder(params: CreateBackorderParams): Promise<BackorderDTO> {
    // OrderItemId.fromString() validates non-empty UUID format via the VO base class.
    const orderItemId = OrderItemId.fromString(params.orderItemId);

    const existing = await this.backorderRepository.findByOrderItemId(orderItemId);
    if (existing) {
      throw new BackorderAlreadyExistsError(orderItemId.getValue());
    }

    // ETA validity (must be in the future) is enforced by Backorder.create().
    const backorder = Backorder.create({
      orderItemId,
      promisedEta: params.promisedEta,
    });

    await this.backorderRepository.save(backorder);
    return Backorder.toDTO(backorder);
  }

  async getBackorderByOrderItemId(
    orderItemId: string,
  ): Promise<BackorderDTO | null> {
    const backorder = await this.backorderRepository.findByOrderItemId(
      OrderItemId.fromString(orderItemId),
    );
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
    const backorders = await this.backorderRepository.findByPromisedEtaBefore(
      new Date(),
      options,
    );
    return backorders.map((b) => Backorder.toDTO(b));
  }

  async getBackordersByEtaBefore(
    date: Date,
    options?: BackorderQueryOptions,
  ): Promise<BackorderDTO[]> {
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
    const id = OrderItemId.fromString(orderItemId);
    const backorder = await this.backorderRepository.findByOrderItemId(id);
    if (!backorder) throw new BackorderNotFoundError(id.getValue());

    backorder.updatePromisedEta(eta);
    await this.backorderRepository.save(backorder);
    return Backorder.toDTO(backorder);
  }

  async markAsNotified(orderItemId: string): Promise<BackorderDTO> {
    const id = OrderItemId.fromString(orderItemId);
    const backorder = await this.backorderRepository.findByOrderItemId(id);
    if (!backorder) throw new BackorderNotFoundError(id.getValue());

    backorder.markAsNotified();
    await this.backorderRepository.save(backorder);
    return Backorder.toDTO(backorder);
  }

  async notifyMultipleBackorders(
    orderItemIds: string[],
  ): Promise<NotifyMultipleResult> {
    if (orderItemIds.length === 0) {
      return { notified: [], skipped: [] };
    }

    const validIds = orderItemIds.map((id) => OrderItemId.fromString(id));

    const fetched = await Promise.all(
      validIds.map(async (id) => ({
        id,
        backorder: await this.backorderRepository.findByOrderItemId(id),
      })),
    );

    const skipped: NotifyMultipleResult["skipped"] = [];
    const toNotify: Backorder[] = [];

    for (const { id, backorder } of fetched) {
      if (!backorder) {
        skipped.push({ orderItemId: id.getValue(), reason: "not_found" });
        continue;
      }
      if (backorder.isCustomerNotified()) {
        skipped.push({ orderItemId: id.getValue(), reason: "already_notified" });
        continue;
      }
      backorder.markAsNotified();
      toNotify.push(backorder);
    }

    await Promise.all(toNotify.map((b) => this.backorderRepository.save(b)));

    return {
      notified: toNotify.map((b) => Backorder.toDTO(b)),
      skipped,
    };
  }

  async deleteBackorder(orderItemId: string): Promise<void> {
    const id = OrderItemId.fromString(orderItemId);
    const exists = await this.backorderRepository.exists(id);
    if (!exists) throw new BackorderNotFoundError(id.getValue());

    await this.backorderRepository.delete(id);
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
    return this.backorderRepository.exists(OrderItemId.fromString(orderItemId));
  }

  async isBackorderOverdue(orderItemId: string): Promise<boolean> {
    const backorder = await this.backorderRepository.findByOrderItemId(
      OrderItemId.fromString(orderItemId),
    );
    if (!backorder?.promisedEta) return false;
    return backorder.promisedEta < new Date();
  }
}
