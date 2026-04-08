import { FeedbackId } from "../value-objects/index.js";

export class CustomerFeedback {
  private constructor(
    private readonly feedbackId: FeedbackId,
    private readonly userId: string | undefined,
    private readonly ticketId: string | undefined,
    private readonly orderId: string | undefined,
    private npsScore: number | undefined,
    private csatScore: number | undefined,
    private comment: string | undefined,
    private readonly createdAt: Date
  ) {}

  static create(data: CreateCustomerFeedbackData): CustomerFeedback {
    // Validate NPS score (0-10)
    if (data.npsScore !== undefined) {
      if (data.npsScore < 0 || data.npsScore > 10) {
        throw new Error("NPS score must be between 0 and 10");
      }
    }

    // Validate CSAT score (1-5)
    if (data.csatScore !== undefined) {
      if (data.csatScore < 1 || data.csatScore > 5) {
        throw new Error("CSAT score must be between 1 and 5");
      }
    }

    // At least one feedback type must be provided
    if (
      data.npsScore === undefined &&
      data.csatScore === undefined &&
      !data.comment
    ) {
      throw new Error(
        "At least one of NPS score, CSAT score, or comment must be provided"
      );
    }

    const feedbackId = FeedbackId.generate();
    const now = new Date();

    return new CustomerFeedback(
      feedbackId,
      data.userId,
      data.ticketId,
      data.orderId,
      data.npsScore,
      data.csatScore,
      data.comment,
      now
    );
  }

  static reconstitute(data: CustomerFeedbackData): CustomerFeedback {
    return new CustomerFeedback(
      FeedbackId.create(data.feedbackId),
      data.userId,
      data.ticketId,
      data.orderId,
      data.npsScore,
      data.csatScore,
      data.comment,
      data.createdAt
    );
  }

  static fromDatabaseRow(row: CustomerFeedbackDatabaseRow): CustomerFeedback {
    return new CustomerFeedback(
      FeedbackId.create(row.feedback_id),
      row.user_id || undefined,
      row.ticket_id || undefined,
      row.order_id || undefined,
      row.nps_score || undefined,
      row.csat_score || undefined,
      row.comment || undefined,
      row.created_at
    );
  }

  // Getters
  getFeedbackId(): FeedbackId {
    return this.feedbackId;
  }

  getUserId(): string | undefined {
    return this.userId;
  }

  getTicketId(): string | undefined {
    return this.ticketId;
  }

  getOrderId(): string | undefined {
    return this.orderId;
  }

  getNpsScore(): number | undefined {
    return this.npsScore;
  }

  getCsatScore(): number | undefined {
    return this.csatScore;
  }

  getComment(): string | undefined {
    return this.comment;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  // Business logic methods
  updateNpsScore(score: number): void {
    if (score < 0 || score > 10) {
      throw new Error("NPS score must be between 0 and 10");
    }

    this.npsScore = score;
  }

  updateCsatScore(score: number): void {
    if (score < 1 || score > 5) {
      throw new Error("CSAT score must be between 1 and 5");
    }

    this.csatScore = score;
  }

  updateComment(comment: string): void {
    this.comment = comment || undefined;
  }

  // Validation and analysis methods
  hasNpsScore(): boolean {
    return this.npsScore !== undefined;
  }

  hasCsatScore(): boolean {
    return this.csatScore !== undefined;
  }

  hasComment(): boolean {
    return !!this.comment && this.comment.trim().length > 0;
  }

  isRelatedToUser(): boolean {
    return !!this.userId;
  }

  isRelatedToTicket(): boolean {
    return !!this.ticketId;
  }

  isRelatedToOrder(): boolean {
    return !!this.orderId;
  }

  // NPS categorization (0-6: Detractor, 7-8: Passive, 9-10: Promoter)
  isNpsPromoter(): boolean {
    return this.npsScore !== undefined && this.npsScore >= 9;
  }

  isNpsPassive(): boolean {
    return this.npsScore !== undefined && this.npsScore >= 7 && this.npsScore <= 8;
  }

  isNpsDetractor(): boolean {
    return this.npsScore !== undefined && this.npsScore <= 6;
  }

  getNpsCategory(): "promoter" | "passive" | "detractor" | undefined {
    if (this.npsScore === undefined) {
      return undefined;
    }

    if (this.isNpsPromoter()) return "promoter";
    if (this.isNpsPassive()) return "passive";
    return "detractor";
  }

  // CSAT categorization
  isCsatPositive(): boolean {
    return this.csatScore !== undefined && this.csatScore >= 4;
  }

  isCsatNeutral(): boolean {
    return this.csatScore === 3;
  }

  isCsatNegative(): boolean {
    return this.csatScore !== undefined && this.csatScore <= 2;
  }

  getCsatCategory(): "positive" | "neutral" | "negative" | undefined {
    if (this.csatScore === undefined) {
      return undefined;
    }

    if (this.isCsatPositive()) return "positive";
    if (this.isCsatNeutral()) return "neutral";
    return "negative";
  }

  // Convert to data for persistence
  toData(): CustomerFeedbackData {
    return {
      feedbackId: this.feedbackId.getValue(),
      userId: this.userId,
      ticketId: this.ticketId,
      orderId: this.orderId,
      npsScore: this.npsScore,
      csatScore: this.csatScore,
      comment: this.comment,
      createdAt: this.createdAt,
    };
  }

  toDatabaseRow(): CustomerFeedbackDatabaseRow {
    return {
      feedback_id: this.feedbackId.getValue(),
      user_id: this.userId || null,
      ticket_id: this.ticketId || null,
      order_id: this.orderId || null,
      nps_score: this.npsScore || null,
      csat_score: this.csatScore || null,
      comment: this.comment || null,
      created_at: this.createdAt,
    };
  }

  equals(other: CustomerFeedback): boolean {
    return this.feedbackId.equals(other.feedbackId);
  }
}

// Supporting types and interfaces
export interface CreateCustomerFeedbackData {
  userId?: string;
  ticketId?: string;
  orderId?: string;
  npsScore?: number;
  csatScore?: number;
  comment?: string;
}

export interface CustomerFeedbackData {
  feedbackId: string;
  userId?: string;
  ticketId?: string;
  orderId?: string;
  npsScore?: number;
  csatScore?: number;
  comment?: string;
  createdAt: Date;
}

export interface CustomerFeedbackDatabaseRow {
  feedback_id: string;
  user_id: string | null;
  ticket_id: string | null;
  order_id: string | null;
  nps_score: number | null;
  csat_score: number | null;
  comment: string | null;
  created_at: Date;
}
