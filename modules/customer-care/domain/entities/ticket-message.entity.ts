import { MessageId, MessageSender } from "../value-objects/index.js";

export class TicketMessage {
  private constructor(
    private readonly messageId: MessageId,
    private readonly ticketId: string,
    private readonly sender: MessageSender,
    private readonly body: string,
    private readonly createdAt: Date
  ) {}

  static create(data: CreateTicketMessageData): TicketMessage {
    if (!data.body || data.body.trim().length === 0) {
      throw new Error("Message body cannot be empty");
    }

    if (!data.ticketId || data.ticketId.trim().length === 0) {
      throw new Error("Ticket ID is required");
    }

    const messageId = MessageId.generate();
    const now = new Date();

    return new TicketMessage(
      messageId,
      data.ticketId,
      data.sender,
      data.body.trim(),
      now
    );
  }

  static reconstitute(data: TicketMessageData): TicketMessage {
    return new TicketMessage(
      MessageId.create(data.messageId),
      data.ticketId,
      data.sender,
      data.body,
      data.createdAt
    );
  }

  static fromDatabaseRow(row: TicketMessageDatabaseRow): TicketMessage {
    return new TicketMessage(
      MessageId.create(row.message_id),
      row.ticket_id,
      MessageSender.fromString(row.sender),
      row.body,
      row.created_at
    );
  }

  // Getters
  getMessageId(): MessageId {
    return this.messageId;
  }

  getTicketId(): string {
    return this.ticketId;
  }

  getSender(): MessageSender {
    return this.sender;
  }

  getBody(): string {
    return this.body;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  // Validation methods
  isFromAgent(): boolean {
    return this.sender.isAgent();
  }

  isFromCustomer(): boolean {
    return this.sender.isCustomer();
  }

  // Convert to data for persistence
  toData(): TicketMessageData {
    return {
      messageId: this.messageId.getValue(),
      ticketId: this.ticketId,
      sender: this.sender,
      body: this.body,
      createdAt: this.createdAt,
    };
  }

  toDatabaseRow(): TicketMessageDatabaseRow {
    return {
      message_id: this.messageId.getValue(),
      ticket_id: this.ticketId,
      sender: this.sender.getValue(),
      body: this.body,
      created_at: this.createdAt,
    };
  }

  equals(other: TicketMessage): boolean {
    return this.messageId.equals(other.messageId);
  }
}

// Supporting types and interfaces
export interface CreateTicketMessageData {
  ticketId: string;
  sender: MessageSender;
  body: string;
}

export interface TicketMessageData {
  messageId: string;
  ticketId: string;
  sender: MessageSender;
  body: string;
  createdAt: Date;
}

export interface TicketMessageDatabaseRow {
  message_id: string;
  ticket_id: string;
  sender: string;
  body: string;
  created_at: Date;
}
