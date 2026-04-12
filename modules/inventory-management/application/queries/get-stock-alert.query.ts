import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { StockAlertDTO } from "../../domain/entities/stock-alert.entity";
import { StockAlertService } from "../services/stock-alert.service";

export interface GetStockAlertQuery extends IQuery {
  alertId: string;
}

export type StockAlertResult = StockAlertDTO;

export class GetStockAlertHandler implements IQueryHandler<
  GetStockAlertQuery,
  QueryResult<StockAlertResult>
> {
  constructor(private readonly stockAlertService: StockAlertService) {}

  async handle(query: GetStockAlertQuery): Promise<QueryResult<StockAlertResult>> {
    const alert = await this.stockAlertService.getStockAlert(query.alertId);
    return QueryResult.success(alert);
  }
}
