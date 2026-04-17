# Domain-Driven Design & CQRS Architectural Patterns

This document serves as the canonical memory and standard for all modules in the Enterprise E-Commerce system. Built upon the `user-management`, `product-catalog`, and `inventory-management` references, it provides the definitive structural rules for all layers.

---

## 1. Value Objects (VOs)

### Pattern A — ID Value Objects
```typescript
import { randomUUID } from 'crypto';
import { UuidId } from '../../../../packages/core/src/domain/value-objects/uuid-id.base';

export class XxxId extends UuidId {
  private constructor(value: string) {
    super(value, 'XxxId');
  }

  static create(): XxxId {
    return new XxxId(randomUUID());
  }

  static fromString(id: string): XxxId {
    return new XxxId(id);
  }
}
```

### Pattern B — Domain Value Objects (Single Value)
```typescript
import { EmptyFieldError, InvalidFormatError } from '../../../../packages/core/src/domain/domain-error';

export class Email {
  private constructor(private readonly value: string) {
    if (!value) throw new EmptyFieldError('Email');
    if (!this.isValidEmail(value)) throw new InvalidFormatError('email', 'valid email address');
  }

  static create(value: string): Email {
    return new Email(value.toLowerCase().trim());
  }

  static fromString(value: string): Email {
    return new Email(value);
  }

  getValue(): string { return this.value; }

  equals(other: Email): boolean { return this.value === other.value; }

  toString(): string { return this.value; }

  private isValidEmail(email: string): boolean { /* ... */ return true; }
}
```

### Pattern C — Domain Value Objects (Composite/Multi-field)
```typescript
export class LocationAddress {
  private constructor(
    private readonly street: string,
    private readonly city: string,
    private readonly country: string,
  ) {}

  static create(props: { street: string; city: string; country: string }): LocationAddress {
    // validate fields
    return new LocationAddress(props.street, props.city, props.country);
  }

  getValue(): { street: string; city: string; country: string } {
    return { street: this.street, city: this.city, country: this.country };
  }

  equals(other: LocationAddress): boolean {
    return this.street === other.street &&
           this.city === other.city &&
           this.country === other.country;
  }

  toString(): string { return `${this.street}, ${this.city}, ${this.country}`; }
}
```

**Key rules for ALL VO patterns:**
1. `private constructor` — never public.
2. `static create()` — primary factory, validates input.
3. `static fromString()` — raw factory for ID VOs and simple string VOs.
4. `getValue()` — returns the underlying value.
5. `equals(other: T): boolean` — value comparison, never reference.
6. `toString(): string` — string representation.
7. No exports of internal helpers, policy interfaces, or constants.
8. No imports from `@/api/src/shared` in domain VOs.
9. ID VOs always extend `UuidId` from `packages/core`.
10. Validation — always in constructor or `static create()`, throw domain errors.

---

## 2. Entities & Aggregate Roots

