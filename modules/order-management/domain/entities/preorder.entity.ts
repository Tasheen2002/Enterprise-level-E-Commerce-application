export interface PreorderProps {
  orderItemId: string;
  releaseDate?: Date;
  notifiedAt?: Date;
}

export interface PreorderDatabaseRow {
  order_item_id: string;
  release_date?: Date | null;
  notified_at?: Date | null;
}

export class Preorder {
  private orderItemId: string;
  private releaseDate?: Date;
  private notifiedAt?: Date;

  private constructor(props: PreorderProps) {
    this.orderItemId = props.orderItemId;
    this.releaseDate = props.releaseDate;
    this.notifiedAt = props.notifiedAt;
  }

  static create(props: PreorderProps): Preorder {
    if (!props.orderItemId || props.orderItemId.trim().length === 0) {
      throw new Error("Order item ID is required");
    }

    if (props.releaseDate && props.releaseDate < new Date()) {
      throw new Error("Release date must be in the future");
    }

    return new Preorder(props);
  }

  static reconstitute(props: PreorderProps): Preorder {
    return new Preorder(props);
  }

  static fromDatabaseRow(row: PreorderDatabaseRow): Preorder {
    return new Preorder({
      orderItemId: row.order_item_id,
      releaseDate: row.release_date || undefined,
      notifiedAt: row.notified_at || undefined,
    });
  }

  getOrderItemId(): string {
    return this.orderItemId;
  }

  getReleaseDate(): Date | undefined {
    return this.releaseDate;
  }

  getNotifiedAt(): Date | undefined {
    return this.notifiedAt;
  }

  hasReleaseDate(): boolean {
    return !!this.releaseDate;
  }

  isCustomerNotified(): boolean {
    return !!this.notifiedAt;
  }

  isReleased(): boolean {
    return !!this.releaseDate && this.releaseDate <= new Date();
  }

  updateReleaseDate(releaseDate: Date): void {
    this.releaseDate = releaseDate;
  }

  markAsNotified(): void {
    if (this.notifiedAt) {
      throw new Error("Customer already notified");
    }

    // Validate that the item is released before notifying
    if (this.releaseDate && !this.isReleased()) {
      throw new Error("Cannot notify customer before release date");
    }

    this.notifiedAt = new Date();
  }

  equals(other: Preorder): boolean {
    return this.orderItemId === other.orderItemId;
  }

  // Utility methods
  toDatabaseRow(): PreorderDatabaseRow {
    return {
      order_item_id: this.orderItemId,
      release_date: this.releaseDate || null,
      notified_at: this.notifiedAt || null,
    };
  }

  toSnapshot(): PreorderProps {
    return {
      orderItemId: this.orderItemId,
      releaseDate: this.releaseDate,
      notifiedAt: this.notifiedAt,
    };
  }
}
