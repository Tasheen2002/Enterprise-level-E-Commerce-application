import { ICommand } from "@/api/src/shared/application";
import { Stock } from "../../../domain/entities/stock.entity";

export interface TransferStockCommand extends ICommand {
  variantId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
}

export interface TransferStockResult {
  fromStock: Stock;
  toStock: Stock;
}
