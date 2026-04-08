import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreateLocationCommand,
  CreateLocationHandler,
  UpdateLocationCommand,
  UpdateLocationHandler,
  DeleteLocationCommand,
  DeleteLocationHandler,
  GetLocationQuery,
  GetLocationHandler,
  ListLocationsQuery,
  ListLocationsHandler,
  LocationResult,
} from "../../../application";
import { LocationManagementService } from "../../../application/services/location-management.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export interface CreateLocationBody {
  type: string;
  name: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

export interface UpdateLocationBody {
  name?: string;
  address?: any;
}

export interface ListLocationsQuerystring {
  limit?: number;
  offset?: number;
  type?: string;
}

export class LocationController {
  private createLocationHandler: CreateLocationHandler;
  private updateLocationHandler: UpdateLocationHandler;
  private deleteLocationHandler: DeleteLocationHandler;
  private getLocationHandler: GetLocationHandler;
  private listLocationsHandler: ListLocationsHandler;

  constructor(private readonly locationService: LocationManagementService) {
    // Initialize CQRS handlers
    this.createLocationHandler = new CreateLocationHandler(locationService);
    this.updateLocationHandler = new UpdateLocationHandler(locationService);
    this.deleteLocationHandler = new DeleteLocationHandler(locationService);
    this.getLocationHandler = new GetLocationHandler(locationService);
    this.listLocationsHandler = new ListLocationsHandler(locationService);
  }

  async getLocation(
    request: FastifyRequest<{ Params: { locationId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { locationId } = request.params;

      const query: GetLocationQuery = {
        locationId,
      };

      const result = await this.getLocationHandler.handle(query);
      return ResponseHelper.fromQuery(
        reply,
        result,
        "Location retrieved",
        "Location not found",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listLocations(
    request: FastifyRequest<{
      Querystring: ListLocationsQuerystring;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { limit, offset, type } = request.query;

      const query: ListLocationsQuery = {
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        type,
      };

      const result = await this.listLocationsHandler.handle(query);

      if (result.success && result.data) {
        const mappedLocations = result.data.locations.map(
          (loc: LocationResult) => ({
            locationId: loc.locationId,
            type: loc.type,
            name: loc.name,
            address: loc.address
              ? {
                  street: loc.address.addressLine1 || undefined,
                  city: loc.address.city || undefined,
                  state: loc.address.state || undefined,
                  postalCode: loc.address.postalCode || undefined,
                  country: loc.address.country || undefined,
                }
              : null,
          }),
        );
        return ResponseHelper.ok(reply, "Locations retrieved", {
          locations: mappedLocations,
          total: result.data.total,
        });
      }
      return ResponseHelper.badRequest(
        reply,
        result.error || "Failed to list locations",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createLocation(
    request: FastifyRequest<{ Body: CreateLocationBody }>,
    reply: FastifyReply,
  ) {
    try {
      const body = request.body;

      // Map API address to domain model
      const address = body.address
        ? {
            addressLine1: body.address.street,
            city: body.address.city,
            state: body.address.state,
            postalCode: body.address.postalCode,
            country: body.address.country,
          }
        : undefined;

      const command: CreateLocationCommand = {
        type: body.type,
        name: body.name,
        address,
      };

      const result = await this.createLocationHandler.handle(command);

      if (result.success && result.data) {
        const location = result.data;
        const locAddress = location.getAddress();
        return ResponseHelper.created(reply, "Location created successfully", {
          locationId: location.getLocationId().getValue(),
          type: location.getType().getValue(),
          name: location.getName(),
          address: locAddress
            ? {
                street: locAddress.addressLine1 || undefined,
                city: locAddress.city || undefined,
                state: locAddress.state || undefined,
                postalCode: locAddress.postalCode || undefined,
                country: locAddress.country || undefined,
              }
            : null,
        });
      }
      return ResponseHelper.badRequest(
        reply,
        result.error || "Location creation failed",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateLocation(
    request: FastifyRequest<{
      Params: { locationId: string };
      Body: UpdateLocationBody;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { locationId } = request.params;
      const body = request.body;

      const command: UpdateLocationCommand = {
        locationId,
        name: body.name,
        address: body.address,
      };

      const result = await this.updateLocationHandler.handle(command);

      if (result.success && result.data) {
        const location = result.data;
        return ResponseHelper.ok(reply, "Location updated successfully", {
          locationId: location.getLocationId().getValue(),
          type: location.getType().getValue(),
          name: location.getName(),
          address: location.getAddress(),
        });
      }
      return ResponseHelper.badRequest(
        reply,
        result.error || "Location update failed",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteLocation(
    request: FastifyRequest<{ Params: { locationId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { locationId } = request.params;

      const command: DeleteLocationCommand = {
        locationId,
      };

      const result = await this.deleteLocationHandler.handle(command);
      return ResponseHelper.fromCommand(
        reply,
        result,
        "Location deleted successfully",
      );
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }
}
