import { UserId } from "../value-objects/user-id.vo";

export interface MemberSessionProps {
  id?: string;
  userId: UserId;
  refreshTokenHash: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceType?: string | null;
  browser?: string | null;
  os?: string | null;
  isRevoked?: boolean;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class MemberSession {
  private constructor(private readonly props: MemberSessionProps) {}

  public static create(props: MemberSessionProps): MemberSession {
    return new MemberSession({
      ...props,
      isRevoked: props.isRevoked ?? false,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  get id(): string | undefined {
    return this.props.id;
  }

  get userId(): UserId {
    return this.props.userId;
  }

  get refreshTokenHash(): string {
    return this.props.refreshTokenHash;
  }

  get ipAddress(): string | null | undefined {
    return this.props.ipAddress;
  }

  get userAgent(): string | null | undefined {
    return this.props.userAgent;
  }

  get deviceType(): string | null | undefined {
    return this.props.deviceType;
  }

  get browser(): string | null | undefined {
    return this.props.browser;
  }

  get os(): string | null | undefined {
    return this.props.os;
  }

  get isRevoked(): boolean {
    return this.props.isRevoked ?? false;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  public revoke(): void {
    this.props.isRevoked = true;
    this.props.updatedAt = new Date();
  }

  public rotateToken(newHash: string, newExpiresAt: Date): void {
    this.props.refreshTokenHash = newHash;
    this.props.expiresAt = newExpiresAt;
    this.props.updatedAt = new Date();
  }

  public updateMetadata(metadata: { 
    ipAddress?: string | null; 
    userAgent?: string | null; 
    deviceType?: string | null; 
    browser?: string | null; 
    os?: string | null 
  }): void {
    if (metadata.ipAddress !== undefined) this.props.ipAddress = metadata.ipAddress;
    if (metadata.userAgent !== undefined) this.props.userAgent = metadata.userAgent;
    if (metadata.deviceType !== undefined) this.props.deviceType = metadata.deviceType;
    if (metadata.browser !== undefined) this.props.browser = metadata.browser;
    if (metadata.os !== undefined) this.props.os = metadata.os;
    this.props.updatedAt = new Date();
  }
}
