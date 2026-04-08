import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreateProductReviewCommand,
  CreateProductReviewHandler,
  UpdateReviewStatusCommand,
  UpdateReviewStatusHandler,
  DeleteProductReviewCommand,
  DeleteProductReviewHandler,
} from "../../../application/commands/index.js";
import {
  GetProductReviewQuery,
  GetProductReviewHandler,
  GetProductReviewsQuery,
  GetProductReviewsHandler,
  GetUserReviewsQuery,
  GetUserReviewsHandler,
} from "../../../application/queries/index.js";
import { ProductReviewService } from "../../../application/services/index.js";

interface CreateProductReviewRequest {
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  body?: string;
}

interface UpdateReviewStatusRequest {
  status: "approved" | "rejected" | "flagged";
}

export class ProductReviewController {
  private createProductReviewHandler: CreateProductReviewHandler;
  private updateReviewStatusHandler: UpdateReviewStatusHandler;
  private deleteProductReviewHandler: DeleteProductReviewHandler;
  private getProductReviewHandler: GetProductReviewHandler;
  private getProductReviewsHandler: GetProductReviewsHandler;
  private getUserReviewsHandler: GetUserReviewsHandler;

  constructor(private readonly reviewService: ProductReviewService) {
    this.createProductReviewHandler = new CreateProductReviewHandler(
      reviewService
    );
    this.updateReviewStatusHandler = new UpdateReviewStatusHandler(
      reviewService
    );
    this.deleteProductReviewHandler = new DeleteProductReviewHandler(
      reviewService
    );
    this.getProductReviewHandler = new GetProductReviewHandler(reviewService);
    this.getProductReviewsHandler = new GetProductReviewsHandler(
      reviewService
    );
    this.getUserReviewsHandler = new GetUserReviewsHandler(reviewService);
  }

  async createReview(
    request: FastifyRequest<{ Body: CreateProductReviewRequest }>,
    reply: FastifyReply
  ) {
    try {
      const { productId, userId, rating, title, body } = request.body;

      const command: CreateProductReviewCommand = {
        productId,
        userId,
        rating,
        title,
        body,
      };

      const result = await this.createProductReviewHandler.handle(command);

      if (result.success && result.data) {
        return reply.code(201).send({
          success: true,
          data: result.data,
          message: "Product review created successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to create product review",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to create product review");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to create product review",
      });
    }
  }

  async getReview(
    request: FastifyRequest<{ Params: { reviewId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { reviewId } = request.params;

      if (!reviewId || typeof reviewId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Review ID is required and must be a valid string",
        });
      }

      const query: GetProductReviewQuery = { reviewId };
      const result = await this.getProductReviewHandler.handle(query);

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
        });
      } else if (result.success && result.data === null) {
        return reply.code(404).send({
          success: false,
          error: "Product review not found",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to retrieve product review",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get product review");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve product review",
      });
    }
  }

  async getProductReviews(
    request: FastifyRequest<{
      Params: { productId: string };
      Querystring: { limit?: string; offset?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { productId } = request.params;
      const { limit, offset } = request.query;

      if (!productId || typeof productId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "Product ID is required and must be a valid string",
        });
      }

      const query: GetProductReviewsQuery = {
        productId,
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      };

      const result = await this.getProductReviewsHandler.handle(query);

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
          total: result.data.length,
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to retrieve product reviews",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get product reviews");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve product reviews",
      });
    }
  }

  async getUserReviews(
    request: FastifyRequest<{
      Params: { userId: string };
      Querystring: { limit?: string; offset?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { userId } = request.params;
      const { limit, offset } = request.query;

      if (!userId || typeof userId !== "string") {
        return reply.code(400).send({
          success: false,
          error: "Bad Request",
          message: "User ID is required and must be a valid string",
        });
      }

      const query: GetUserReviewsQuery = {
        userId,
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      };

      const result = await this.getUserReviewsHandler.handle(query);

      if (result.success && result.data) {
        return reply.code(200).send({
          success: true,
          data: result.data,
          total: result.data.length,
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to retrieve user reviews",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to get user reviews");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to retrieve user reviews",
      });
    }
  }

  async updateReviewStatus(
    request: FastifyRequest<{
      Params: { reviewId: string };
      Body: UpdateReviewStatusRequest;
    }>,
    reply: FastifyReply
  ) {
    try {
      const { reviewId } = request.params;
      const { status } = request.body;

      const command: UpdateReviewStatusCommand = {
        reviewId,
        status,
      };

      const result = await this.updateReviewStatusHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          message: "Review status updated successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to update review status",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to update review status");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to update review status",
      });
    }
  }

  async deleteReview(
    request: FastifyRequest<{ Params: { reviewId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { reviewId } = request.params;

      const command: DeleteProductReviewCommand = {
        reviewId,
      };

      const result = await this.deleteProductReviewHandler.handle(command);

      if (result.success) {
        return reply.code(200).send({
          success: true,
          message: "Product review deleted successfully",
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.error || "Failed to delete product review",
          errors: result.errors,
        });
      }
    } catch (error) {
      request.log.error(error, "Failed to delete product review");
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
        message: "Failed to delete product review",
      });
    }
  }
}
