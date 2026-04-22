import { PrismaClient, Prisma, LocationTypeEnum } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { PaginatedResult } from "../../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { Location } from "../../../domain/entities/location.entity";
import { LocationId } from "../../../domain/value-objects/location-id.vo";
import {
  LocationType,
  LocationTypeVO,
} from "../../../domain/value-objects/location-type.vo";
import { LocationAddress } from "../../../domain/value-objects/location-address.vo";
import { ILocationRepository } from "../../../domain/repositories/location.repository";

export class LocationRepositoryImpl
  extends PrismaRepository<Location>
  implements ILocationRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private toEntity(row: {
    id: string;
    type: string;
    name: string;
    address: unknown;
  }): Location {
    const fallbackDate = new Date(0);
    return Location.fromPersistence({
      locationId: LocationId.fromString(row.id),
      type: LocationTypeVO.create(row.type),
      name: row.name,
      address: row.address
        ? LocationAddress.create(row.address as Record<string, unknown>)
        : undefined,
      createdAt: fallbackDate,
      updatedAt: fallbackDate,
    });
  }

  async save(location: Location): Promise<void> {
    await this.prisma.location.upsert({
      where: { id: location.locationId.getValue() },
      create: {
        id: location.locationId.getValue(),
        type: location.type.getValue() as LocationTypeEnum,
        name: location.name,
        address: (location.address?.getValue() ??
          null) as Prisma.InputJsonValue,
      },
      update: {
        type: location.type.getValue() as LocationTypeEnum,
        name: location.name,
        address: (location.address?.getValue() ??
          null) as Prisma.InputJsonValue,
      },
    });

    await this.dispatchEvents(location);
  }

  async findById(locationId: LocationId): Promise<Location | null> {
    const row = await this.prisma.location.findUnique({
      where: { id: locationId.getValue() },
    });

    return row ? this.toEntity(row) : null;
  }

  async delete(locationId: LocationId): Promise<void> {
    const row = await this.prisma.location.findUnique({
      where: { id: locationId.getValue() },
    });

    if (row) {
      const location = this.toEntity(row);
      location.markDeleted();
      await this.dispatchEvents(location);
    }

    await this.prisma.location.delete({
      where: { id: locationId.getValue() },
    });
  }

  async findByType(type: LocationType): Promise<Location[]> {
    const rows = await this.prisma.location.findMany({
      where: { type: type as LocationTypeEnum },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async findByName(name: string): Promise<Location | null> {
    const row = await this.prisma.location.findFirst({
      where: { name },
    });

    return row ? this.toEntity(row) : null;
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResult<Location>> {
    const { limit = 50, offset = 0 } = options || {};

    const [rows, total] = await Promise.all([
      this.prisma.location.findMany({
        take: limit,
        skip: offset,
        orderBy: { name: "asc" },
      }),
      this.prisma.location.count(),
    ]);

    const items = rows.map((r) => this.toEntity(r));
    return {
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    };
  }

  async exists(locationId: LocationId): Promise<boolean> {
    const count = await this.prisma.location.count({
      where: { id: locationId.getValue() },
    });

    return count > 0;
  }

  async existsByName(name: string): Promise<boolean> {
    const count = await this.prisma.location.count({
      where: { name },
    });

    return count > 0;
  }
}
