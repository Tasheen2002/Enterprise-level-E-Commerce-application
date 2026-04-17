import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { StockAlertResult } from "./get-stock-alert.query";
import { StockAlertService } from "../services/stock-alert.service";

export interface GetActiveAlertsQuery extends IQuery {}

export class GetActiveAlertsHandler implements IQueryHandler<
  GetActiveAlertsQuery,
  StockAlertResult[]
> {
  constructor(private readonly stockAlertService: StockAlertService) {}

  async handle(): Promise<StockAlertResult[]> {
    return this.stockAlertService.getActiveAlerts();
  }
}
