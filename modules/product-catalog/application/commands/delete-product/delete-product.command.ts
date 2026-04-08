import { ICommand } from "@/api/src/shared/application";

export interface DeleteProductCommand extends ICommand {
  productId: string;
}
