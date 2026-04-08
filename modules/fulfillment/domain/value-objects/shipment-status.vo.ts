export enum ShipmentStatusEnum {
  CREATED = "created",
  LABEL_PRINTED = "label_printed",
  IN_TRANSIT = "in_transit",
  DELIVERED = "delivered",
  FAILED = "failed",
}

export class ShipmentStatus {
  private readonly value: ShipmentStatusEnum;

  private constructor(value: ShipmentStatusEnum) {
    this.value = value;
  }

  static create(value: string): ShipmentStatus {
    const normalizedValue = value.toLowerCase();

    if (
      !Object.values(ShipmentStatusEnum).includes(
        normalizedValue as ShipmentStatusEnum
      )
    ) {
      throw new Error(`Invalid shipment status: ${value}`);
    }

    return new ShipmentStatus(normalizedValue as ShipmentStatusEnum);
  }

  static created(): ShipmentStatus {
    return new ShipmentStatus(ShipmentStatusEnum.CREATED);
  }

  static labelPrinted(): ShipmentStatus {
    return new ShipmentStatus(ShipmentStatusEnum.LABEL_PRINTED);
  }

  static inTransit(): ShipmentStatus {
    return new ShipmentStatus(ShipmentStatusEnum.IN_TRANSIT);
  }

  static delivered(): ShipmentStatus {
    return new ShipmentStatus(ShipmentStatusEnum.DELIVERED);
  }

  static failed(): ShipmentStatus {
    return new ShipmentStatus(ShipmentStatusEnum.FAILED);
  }

  getValue(): ShipmentStatusEnum {
    return this.value;
  }

  isCreated(): boolean {
    return this.value === ShipmentStatusEnum.CREATED;
  }

  isLabelPrinted(): boolean {
    return this.value === ShipmentStatusEnum.LABEL_PRINTED;
  }

  isInTransit(): boolean {
    return this.value === ShipmentStatusEnum.IN_TRANSIT;
  }

  isDelivered(): boolean {
    return this.value === ShipmentStatusEnum.DELIVERED;
  }

  isFailed(): boolean {
    return this.value === ShipmentStatusEnum.FAILED;
  }

  canTransitionTo(newStatus: ShipmentStatus): boolean {
    const transitions: Record<ShipmentStatusEnum, ShipmentStatusEnum[]> = {
      [ShipmentStatusEnum.CREATED]: [
        ShipmentStatusEnum.LABEL_PRINTED,
        ShipmentStatusEnum.FAILED,
      ],
      [ShipmentStatusEnum.LABEL_PRINTED]: [
        ShipmentStatusEnum.IN_TRANSIT,
        ShipmentStatusEnum.FAILED,
      ],
      [ShipmentStatusEnum.IN_TRANSIT]: [
        ShipmentStatusEnum.DELIVERED,
        ShipmentStatusEnum.FAILED,
      ],
      [ShipmentStatusEnum.DELIVERED]: [],
      [ShipmentStatusEnum.FAILED]: [ShipmentStatusEnum.CREATED],
    };

    return transitions[this.value].includes(newStatus.value);
  }

  equals(other: ShipmentStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
