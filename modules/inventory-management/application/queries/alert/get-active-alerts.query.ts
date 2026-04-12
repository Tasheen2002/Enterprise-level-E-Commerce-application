import { IQuery, IQueryHandler, QueryResult } from "../../../../../packages/core/src/application/cqrs";
import { StockAlertResult } from "./get-stock-alert.query";
import { StockAlertService } from "../../services/stock-alert.service";

export interface GetActiveAlertsQuery extends IQuery {}

export class GetActiveAlertsHandler implements IQueryHandler<
  GetActiveAlertsQuery,
  QueryResult<StockAlertResult[]>
> {
  constructor(private readonly stockAlertService: StockAlertService) {}

  async handle(_query: GetActiveAlertsQuery): Promise<QueryResult<StockAlertResult[]>> {
    const alerts = await this.stockAlertService.getActiveAlerts();
    return QueryResult.success(alerts);
  }
}
