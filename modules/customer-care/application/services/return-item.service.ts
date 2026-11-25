import {
  IReturnItemRepository,
  ReturnItemFilterOptions,
} from "../../domain/repositories/return-item.repository.js";
import { IReturnRequestRepository } from "../../domain/repositories/return-request.repository.js";
import { IExternalOrderQueryPort } from "../../domain/external-services.js";
import { ReturnItem } from "../../domain/entities/return-item.entity.js";
import {
  ItemCondition,
  ItemDisposition,
  Money,
  RmaId,
} from "../../domain/value-objects/index.js";

export class ReturnItemService {
  constructor(
    private readonly itemRepository: IReturnItemRepository,
    private readonly returnRequestRepository: IReturnRequestRepository,
    private readonly orderQueryPort: IExternalOrderQueryPort,
  ) {}

  /**
   * A return may only contain items of its own order, never more of an item
   * than was ordered across all returns that were not rejected, and only
   * until the goods have arrived.
   */
  private async assertReturnable(
    rmaId: string,
    orderItemId: string,
    quantity: number
  ): Promise<void> {
    const returnRequest = await this.returnRequestRepository.findById(RmaId.create(rmaId));
    if (!returnRequest) {
      throw new Error("Return request not found");
    }
    if (!returnRequest.getStatus().allowsItemChanges()) {
      throw new Error(
        `Items cannot be changed once a return is ${returnRequest.getStatus().getValue()}`
      );
    }
    const orderId = returnRequest.getOrderId();
    const ordered = await this.orderQueryPort.findOrderItemQuantities(orderId);
    if (!ordered) {
      throw new Error("Order not found");
    }
    if (!(orderItemId in ordered)) {
      throw new Error(
        `Order item ${orderItemId} does not belong to order ${orderId}. This action is not allowed.`
      );
    }
    let returnedElsewhere = 0;
    for (const other of await this.itemRepository.findByOrderItemId(orderItemId)) {
      if (other.getRmaId() === rmaId) continue;
      const otherReturn = await this.returnRequestRepository.findById(RmaId.create(other.getRmaId()));
      if (otherReturn && !otherReturn.getStatus().isRejected()) {
        returnedElsewhere += other.getQuantity();
      }
    }
    const available = ordered[orderItemId] - returnedElsewhere;
    if (quantity > available) {
      throw new Error(
        `Only ${Math.max(available, 0)} of order item ${orderItemId} can still be returned`
      );
    }
  }

  async createItem(data: {
    rmaId: string;
    orderItemId: string;
    quantity: number;
    condition?: ItemCondition;
    disposition?: ItemDisposition;
    fees?: number;
    currency?: string;
  }): Promise<ReturnItem> {
    if (await this.itemRepository.findById(data.rmaId, data.orderItemId)) {
      throw new Error(`Order item ${data.orderItemId} is already in this return`);
    }
    await this.assertReturnable(data.rmaId, data.orderItemId, data.quantity);

    const item = ReturnItem.create({
      rmaId: data.rmaId,
      orderItemId: data.orderItemId,
      quantity: data.quantity,
      condition: data.condition,
      disposition: data.disposition,
      fees:
        data.fees !== undefined
          ? Money.create(data.fees, data.currency)
          : undefined,
    });

    await this.itemRepository.save(item);
    return item;
  }

  async getItem(
    rmaId: string,
    orderItemId: string
  ): Promise<ReturnItem | null> {
    return await this.itemRepository.findById(rmaId, orderItemId);
  }

  async updateItem(
    rmaId: string,
    orderItemId: string,
    data: {
      quantity?: number;
      condition?: ItemCondition;
      disposition?: ItemDisposition;
      fees?: number;
      currency?: string;
    }
  ): Promise<void> {
    const item = await this.itemRepository.findById(rmaId, orderItemId);

    if (!item) {
      throw new Error(
        `Return item not found for rmaId=${rmaId}, orderItemId=${orderItemId}`
      );
    }

    if (data.quantity !== undefined) {
      await this.assertReturnable(rmaId, orderItemId, data.quantity);
      item.updateQuantity(data.quantity);
    }
    if (data.condition) {
      item.setCondition(data.condition);
    }
    if (data.disposition) {
      item.setDisposition(data.disposition);
    }
    if (data.fees !== undefined) {
      item.setFees(Money.create(data.fees, data.currency));
    }

    await this.itemRepository.update(item);
  }

  async deleteItem(rmaId: string, orderItemId: string): Promise<void> {
    const exists = await this.itemRepository.exists(rmaId, orderItemId);

    if (!exists) {
      throw new Error(
        `Return item not found for rmaId=${rmaId}, orderItemId=${orderItemId}`
      );
    }

    await this.itemRepository.delete(rmaId, orderItemId);
  }

  async getItemsByRmaId(rmaId: string): Promise<ReturnItem[]> {
    return await this.itemRepository.findByRmaId(rmaId);
  }

  async getItemsByOrderItemId(orderItemId: string): Promise<ReturnItem[]> {
    return await this.itemRepository.findByOrderItemId(orderItemId);
  }

  async getItemsWithFilters(
    filters: ReturnItemFilterOptions
  ): Promise<ReturnItem[]> {
    return await this.itemRepository.findWithFilters(filters);
  }

  async getAllItems(): Promise<ReturnItem[]> {
    return await this.itemRepository.findAll();
  }

  async getItemsByCondition(condition: ItemCondition): Promise<ReturnItem[]> {
    return await this.itemRepository.findByCondition(condition);
  }

  async getItemsByDisposition(
    disposition: ItemDisposition
  ): Promise<ReturnItem[]> {
    return await this.itemRepository.findByDisposition(disposition);
  }

  async getItemsForRestock(rmaId?: string): Promise<ReturnItem[]> {
    return await this.itemRepository.findItemsForRestock(rmaId);
  }

  async getItemsForRepair(rmaId?: string): Promise<ReturnItem[]> {
    return await this.itemRepository.findItemsForRepair(rmaId);
  }

  async getItemsForDiscard(rmaId?: string): Promise<ReturnItem[]> {
    return await this.itemRepository.findItemsForDiscard(rmaId);
  }

  async getItemsWithFees(rmaId?: string): Promise<ReturnItem[]> {
    return await this.itemRepository.findItemsWithFees(rmaId);
  }

  async countItemsByRmaId(rmaId: string): Promise<number> {
    return await this.itemRepository.countByRmaId(rmaId);
  }

  async countItemsByCondition(condition: ItemCondition): Promise<number> {
    return await this.itemRepository.countByCondition(condition);
  }

  async countItemsByDisposition(disposition: ItemDisposition): Promise<number> {
    return await this.itemRepository.countByDisposition(disposition);
  }

  async countItems(filters?: ReturnItemFilterOptions): Promise<number> {
    return await this.itemRepository.count(filters);
  }

  async itemExists(rmaId: string, orderItemId: string): Promise<boolean> {
    return await this.itemRepository.exists(rmaId, orderItemId);
  }

  async hasItemsForRma(rmaId: string): Promise<boolean> {
    return await this.itemRepository.hasItemsForRma(rmaId);
  }

  async saveAllItems(items: ReturnItem[]): Promise<void> {
    await this.itemRepository.saveAll(items);
  }

  async deleteByRmaId(rmaId: string): Promise<void> {
    await this.itemRepository.deleteByRmaId(rmaId);
  }
}
