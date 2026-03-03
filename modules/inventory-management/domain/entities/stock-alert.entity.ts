import { AlertId } from "../value-objects/alert-id.vo";
import { AlertTypeVO } from "../value-objects/alert-type.vo";
import { InvalidOperationError } from "../errors";

export interface StockAlertProps {
  alertId: AlertId;
  variantId: string;
  type: AlertTypeVO;
  triggeredAt: Date;
  resolvedAt?: Date;
}

export class StockAlert {
  private constructor(private readonly props: StockAlertProps) {}

  static create(props: StockAlertProps): StockAlert {
    return new StockAlert(props);
  }

  static reconstitute(props: StockAlertProps): StockAlert {
    return new StockAlert(props);
  }

  getAlertId(): AlertId {
    return this.props.alertId;
  }

  getVariantId(): string {
    return this.props.variantId;
  }

  getType(): AlertTypeVO {
    return this.props.type;
  }

  getTriggeredAt(): Date {
    return this.props.triggeredAt;
  }

  getResolvedAt(): Date | undefined {
    return this.props.resolvedAt;
  }

  isResolved(): boolean {
    return this.props.resolvedAt !== undefined;
  }

  resolve(resolvedAt: Date): StockAlert {
    if (this.isResolved()) {
      throw new InvalidOperationError("Alert is already resolved");
    }
    return new StockAlert({
      ...this.props,
      resolvedAt,
    });
  }

  toJSON() {
    return {
      alertId: this.props.alertId.getValue(),
      variantId: this.props.variantId,
      type: this.props.type.getValue(),
      triggeredAt: this.props.triggeredAt,
      resolvedAt: this.props.resolvedAt,
      isResolved: this.isResolved(),
    };
  }
}
