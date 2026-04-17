import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { StockAlertDTO } from "../../domain/entities/stock-alert.entity";
import { StockAlertService } from "../services/stock-alert.service";

export interface GetStockAlertQuery extends IQuery {
  readonly alertId: string;
}

export type StockAlertResult = StockAlertDTO;

export class GetStockAlertHandler implements IQueryHandler<
  GetStockAlertQuery,
  StockAlertResult
> {
  constructor(private readonly stockAlertService: StockAlertService) {}

  async handle(query: GetStockAlertQuery): Promise<StockAlertResult> {
    return this.stockAlertService.getStockAlert(query.alertId);
  }
}