```typescript
// ============================================================================
// 1. Imports
// ============================================================================
import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { DomainEvent } from '../../../../packages/core/src/domain/events/domain-event';
import { XxxId } from '../value-objects/xxx-id.vo';
import { XxxNotFoundError } from '../errors/xxx.errors';

// ============================================================================
// 2. Domain Events (if any)
// ============================================================================
export class XxxCreatedEvent extends DomainEvent {
  constructor(
    public readonly xxxId: string,
    public readonly field: string,
  ) {
    super(xxxId, 'Xxx');
  }

  get eventType(): string { return 'xxx.created'; }

  getPayload(): Record<string, unknown> {
    return { xxxId: this.xxxId, field: this.field };
  }
}

// ============================================================================
// 3. Props Interface — BEFORE the class
// ============================================================================
export interface XxxProps {
  id: XxxId;
  field: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// 4. DTO Interface — BEFORE the class
// ============================================================================
export interface XxxDTO {
  id: string;
  field: string;
  createdAt: string;   // always ISO string — NEVER Date
  updatedAt: string;   // always ISO string — NEVER Date
}

// ============================================================================
// 5. Entity Class
// ============================================================================
export class Xxx extends AggregateRoot {

  // a. private constructor — shorthand style
  private constructor(private props: XxxProps) {
    super();
  }

  // b. static create() — generates id, sets timestamps, emits domain event
  static create(params: Omit<XxxProps, 'id' | 'createdAt' | 'updatedAt'>): Xxx {
    Xxx.validateField(params.field);

    const entity = new Xxx({
      ...params,
      id: XxxId.create(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    entity.addDomainEvent(new XxxCreatedEvent(
      entity.props.id.getValue(),
      entity.props.field,
    ));

    return entity;
  }

  // c. static fromPersistence() — NEVER reconstitute()
  static fromPersistence(props: XxxProps): Xxx {
    return new Xxx(props);
  }

  // d. private static validation methods
  private static validateField(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new XxxFieldRequiredError();
    }
  }

  // e. Getters — one per prop
  get id(): XxxId { return this.props.id; }
  get field(): string { return this.props.field; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // f. Business methods — always update updatedAt, always emit event
  updateField(value: string): void {
    Xxx.validateField(value);
    this.props.field = value;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new XxxUpdatedEvent(this.props.id.getValue(), value));
  }

  // g. equals() — second to last
  equals(other: Xxx): boolean {
    return this.props.id.equals(other.props.id);
  }

  // h. static toDTO() — ALWAYS last
  static toDTO(entity: Xxx): XxxDTO {
    return {
      id: entity.props.id.getValue(),
      field: entity.props.field,
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}

// ============================================================================
// 6. Supporting input types — AFTER the class
// ============================================================================
export interface CreateXxxData {
  field: string;
}
```

**Key Entity rules:**
1. Props interface — before the class.
2. DTO interface — before the class.
3. Extends `AggregateRoot` from packages/core.
4. `private constructor(private props: XxxProps)` — shorthand, never `this.props = props`.
5. `static create()` — generates id internally, never accepts pre-generated id.
6. `static fromPersistence()` — never reconstitute().
7. Private static validation methods.
8. All getters for all props.
9. Business methods always set `this.props.updatedAt = new Date()`.
10. `equals()` — second to last.
11. `static toDTO()` — always last, all dates as `.toISOString()`, never raw Date.
12. Supporting types — after the class.

---

## 3. Repositories (Domain Interfaces)

```typescript
// 1. IMPORTS — domain entities, VOs, enums, PaginatedResult/PaginationOptions from packages/core ONLY
import { Xxx } from '../entities/xxx.entity';
import { XxxId } from '../value-objects/xxx-id';
import { XxxStatus } from '../enums/xxx-status';
import {
  PaginatedResult,
  PaginationOptions,
} from '../../../../packages/core/src/domain/interfaces/paginated-result.interface';

// 2. FILTER / OPTIONS types — BEFORE the interface, named (never anonymous inline)
export interface XxxFilters {
  workspaceId: string;
  status?: XxxStatus;
  startDate?: Date;
  endDate?: Date;
}

// 3. THE INTERFACE
export interface IXxxRepository {
  save(entity: Xxx): Promise<void>;
  update(entity: Xxx): Promise<void>;
  findById(id: XxxId): Promise<Xxx | null>;
  findAll(options?: PaginationOptions): Promise<PaginatedResult<Xxx>>;
  findWithFilters(filters: XxxFilters): Promise<PaginatedResult<Xxx>>;
  delete(id: XxxId): Promise<void>;
  exists(id: XxxId): Promise<boolean>;
}

// 4. QUERY OPTION types — AFTER the interface
export interface XxxQueryOptions extends PaginationOptions {
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}
```

| **Rule** | **Correct** | **Wrong** |
| :--- | :--- | :--- |
| Imports | domain entities, VOs, enums, `packages/core` only | infra imports, DTO imports |
| Return types | `Entity`, `Entity \| null`, `Entity[]`, `PaginatedResult<Entity>`, number, boolean, void | DTOs, `any` |
| Parameter types | typed VOs for IDs | raw string IDs, `any` |
| Options objects | named `XxxQueryOptions` interface | anonymous `{ limit?: number }` inline |
| Infrastructure | never | no `transactionContext?: any`, no Prisma types |
| Interface name | `IXxxRepository` (with I prefix) | `XxxRepository` |
| Projection types | named (e.g. `UserListItem`) — no "DTO" suffix | `UserListItemDTO` |
| `any` | never | `filters: any`, `Promise<any>`, `products: any[]` |

---

## 4. CQRS Application Layer

