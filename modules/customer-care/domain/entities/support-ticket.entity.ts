import {
  TicketId,
  TicketSource,
  TicketStatus,
  TicketPriority,
} from "../value-objects/index.js";

export class SupportTicket {
  private constructor(
    private readonly ticketId: TicketId,
    private readonly userId: string | undefined,
    private readonly orderId: string | undefined,
    private readonly source: TicketSource,
    private subject: string,
    private status: TicketStatus,
    private priority: TicketPriority | undefined,
    private readonly createdAt: Date
  ) {}

  static create(data: CreateSupportTicketData): SupportTicket {
    if (!data.subject || data.subject.trim().length === 0) {
      throw new Error("Ticket subject cannot be empty");
    }

    const ticketId = TicketId.generate();
    const now = new Date();

    return new SupportTicket(
      ticketId,
      data.userId,
      data.orderId,
      data.source,
      data.subject.trim(),
      TicketStatus.open(),
      data.priority,
      now
    );
  }

  static reconstitute(data: SupportTicketData): SupportTicket {
    return new SupportTicket(
      TicketId.create(data.ticketId),
      data.userId,
      data.orderId,
      data.source,
      data.subject,
      data.status,
      data.priority,
      data.createdAt
    );
  }

  static fromDatabaseRow(row: SupportTicketDatabaseRow): SupportTicket {
    return new SupportTicket(
      TicketId.create(row.ticket_id),
      row.user_id || undefined,
      row.order_id || undefined,
      TicketSource.fromString(row.source),
      row.subject,
      TicketStatus.fromString(row.status),
      row.priority ? TicketPriority.fromString(row.priority) : undefined,
      row.created_at
    );
  }

  // Getters
  getTicketId(): TicketId {
    return this.ticketId;
  }

  getUserId(): string | undefined {
    return this.userId;
  }

  getOrderId(): string | undefined {
    return this.orderId;
  }

  getSource(): TicketSource {
    return this.source;
  }

  getSubject(): string {
    return this.subject;
  }

  getStatus(): TicketStatus {
    return this.status;
  }

  getPriority(): TicketPriority | undefined {
    return this.priority;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  // Business logic methods
  updateSubject(newSubject: string): void {
    if (!newSubject || newSubject.trim().length === 0) {
      throw new Error("Ticket subject cannot be empty");
    }

    if (this.status.isClosed()) {
      throw new Error("Cannot update subject of closed ticket");
    }

    this.subject = newSubject.trim();
  }

  updateStatus(newStatus: TicketStatus): void {
    if (this.status.equals(newStatus)) {
      return;
    }

    this.status = newStatus;
  }

  updatePriority(newPriority: TicketPriority): void {
    if (this.status.isClosed()) {
      throw new Error("Cannot update priority of closed ticket");
    }

    this.priority = newPriority;
  }

  markAsInProgress(): void {
    if (this.status.isClosed()) {
      throw new Error("Cannot reopen closed ticket");
    }

    this.status = TicketStatus.inProgress();
  }

  markAsResolved(): void {
    if (this.status.isClosed()) {
      throw new Error("Ticket is already closed");
    }

    this.status = TicketStatus.resolved();
  }

  close(): void {
    this.status = TicketStatus.closed();
  }

  reopen(): void {
    if (!this.status.isClosed() && !this.status.isResolved()) {
      throw new Error("Can only reopen closed or resolved tickets");
    }

    this.status = TicketStatus.open();
  }

  // Validation methods
  isRelatedToOrder(): boolean {
    return !!this.orderId;
  }

  isRelatedToUser(): boolean {
    return !!this.userId;
  }

  isOpen(): boolean {
    return this.status.isOpen();
  }

  isClosed(): boolean {
    return this.status.isClosed();
  }

  isResolved(): boolean {
    return this.status.isResolved();
  }

  hasPriority(): boolean {
    return !!this.priority;
  }

  // Convert to data for persistence
  toData(): SupportTicketData {
    return {
      ticketId: this.ticketId.getValue(),
      userId: this.userId,
      orderId: this.orderId,
      source: this.source,
      subject: this.subject,
      status: this.status,
      priority: this.priority,
      createdAt: this.createdAt,
    };
  }

  toDatabaseRow(): SupportTicketDatabaseRow {
    return {
      ticket_id: this.ticketId.getValue(),
      user_id: this.userId || null,
      order_id: this.orderId || null,
      source: this.source.getValue(),
      subject: this.subject,
      status: this.status.getValue(),
      priority: this.priority?.getValue() || null,
      created_at: this.createdAt,
    };
  }

  equals(other: SupportTicket): boolean {
    return this.ticketId.equals(other.ticketId);
  }
}

// Supporting types and interfaces
export interface CreateSupportTicketData {
  userId?: string;
  orderId?: string;
  source: TicketSource;
  subject: string;
  priority?: TicketPriority;
}

export interface SupportTicketData {
  ticketId: string;
  userId?: string;
  orderId?: string;
  source: TicketSource;
  subject: string;
  status: TicketStatus;
  priority?: TicketPriority;
  createdAt: Date;
}

export interface SupportTicketDatabaseRow {
  ticket_id: string;
  user_id: string | null;
  order_id: string | null;
  source: string;
  subject: string;
  status: string;
  priority: string | null;
  created_at: Date;
}
