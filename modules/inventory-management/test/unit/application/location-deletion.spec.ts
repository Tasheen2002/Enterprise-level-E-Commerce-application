import { describe, expect, it, vi } from "vitest";
import { LocationManagementService } from "../../../application/services/location-management.service";
import { LocationInUseError } from "../../../domain/errors/inventory-management.errors";

const LOCATION = "00000000-0000-4000-8000-000000000010";
const stockRow = (onHand: number, reserved: number) => ({ stockLevel: { onHand, reserved } });

function fixture(stock: unknown[], reservations: Array<{ isActive: () => boolean }>) {
  const locations = { findById: vi.fn().mockResolvedValue({}), delete: vi.fn() };
  const svc = new LocationManagementService(
    locations as never,
    { findByLocation: vi.fn().mockResolvedValue(stock) } as never,
    { findByLocation: vi.fn().mockResolvedValue(reservations) } as never,
  );
  return { svc, locations };
}

describe("location deletion", () => {
  it.each([
    ["stock on hand", [stockRow(3, 0)], []],
    ["reserved stock", [stockRow(0, 2)], []],
    ["an active pickup reservation", [stockRow(0, 0)], [{ isActive: () => true }]],
  ])("refuses while the location has %s", async (_label, stock, reservations) => {
    const { svc, locations } = fixture(stock, reservations);
    await expect(svc.deleteLocation(LOCATION)).rejects.toBeInstanceOf(LocationInUseError);
    expect(locations.delete).not.toHaveBeenCalled();
  });

  it("deletes an empty location with only finished reservations", async () => {
    const { svc, locations } = fixture([stockRow(0, 0)], [{ isActive: () => false }]);
    await svc.deleteLocation(LOCATION);
    expect(locations.delete).toHaveBeenCalledOnce();
  });
});
