import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  CreateLocationHandler,
  UpdateLocationHandler,
  DeleteLocationHandler,
  GetLocationHandler,
  ListLocationsHandler,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export class LocationController {
  constructor(
    private readonly createLocationHandler: CreateLocationHandler,
    private readonly updateLocationHandler: UpdateLocationHandler,
    private readonly deleteLocationHandler: DeleteLocationHandler,
    private readonly getLocationHandler: GetLocationHandler,
    private readonly listLocationsHandler: ListLocationsHandler,
  ) {}

  async getLocation(
    request: AuthenticatedRequest<{ Params: { locationId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { locationId } = request.params;
      const result = await this.getLocationHandler.handle({ locationId });
      return ResponseHelper.ok(reply, "Location retrieved", result);
    } catch (error: unknown) {
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
      const result = await this.listLocationsHandler.handle(request.query);
      return ResponseHelper.ok(reply, "Locations retrieved", result);
    } catch (error: unknown) {
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
      return ResponseHelper.fromCommand(reply, result, "Location created successfully", 201);
    } catch (error: unknown) {
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
      return ResponseHelper.fromCommand(reply, result, "Location updated successfully");
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
