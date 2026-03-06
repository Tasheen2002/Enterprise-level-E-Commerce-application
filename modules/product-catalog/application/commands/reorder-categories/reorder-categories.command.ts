import { ICommand } from "@/api/src/shared/application";

export interface ReorderCategoriesCommand extends ICommand {
  categoryOrders: Array<{ id: string; position: number }>;
}