### Command Pattern
```typescript
import { ICommand, ICommandHandler, CommandResult } from '../../../../packages/core/src/application/cqrs';
import { SomeService } from '../services/some.service';
import { XxxDTO } from '../../domain/entities/xxx.entity';

export interface CreateXxxCommand extends ICommand {
  readonly field1: string;
  readonly field2?: string;
}

export class CreateXxxHandler implements ICommandHandler<CreateXxxCommand, CommandResult<XxxDTO>> {
  constructor(private readonly someService: SomeService) {}

  async handle(command: CreateXxxCommand): Promise<CommandResult<XxxDTO>> {
    const dto = await this.someService.create(command);
    return CommandResult.success(dto);
  }
}
```
**Rules:** `XxxCommand` suffix, `CommandResult<T>` wrapper, returns `CommandResult.success(dto)`.

### Query Pattern
```typescript
import { IQuery, IQueryHandler } from '../../../../packages/core/src/application/cqrs';
import { SomeService } from '../services/some.service';
import { XxxDTO } from '../../domain/entities/xxx.entity';
import { XxxNotFoundError } from '../../domain/errors/xxx.errors';

export interface GetXxxQuery extends IQuery {
  readonly id: string;
  readonly workspaceId: string;
}

export class GetXxxHandler implements IQueryHandler<GetXxxQuery, XxxDTO> {
  constructor(private readonly someService: SomeService) {}

  async handle(query: GetXxxQuery): Promise<XxxDTO> {
    const dto = await this.someService.getById(query.id);
    if (!dto) throw new XxxNotFoundError(query.id);
    return dto;
  }
}
```
**Rules:** `XxxQuery` suffix, plain `DTO` return (no QueryResult wrapper). 

**Both CQRS Rules:** Single import from `packages/core/.../cqrs`, `readonly` on all interface fields, `handle(command/query)` (never input).

---

## 5. Application Services

```typescript
// 1. All imports at the top — domain layer only
import { IXxxRepository } from '../../domain/repositories/xxx.repository';
import { Xxx, XxxDTO } from '../../domain/entities/xxx.entity';
import { XxxId } from '../../domain/value-objects/xxx-id.vo';
import { XxxNotFoundError } from '../../domain/errors/xxx.errors';

// 2. Local types — NOT exported, only if params are complex/reused within file
interface CreateXxxParams {
  field1: string;
  field2?: string;
}

// 3. Result types — exported ONLY if used outside this file (e.g., by query handlers)
export interface ListXxxResult {
  items: XxxDTO[];
  total: number;
}

// 4. Plain class — no decorators, no base class
export class XxxService {
  // 5. Constructor injects repository interfaces only
  constructor(private readonly xxxRepository: IXxxRepository) {}

  // 6. Methods return DTOs via Entity.toDTO() — never raw entities
  async createXxx(params: CreateXxxParams): Promise<XxxDTO> {
    const entity = Xxx.create({ /* ... */ });
    await this.xxxRepository.save(entity);
    return Xxx.toDTO(entity);
  }

  async getXxxById(id: string): Promise<XxxDTO | null> {
    const entity = await this.xxxRepository.findById(XxxId.fromString(id));
    return entity ? Xxx.toDTO(entity) : null;
  }

  async updateXxx(id: string, params: Partial<CreateXxxParams>): Promise<XxxDTO> {
    const entity = await this.xxxRepository.findById(XxxId.fromString(id));
    if (!entity) throw new XxxNotFoundError(id);
    entity.update(params);
    await this.xxxRepository.save(entity);
    return Xxx.toDTO(entity);
  }

  async deleteXxx(id: string): Promise<void> {
    const entity = await this.xxxRepository.findById(XxxId.fromString(id));
    if (!entity) throw new XxxNotFoundError(id);
    await this.xxxRepository.delete(XxxId.fromString(id));
  }
}
```

**Key Service Rules:**
1. All import statements at the very top.
2. Internal param types — `interface/type`, not exported.
3. Result types returned by methods and used externally — exported.
4. Plain export class — no decorators, no extends.
5. Constructor injects repository interfaces (`IXxxRepository`), not concrete classes.
6. Always return DTOs (`Entity.toDTO()`) — never raw entities.
7. Throw domain errors on not-found/invalid — never return null for mutations.
8. Read methods can return `XxxDTO | null`.

