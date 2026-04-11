import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  CreateLocationHandler,
  UpdateLocationHandler,
  DeleteLocationHandler,
  GetLocationHandler,
  ListLocationsHandler,
} from "../../../application";
import { LocationManagementService } from "../../../application/services/location-management.service";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export class LocationController {
  private createLocationHandler: CreateLocationHandler;
  private updateLocationHandler: UpdateLocationHandler;
  private deleteLocationHandler: DeleteLocationHandler;
  private getLocationHandler: GetLocationHandler;
  private listLocationsHandler: ListLocationsHandler;

  constructor(locationService: LocationManagementService) {
    this.createLocationHandler = new CreateLocationHandler(locationService);
    this.updateLocationHandler = new UpdateLocationHandler(locationService);
    this.deleteLocationHandler = new DeleteLocationHandler(locationService);
    this.getLocationHandler = new GetLocationHandler(locationService);
    this.listLocationsHandler = new ListLocationsHandler(locationService);
  }

  async getLocation(
    request: AuthenticatedRequest<{ Params: { locationId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { locationId } = request.params;
      const result = await this.getLocationHandler.handle({ locationId });
      return ResponseHelper.fromQuery(reply, result, "Location retrieved", "Location not found");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listLocations(
    request: AuthenticatedRequest<{
      Querystring: { limit?: number; offset?: number; type?: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { limit, offset, type } = request.query;
      const result = await this.listLocationsHandler.handle({
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        type,
      });
      if (result.success && result.data) {
        const mappedLocations = result.data.locations.map((loc) => ({
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
        }));
        return ResponseHelper.ok(reply, "Locations retrieved", {
          locations: mappedLocations,
          total: result.data.total,
        });
      }
      return ResponseHelper.badRequest(reply, result.error || "Failed to list locations");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createLocation(
    request: AuthenticatedRequest<{
      Body: {
        type: string;
        name: string;
        address?: {
          street?: string;
          city?: string;
          state?: string;
          postalCode?: string;
          country?: string;
        };
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { type, name, address } = request.body;
      const result = await this.createLocationHandler.handle({
        type,
        name,
        address: address
          ? {
              addressLine1: address.street,
              city: address.city,
              state: address.state,
              postalCode: address.postalCode,
              country: address.country,
            }
          : undefined,
      });
      if (result.success && result.data) {
        const location = result.data;
        return ResponseHelper.created(reply, "Location created successfully", {
          locationId: location.locationId,
          type: location.type,
          name: location.name,
          address: location.address ?? null,
        });
      }
      return ResponseHelper.badRequest(reply, result.error || "Location creation failed");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateLocation(
    request: AuthenticatedRequest<{
      Params: { locationId: string };
      Body: { name?: string; address?: any };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { locationId } = request.params;
      const { name, address } = request.body;
      const result = await this.updateLocationHandler.handle({ locationId, name, address });
      if (result.success && result.data) {
        const location = result.data;
        return ResponseHelper.ok(reply, "Location updated successfully", {
          locationId: location.locationId,
          type: location.type,
          name: location.name,
          address: location.address ?? null,
        });
      }
      return ResponseHelper.badRequest(reply, result.error || "Location update failed");
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteLocation(
    request: AuthenticatedRequest<{ Params: { locationId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { locationId } = request.params;
      const result = await this.deleteLocationHandler.handle({ locationId });
      return ResponseHelper.fromCommand(reply, result, "Location deleted successfully", undefined, 204);
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  }
}
