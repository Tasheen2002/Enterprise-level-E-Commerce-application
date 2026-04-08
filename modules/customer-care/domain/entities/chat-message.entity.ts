import { MessageId, ChatSenderType } from "../value-objects/index.js";

export class ChatMessage {
  private constructor(
    private readonly messageId: MessageId,
    private readonly sessionId: string,
    private readonly senderId: string | undefined,
    private readonly senderType: ChatSenderType,
    private readonly messageType: string | undefined,
    private readonly content: string | undefined,
    private readonly metadata: Record<string, any>,
    private readonly isAutomated: boolean,
    private readonly createdAt: Date
  ) {}

  static create(data: CreateChatMessageData): ChatMessage {
    const messageId = MessageId.generate();
    const now = new Date();

    return new ChatMessage(
      messageId,
      data.sessionId,
      data.senderId,
      data.senderType,
      data.messageType,
      data.content,
      data.metadata || {},
      data.isAutomated || false,
      now
    );
  }

  static reconstitute(data: ChatMessageData): ChatMessage {
    return new ChatMessage(
      MessageId.create(data.messageId),
      data.sessionId,
      data.senderId,
      data.senderType,
      data.messageType,
      data.content,
      data.metadata,
      data.isAutomated,
      data.createdAt
    );
  }

  static fromDatabaseRow(row: ChatMessageDatabaseRow): ChatMessage {
    return new ChatMessage(
      MessageId.create(row.message_id),
      row.session_id,
      row.sender_id || undefined,
      ChatSenderType.fromString(row.sender_type),
      row.message_type || undefined,
      row.content || undefined,
      row.metadata || {},
      row.is_automated,
      row.created_at
    );
  }

  // Getters
  getMessageId(): MessageId {
    return this.messageId;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getSenderId(): string | undefined {
    return this.senderId;
  }

  getSenderType(): ChatSenderType {
    return this.senderType;
  }

  getMessageType(): string | undefined {
    return this.messageType;
  }

  getContent(): string | undefined {
    return this.content;
  }

  getMetadata(): Record<string, any> {
    return { ...this.metadata };
  }

  isAutomatedMessage(): boolean {
    return this.isAutomated;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  // Validation methods
  isFromUser(): boolean {
    return this.senderType.isUser();
  }

  isFromAgent(): boolean {
    return this.senderType.isAgent();
  }

  hasContent(): boolean {
    return !!this.content && this.content.trim().length > 0;
  }

  hasMetadata(): boolean {
    return Object.keys(this.metadata).length > 0;
  }

  // Convert to data for persistence
  toData(): ChatMessageData {
    return {
      messageId: this.messageId.getValue(),
      sessionId: this.sessionId,
      senderId: this.senderId,
      senderType: this.senderType,
      messageType: this.messageType,
      content: this.content,
      metadata: { ...this.metadata },
      isAutomated: this.isAutomated,
      createdAt: this.createdAt,
    };
  }

  toDatabaseRow(): ChatMessageDatabaseRow {
    return {
      message_id: this.messageId.getValue(),
      session_id: this.sessionId,
      sender_id: this.senderId || null,
      sender_type: this.senderType.getValue(),
      message_type: this.messageType || null,
      content: this.content || null,
      metadata: this.metadata,
      is_automated: this.isAutomated,
      created_at: this.createdAt,
    };
  }

  equals(other: ChatMessage): boolean {
    return this.messageId.equals(other.messageId);
  }
}

// Supporting types and interfaces
export interface CreateChatMessageData {
  sessionId: string;
  senderId?: string;
  senderType: ChatSenderType;
  messageType?: string;
  content?: string;
  metadata?: Record<string, any>;
  isAutomated?: boolean;
}

export interface ChatMessageData {
  messageId: string;
  sessionId: string;
  senderId?: string;
  senderType: ChatSenderType;
  messageType?: string;
  content?: string;
  metadata: Record<string, any>;
  isAutomated: boolean;
  createdAt: Date;
}

export interface ChatMessageDatabaseRow {
  message_id: string;
  session_id: string;
  sender_id: string | null;
  sender_type: string;
  message_type: string | null;
  content: string | null;
  metadata: Record<string, any>;
  is_automated: boolean;
  created_at: Date;
}
