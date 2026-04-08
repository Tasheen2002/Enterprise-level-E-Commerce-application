import { ICommand } from "@/api/src/shared/application";

export interface UpdateProductVariantCommand extends ICommand {
  variantId: string;
  sku?: string;
  size?: string;
  color?: string;
  barcode?: string;
  weightG?: number;
  dims?: {
    length?: number;
    width?: number;
    height?: number;
  };
  taxClass?: string;
  allowBackorder?: boolean;
  allowPreorder?: boolean;
  restockEta?: Date;
}
