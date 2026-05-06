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
import {
  LocationParams,
  ListLocationsQuery,
  CreateLocationBody,
  UpdateLocationBody,
} from "../validation/location.schema";

export class LocationController {
  constructor(
    private readonly createLocationHandler: CreateLocationHandler,
    private readonly updateLocationHandler: UpdateLocationHandler,
    private readonly deleteLocationHandler: DeleteLocationHandler,
    private readonly getLocationHandler: GetLocationHandler,
    private readonly listLocationsHandler: ListLocationsHandler,
  ) {}

  async getLocation(
    request: AuthenticatedRequest<{ Params: LocationParams }>,
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
    request: AuthenticatedRequest<{ Querystring: ListLocationsQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { limit, offset, type } = request.query;
      const result = await this.listLocationsHandler.handle({ limit, offset, type });
      return ResponseHelper.ok(reply, "Locations retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async createLocation(
    request: AuthenticatedRequest<{ Body: CreateLocationBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { type, name, address } = request.body;
      const result = await this.createLocationHandler.handle({ type, name, address });
      return ResponseHelper.fromCommand(reply, result, "Location created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateLocation(
    request: AuthenticatedRequest<{ Params: LocationParams; Body: UpdateLocationBody }>,
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
    request: AuthenticatedRequest<{ Params: LocationParams }>,
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
