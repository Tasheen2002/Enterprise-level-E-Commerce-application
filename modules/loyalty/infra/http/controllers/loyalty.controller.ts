import { FastifyRequest, FastifyReply } from 'fastify';
import { LoyaltyService } from '../../../application/services/loyalty.service';
import { TransactionReason } from '../../../domain/entities/loyalty-transaction.entity';

export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  async getAccount(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { userId } = request.params as { userId: string };

      const account = await this.loyaltyService.getAccountDetails(userId);

      return reply.status(200).send({
        success: true,
        data: account
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async getTransactions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { userId } = request.params as { userId: string };
      const { limit, offset } = request.query as { limit?: string; offset?: string };

      const transactions = await this.loyaltyService.getTransactionHistory(
        userId,
        limit ? parseInt(limit) : 50,
        offset ? parseInt(offset) : 0
      );

      return reply.status(200).send({
        success: true,
        data: {
          transactions,
          limit: limit ? parseInt(limit) : 50,
          offset: offset ? parseInt(offset) : 0
        }
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async earnPoints(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { userId } = request.params as { userId: string };
      const { points, reason, description, referenceId, orderId } = request.body as {
        points: number;
        reason: TransactionReason;
        description?: string;
        referenceId?: string;
        orderId?: string;
      };

      const transaction = await this.loyaltyService.earnPoints({
        userId,
        points,
        reason,
        description,
        referenceId,
        orderId
      });

      return reply.status(201).send({
        success: true,
        data: {
          transactionId: transaction.transactionId,
          type: transaction.type,
          points: transaction.points.value,
          reason: transaction.reason,
          description: transaction.description,
          balanceAfter: transaction.balanceAfter,
          expiresAt: transaction.expiresAt,
          createdAt: transaction.createdAt
        }
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to earn points'
      });
    }
  }

  async redeemPoints(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { userId } = request.params as { userId: string };
      const { points, reason, description, referenceId } = request.body as {
        points: number;
        reason: TransactionReason;
        description?: string;
        referenceId?: string;
      };

      const transaction = await this.loyaltyService.redeemPoints({
        userId,
        points,
        reason,
        description,
        referenceId
      });

      return reply.status(201).send({
        success: true,
        data: {
          transactionId: transaction.transactionId,
          type: transaction.type,
          points: transaction.points.value,
          reason: transaction.reason,
          description: transaction.description,
          balanceAfter: transaction.balanceAfter,
          expiresAt: transaction.expiresAt,
          createdAt: transaction.createdAt
        }
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to redeem points'
      });
    }
  }

  async adjustPoints(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { userId } = request.params as { userId: string };
      const { points, isAddition, reason } = request.body as {
        points: number;
        isAddition: boolean;
        reason: string;
      };

      // Get admin user from request (assumes auth middleware sets this)
      const adminUserId = (request as any).user?.userId;

      if (!adminUserId) {
        return reply.status(401).send({
          success: false,
          error: 'Unauthorized'
        });
      }

      const transaction = await this.loyaltyService.adjustPoints({
        userId,
        points,
        isAddition,
        reason,
        createdBy: adminUserId
      });

      return reply.status(201).send({
        success: true,
        data: {
          transactionId: transaction.transactionId,
          type: transaction.type,
          points: transaction.points.value,
          reason: transaction.reason,
          description: transaction.description,
          balanceAfter: transaction.balanceAfter,
          expiresAt: transaction.expiresAt,
          createdAt: transaction.createdAt
        }
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to adjust points'
      });
    }
  }
}
