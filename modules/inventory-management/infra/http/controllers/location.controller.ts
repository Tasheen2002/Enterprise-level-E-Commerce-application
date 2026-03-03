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

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else if (result.success && result.data === null) {
        return reply.code(404).send({
          success: false,
          error: "Location not found",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to get location",
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get location");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async listLocations(
    request: FastifyRequest<{
      Querystring: { limit?: number; offset?: number; type?: string };
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
        // Map address fields for API response
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
        return reply.code(200).send({
          success: true,
          data: {
            locations: mappedLocations,
            total: result.data.total,
          },
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to list locations",
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to list locations");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async createLocation(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;

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
        return reply.code(201).send({
          success: true,
          data: {
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
          },
          message: "Location created successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Location creation failed",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to create location");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async updateLocation(
    request: FastifyRequest<{ Params: { locationId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { locationId } = request.params;
      const body = request.body as any;

      const command: UpdateLocationCommand = {
        locationId,
        name: body.name,
        address: body.address,
      };

      const result = await this.updateLocationHandler.handle(command);

      if (result.success && result.data) {
        const location = result.data;

        return reply.code(200).send({
          success: true,
          data: {
            locationId: location.getLocationId().getValue(),
            type: location.getType().getValue(),
            name: location.getName(),
            address: location.getAddress(),
          },
          message: "Location updated successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Location update failed",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to update location");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
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

      if (result.success) {
        return reply.code(200).send({
          success: true,
          message: "Location deleted successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Location deletion failed",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to delete location");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }
}
