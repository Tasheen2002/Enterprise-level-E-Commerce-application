import { PrismaClient } from "@prisma/client";
import {
  Location,
  LocationAddress,
} from "../../../domain/entities/location.entity";
import { LocationId } from "../../../domain/value-objects/location-id.vo";
import {
  LocationType,
  LocationTypeVO,
} from "../../../domain/value-objects/location-type.vo";
import { ILocationRepository } from "../../../domain/repositories/location.repository";

interface LocationDatabaseRow {
  id: string;
  type: string;
  name: string;
  address?: any;
}

export class LocationRepositoryImpl implements ILocationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toEntity(row: LocationDatabaseRow): Location {
    return Location.reconstitute({
      locationId: LocationId.create(row.id),
      type: LocationTypeVO.create(row.type),
      name: row.name,
      address: row.address as LocationAddress | undefined,
    });
  }

  async save(location: Location): Promise<void> {
    await this.prisma.location.upsert({
      where: { id: location.getLocationId().getValue() },
      create: {
        id: location.getLocationId().getValue(),
        type: location.getType().getValue() as any,
        name: location.getName(),
        address: location.getAddress() as any,
      },
      update: {
        type: location.getType().getValue() as any,
        name: location.getName(),
        address: location.getAddress() as any,
      },
    });
  }

  async findById(locationId: LocationId): Promise<Location | null> {
    const location = await this.prisma.location.findUnique({
      where: { id: locationId.getValue() },
    });

    if (!location) {
      return null;
    }

    return this.toEntity(location as LocationDatabaseRow);
  }

  async delete(locationId: LocationId): Promise<void> {
    await this.prisma.location.delete({
      where: { id: locationId.getValue() },
    });
  }

  async findByType(type: LocationType): Promise<Location[]> {
    const locations = await this.prisma.location.findMany({
      where: { type: type as any },
    });

    return locations.map((location) =>
      this.toEntity(location as LocationDatabaseRow),
    );
  }

  async findByName(name: string): Promise<Location | null> {
    const location = await this.prisma.location.findFirst({
      where: { name },
    });

    if (!location) {
      return null;
    }

    return this.toEntity(location as LocationDatabaseRow);
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<{ locations: Location[]; total: number }> {
    const { limit = 50, offset = 0 } = options || {};

    const [locations, total] = await Promise.all([
      this.prisma.location.findMany({
        take: limit,
        skip: offset,
        orderBy: { name: "asc" },
      }),
      this.prisma.location.count(),
    ]);

    return {
      locations: locations.map((location) =>
        this.toEntity(location as LocationDatabaseRow),
      ),
      total,
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
