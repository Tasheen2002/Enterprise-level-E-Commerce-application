import { ICommand } from "@/api/src/shared/application";
import { PromoData } from '../../../domain/value-objects/applied-promos.vo';

export interface AddToCartCommand extends ICommand {
  cartId?: string;
  userId?: string;
  guestToken?: string;
  variantId: string;
  quantity: number;
  appliedPromos?: PromoData[];
  isGift?: boolean;
  giftMessage?: string;
}
