import {
  IShipmentItemRepository,
  ShipmentItemQueryOptions,
  ShipmentItemFilterOptions,
} from "../../domain/repositories/shipment-item.repository";
import {
  ShipmentItem,
  CreateShipmentItemData,
} from "../../domain/entities/shipment-item.entity";

export class ShipmentItemService {
  constructor(
    private readonly shipmentItemRepository: IShipmentItemRepository
  ) {}

  async getShipmentItems(shipmentId: string): Promise<ShipmentItem[]> {
    if (!shipmentId?.trim()) {
      throw new Error("Shipment ID is required");
    }

    return this.shipmentItemRepository.findByShipmentId(shipmentId);
  }

  async getShipmentItem(
    shipmentId: string,
    orderItemId: string
  ): Promise<ShipmentItem | null> {
    if (!shipmentId?.trim()) {
      throw new Error("Shipment ID is required");
    }

    if (!orderItemId?.trim()) {
      throw new Error("Order item ID is required");
    }

    return this.shipmentItemRepository.findByShipmentAndOrderItem(
      shipmentId,
      orderItemId
    );
  }

  async createShipmentItem(
    data: CreateShipmentItemData
  ): Promise<ShipmentItem> {
    const item = ShipmentItem.create(data);
    await this.shipmentItemRepository.save(item);
    return item;
  }

  async updateShipmentItemQuantity(
    shipmentId: string,
    orderItemId: string,
    newQuantity: number
  ): Promise<ShipmentItem> {
    const item = await this.getShipmentItem(shipmentId, orderItemId);

    if (!item) {
      throw new Error("Shipment item not found");
    }

    item.updateQty(newQuantity);
    await this.shipmentItemRepository.update(item);

    return item;
  }

  async updateShipmentItemGiftWrap(
    shipmentId: string,
    orderItemId: string,
    giftWrap: boolean
  ): Promise<ShipmentItem> {
    const item = await this.getShipmentItem(shipmentId, orderItemId);

    if (!item) {
      throw new Error("Shipment item not found");
    }

    item.setGiftWrap(giftWrap);
    await this.shipmentItemRepository.update(item);

    return item;
  }

  async updateShipmentItemGiftMessage(
    shipmentId: string,
    orderItemId: string,
    giftMessage?: string
  ): Promise<ShipmentItem> {
    const item = await this.getShipmentItem(shipmentId, orderItemId);

    if (!item) {
      throw new Error("Shipment item not found");
    }

    item.setGiftMessage(giftMessage);
    await this.shipmentItemRepository.update(item);

    return item;
  }

  async deleteShipmentItem(
    shipmentId: string,
    orderItemId: string
  ): Promise<void> {
    const exists = await this.shipmentItemRepository.exists(
      shipmentId,
      orderItemId
    );

    if (!exists) {
      throw new Error("Shipment item not found");
    }

    await this.shipmentItemRepository.delete(shipmentId, orderItemId);
  }

  async getGiftWrappedItems(shipmentId?: string): Promise<ShipmentItem[]> {
    return this.shipmentItemRepository.findGiftWrappedItems(shipmentId);
  }

  async getTotalQuantityByShipment(shipmentId: string): Promise<number> {
    if (!shipmentId?.trim()) {
      throw new Error("Shipment ID is required");
    }

    return this.shipmentItemRepository.getTotalQuantityByShipment(shipmentId);
  }

  async getItemsByOrderItemId(orderItemId: string): Promise<ShipmentItem[]> {
    if (!orderItemId?.trim()) {
      throw new Error("Order item ID is required");
    }

    return this.shipmentItemRepository.findByOrderItemId(orderItemId);
  }

  async listShipmentItems(
    filters: Partial<ShipmentItemFilterOptions>,
    options: Partial<ShipmentItemQueryOptions> = {}
  ): Promise<ShipmentItem[]> {
    const queryOptions: ShipmentItemQueryOptions = {
      limit: options.limit || 100,
      offset: options.offset || 0,
      sortBy: options.sortBy || "createdAt",
      sortOrder: options.sortOrder || "asc",
    };

    return this.shipmentItemRepository.findWithFilters(filters, queryOptions);
  }

  async deleteAllItemsByShipment(shipmentId: string): Promise<void> {
    if (!shipmentId?.trim()) {
      throw new Error("Shipment ID is required");
    }

    await this.shipmentItemRepository.deleteByShipmentId(shipmentId);
  }

  async countShipmentItems(
    filters?: Partial<ShipmentItemFilterOptions>
  ): Promise<number> {
    return this.shipmentItemRepository.count(filters);
  }
}
