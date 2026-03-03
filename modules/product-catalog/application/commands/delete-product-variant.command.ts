import { ICommand } from "@/api/src/shared/application";

export interface DeleteProductVariantCommand extends ICommand {
  variantId: string;
}
