import {
  IPreorderRepository,
  PreorderQueryOptions,
} from "../../domain/repositories/preorder.repository";
import { Preorder, PreorderDTO } from "../../domain/entities/preorder.entity";
import {
  PreorderNotFoundError,
  PreorderAlreadyExistsError,
} from "../../domain/errors/order-management.errors";
import { OrderItemId } from "../../domain/value-objects/order-item-id.vo";

interface CreatePreorderParams {
  orderItemId: string;
  releaseDate?: Date;
}

interface NotifyMultipleResult {
  notified: PreorderDTO[];
  skipped: { orderItemId: string; reason: "not_found" | "already_notified" }[];
}

export class PreorderManagementService {
  constructor(private readonly preorderRepository: IPreorderRepository) {}

  async createPreorder(params: CreatePreorderParams): Promise<PreorderDTO> {
    // OrderItemId.fromString() validates non-empty UUID format via VO base class.
    const orderItemId = OrderItemId.fromString(params.orderItemId);

    const existing = await this.preorderRepository.findByOrderItemId(orderItemId);
    if (existing) {
      throw new PreorderAlreadyExistsError(orderItemId.getValue());
    }

    // Future-only releaseDate is enforced by Preorder.create().
    const preorder = Preorder.create({
      orderItemId,
      releaseDate: params.releaseDate,
    });

    await this.preorderRepository.save(preorder);
    return Preorder.toDTO(preorder);
  }

  async getPreorderByOrderItemId(
    orderItemId: string,
  ): Promise<PreorderDTO | null> {
    const preorder = await this.preorderRepository.findByOrderItemId(
      OrderItemId.fromString(orderItemId),
    );
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
    const preorders = await this.preorderRepository.findByReleaseDateBefore(
      date,
      options,
    );
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
    const id = OrderItemId.fromString(orderItemId);
    const preorder = await this.preorderRepository.findByOrderItemId(id);
    if (!preorder) throw new PreorderNotFoundError(id.getValue());

    preorder.updateReleaseDate(releaseDate);
    await this.preorderRepository.save(preorder);
    return Preorder.toDTO(preorder);
  }

  async markAsNotified(orderItemId: string): Promise<PreorderDTO> {
    const id = OrderItemId.fromString(orderItemId);
    const preorder = await this.preorderRepository.findByOrderItemId(id);
    if (!preorder) throw new PreorderNotFoundError(id.getValue());

    preorder.markAsNotified();
    await this.preorderRepository.save(preorder);
    return Preorder.toDTO(preorder);
  }

  
  async notifyMultiplePreorders(
    orderItemIds: string[],
  ): Promise<NotifyMultipleResult> {
    if (orderItemIds.length === 0) {
      return { notified: [], skipped: [] };
    }

    const validIds = orderItemIds.map((id) => OrderItemId.fromString(id));

    const fetched = await Promise.all(
      validIds.map(async (id) => ({
        id,
        preorder: await this.preorderRepository.findByOrderItemId(id),
      })),
    );

    const skipped: NotifyMultipleResult["skipped"] = [];
    const toNotify: Preorder[] = [];

    for (const { id, preorder } of fetched) {
      if (!preorder) {
        skipped.push({ orderItemId: id.getValue(), reason: "not_found" });
        continue;
      }
      if (preorder.isCustomerNotified()) {
        skipped.push({ orderItemId: id.getValue(), reason: "already_notified" });
        continue;
      }
      preorder.markAsNotified();
      toNotify.push(preorder);
    }

    await Promise.all(toNotify.map((p) => this.preorderRepository.save(p)));

    return {
      notified: toNotify.map((p) => Preorder.toDTO(p)),
      skipped,
    };
  }

  async notifyReleasedPreorders(): Promise<PreorderDTO[]> {
    const released = await this.preorderRepository.findReleased();
    const toNotify = released.filter((p) => !p.isCustomerNotified());

    toNotify.forEach((p) => p.markAsNotified());
    await Promise.all(toNotify.map((p) => this.preorderRepository.save(p)));

    return toNotify.map((p) => Preorder.toDTO(p));
  }

  async deletePreorder(orderItemId: string): Promise<void> {
    const id = OrderItemId.fromString(orderItemId);
    const exists = await this.preorderRepository.exists(id);
    if (!exists) throw new PreorderNotFoundError(id.getValue());

    await this.preorderRepository.delete(id);
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
    return this.preorderRepository.exists(OrderItemId.fromString(orderItemId));
  }

  async isPreorderReleased(orderItemId: string): Promise<boolean> {
    const preorder = await this.preorderRepository.findByOrderItemId(
      OrderItemId.fromString(orderItemId),
    );
    return preorder?.isReleased() ?? false;
  }
}