---

## 6. HTTP Routing & Controllers

### Controller Standard
```typescript
import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { CreateXHandler, UpdateXHandler, DeleteXHandler, GetXHandler, ListXHandler } from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export class XController {
  constructor(
    private readonly createXHandler: CreateXHandler,
    private readonly updateXHandler: UpdateXHandler,
    private readonly deleteXHandler: DeleteXHandler,
    private readonly getXHandler: GetXHandler,
    private readonly listXHandler: ListXHandler,
  ) {}

  // QUERY — read operations
  async listX(request: AuthenticatedRequest<{ Querystring: {...} }>, reply: FastifyReply) {
    try {
      const result = await this.listXHandler.handle(request.query);
      return ResponseHelper.ok(reply, "X list retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async getX(request: AuthenticatedRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const result = await this.getXHandler.handle({ id: request.params.id });
      return ResponseHelper.ok(reply, "X retrieved successfully", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  // COMMAND — write operations
  async createX(request: AuthenticatedRequest<{ Body: {...} }>, reply: FastifyReply) {
    try {
      const result = await this.createXHandler.handle(request.body);
      return ResponseHelper.fromCommand(reply, result, "X created successfully", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async updateX(request: AuthenticatedRequest<{ Params: { id: string }; Body: {...} }>, reply: FastifyReply) {
    try {
      const result = await this.updateXHandler.handle({ id: request.params.id, ...request.body });
      return ResponseHelper.fromCommand(reply, result, "X updated successfully");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async deleteX(request: AuthenticatedRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const result = await this.deleteXHandler.handle({ id: request.params.id });
      return ResponseHelper.fromCommand(reply, result, "X deleted successfully", undefined, 204);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
```
**Controller Rules**: Plain class (no decorators). Constructor injects Handlers only (never services/repositories). Output matches `ResponseHelper` exactly (`.ok()` for Queries, `.fromCommand(reply, result, msg, 201)` for creates, `.fromCommand(..., undefined, 204)` for delete). The controller never calls a service directly and has zero business logic.

### Route Standard
```typescript
import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import { SomeController } from "../controllers/some.controller";
import { RolePermissions } from "@/api/src/shared/middleware/role-authorization.middleware";
import { createRateLimiter, RateLimitPresets, userKeyGenerator } from "@/api/src/shared/middleware/rate-limiter.middleware";
import { validateBody, validateParams, validateQuery } from "../validation/validator";
import { createSchema, updateSchema, responseSchema } from "../validation/some.schema";

const writeRateLimiter = createRateLimiter({
  ...RateLimitPresets.writeOperations,
  keyGenerator: userKeyGenerator,
});

export async function someRoutes(fastify: FastifyInstance, controller: SomeController): Promise<void> {
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.method !== "GET") {
      await writeRateLimiter(request, reply);
    }
  });

  // GET /things — public
  fastify.get(
    "/things",
    {
      preValidation: [validateQuery(listSchema)],
      schema: { /* ... */ },
    },
    (request, reply) => controller.getThings(request as AuthenticatedRequest, reply),
  );

  // POST /things — Admin only
  fastify.post(
    "/things",
    {
      preValidation: [validateParams(paramsSchema)],   // for params/query only
      preHandler: [validateBody(createSchema), RolePermissions.ADMIN_ONLY],  // body validation BEFORE auth
      schema: { /* ... */ },
    },
    (request, reply) => controller.createThing(request as AuthenticatedRequest, reply),
  );

  // DELETE /things/:id — Admin only (204)
  fastify.delete(
    "/things/:id",
    {
      preValidation: [validateParams(paramsSchema)],
      preHandler: [RolePermissions.ADMIN_ONLY],
      schema: {
        response: {
          204: { description: "Deleted successfully", type: "null" },
        },
      },
    },
    (request, reply) => controller.deleteThing(request as AuthenticatedRequest, reply),
  );
}
```
**Route Rules**: 
- `preValidation` limits to `validateParams` and `validateQuery`.
- `preHandler` takes `[validateBody(schema), RolePermissions.X]` (body validation before authorization).
- Catch-all `writeRateLimiter` placed in `onRequest` hook for all non-GET methods.
- explicit 204 response schema for deletions.
