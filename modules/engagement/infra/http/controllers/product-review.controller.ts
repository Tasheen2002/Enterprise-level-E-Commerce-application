import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  CreateProductReviewHandler,
  UpdateReviewStatusHandler,
  DeleteProductReviewHandler,
  GetProductReviewHandler,
  GetProductReviewsHandler,
  GetUserReviewsHandler,
} from "../../../application";

export class ProductReviewController {
  constructor(
    private readonly createProductReviewHandler: CreateProductReviewHandler,
    private readonly updateReviewStatusHandler: UpdateReviewStatusHandler,
    private readonly deleteProductReviewHandler: DeleteProductReviewHandler,
    private readonly getProductReviewHandler: GetProductReviewHandler,
    private readonly getProductReviewsHandler: GetProductReviewsHandler,
    private readonly getUserReviewsHandler: GetUserReviewsHandler,
  ) {}

  async createReview(
    request: AuthenticatedRequest<{
      Body: {
        productId: string;
        userId: string;
        rating: number;
        title?: string;
        body?: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId, userId, rating, title, body } = request.body;
      const result = await this.createProductReviewHandler.handle({
        productId,
        userId,
        rating,
        title,
        body,
      });
      return ResponseHelper.fromCommand(reply, result, "Product review created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getReview(
    request: AuthenticatedRequest<{ Params: { reviewId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const dto = await this.getProductReviewHandler.handle({ reviewId: request.params.reviewId });
      return ResponseHelper.ok(reply, "Product review retrieved successfully", dto);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getProductReviews(
    request: AuthenticatedRequest<{
      Params: { productId: string };
      Querystring: { limit?: number; offset?: number };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { productId } = request.params;
      const { limit, offset } = request.query;
      const result = await this.getProductReviewsHandler.handle({ productId, limit, offset });
      return ResponseHelper.ok(reply, "Product reviews retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getUserReviews(
    request: AuthenticatedRequest<{
      Params: { userId: string };
      Querystring: { limit?: number; offset?: number };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId } = request.params;
      const { limit, offset } = request.query;
      const result = await this.getUserReviewsHandler.handle({ userId, limit, offset });
      return ResponseHelper.ok(reply, "User reviews retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateReviewStatus(
    request: AuthenticatedRequest<{
      Params: { reviewId: string };
      Body: { status: "approved" | "rejected" | "flagged" };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { reviewId } = request.params;
      const { status } = request.body;
      const result = await this.updateReviewStatusHandler.handle({ reviewId, status });
      return ResponseHelper.fromCommand(reply, result, "Review status updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteReview(
    request: AuthenticatedRequest<{ Params: { reviewId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.deleteProductReviewHandler.handle({ reviewId: request.params.reviewId });
      return ResponseHelper.fromCommand(reply, result, "Product review deleted successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
