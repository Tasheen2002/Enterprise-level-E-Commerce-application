import type { uuidCases } from "./uuid-wrapper-cases";
import { UserId } from "../../../modules/user-management/domain/value-objects/user-id.vo";
import { VariantId } from "../../../modules/product-catalog/domain/value-objects/variant-id.vo";
import { ReservationId as CartReservationId } from "../../../modules/cart/domain/value-objects/reservation-id.vo";
import { ReservationId as PickupReservationId } from "../../../modules/inventory-management/domain/value-objects/reservation-id.vo";
import type { IProductVariantRepository } from "../../../modules/product-catalog/domain/repositories/product-variant.repository";
import type { IReservationRepository } from "../../../modules/cart/domain/repositories/reservation.repository";
import type { UuidId } from "../src";

type Case = (typeof uuidCases)[number];
type Ids = { [C in Case as C["name"]]: ReturnType<C["type"]["create"]> };
type CrossAssignablePairs = {
  [Left in keyof Ids]: {
    [Right in keyof Ids]: Left extends Right
      ? never
      : Ids[Left] extends Ids[Right]
        ? `${Left}->${Right}`
        : never;
  }[keyof Ids];
}[keyof Ids];
type AssertNever<T extends never> = T;
// Exhaustive directed check: no distinct wrapper can be assigned to another wrapper.
export type EveryIdIsDistinct = AssertNever<CrossAssignablePairs>;
type IncorrectFactoryPairs = {
  [C in Case as C["name"]]: ReturnType<C["type"]["fromString"]> extends ReturnType<
    C["type"]["create"]
  >
    ? never
    : C["name"];
}[Case["name"]];
export type FactoriesRetainTheirType = AssertNever<IncorrectFactoryPairs>;

export function repositoryBoundaries(
  variants: IProductVariantRepository,
  reservations: IReservationRepository,
) {
  const user = UserId.create();
  const variant = VariantId.create();
  const cart = CartReservationId.create();
  const pickup = PickupReservationId.create();
  void variants.findById(variant);
  void reservations.findById(cart);
  // @ts-expect-error A user identifier cannot address a product variant.
  void variants.findById(user);
  // @ts-expect-error The reverse assignment is also invalid.
  const wrongUser: UserId = variant;
  // @ts-expect-error Matching display labels do not make these reservation types interchangeable.
  void reservations.findById(pickup);
  // @ts-expect-error Nor can a cart reservation become a pickup reservation.
  const wrongPickup: PickupReservationId = cart;
  return [wrongUser, wrongPickup];
}

export function baseCompatibility(id: Ids[keyof Ids]): UuidId {
  // Generic infrastructure and cross-type runtime comparisons keep their existing API.
  id.equals(UserId.create());
  return id;
}
