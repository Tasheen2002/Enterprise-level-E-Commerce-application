# Domain-Driven Design (DDD) Patterns

Based on the analysis of `user-management`, `product-catalog`, and `inventory-management`, the following strict rules apply to the domain layer. Always reference these patterns when building new modules (e.g., `cart`, `order-management`).

## 1. Value Objects (VOs)
- **Immutability & Encapsulation**: Must use `private readonly` properties and a `private constructor`.
- **Factory Methods**: Instantiated via `static create(...)` or `static fromString(...)`. Reject invalid inputs immediately by throwing specific custom Domain Errors (e.g., `InvalidPriceError`).
- **Logic Placement**: Business rules related to the value itself must reside in the VO (`isLowStock()`, `applyDiscount()`).
- **No Mutation**: Operations on VOs must return a `new` instance of the VO.
- **Equality**: Must implement an `equals(other: ThisVO): boolean` method for structural comparison.

## 2. Entities & Aggregate Roots
- **Base Class**: Aggregate Roots must extend `AggregateRoot` from `packages/core/...`.
- **State Definition**: Internal data is strictly typed in a `Props` interface (e.g., `ProductProps`).
- **Instantiation**:
  - `static create(params)`: Used for new entities. Autogenerates IDs, sets timestamps, and calls `this.addDomainEvent(new EntityCreatedEvent(...))`.
  - `static fromPersistence(props)`: Used by repositories to reconstitute existing DB data without side effects.
- **Encapsulated Behavior**: No direct property setters. Domain mutators (e.g., `updatePrice()`, `publish()`) must encapsulate invariant logic, bump `updatedAt`, and dispatch `DomainEvent`s.
- **DTO Mapping**: Entities must provide a `static toDTO(entity)` method that flattens primitive values from VOs for CQRS Handlers/Clients.

## 3. Repositories

### Interfaces (`domain/repositories`)
- **Pure Domain Interfaces**: Defined as `export interface I[Name]Repository` taking and returning Domain Entities/VOs (not Prisma models).
- **Domain Business Queries**: Should house performance-specific checks (`existsByEmail`, `getTotalAvailableStock`) to prevent loading unnecessary data into memory.

### Implementations (`infra/persistence/repositories`)
- **Persistence Mapping**: Must implement `private toDomain(row: any): Entity` and `private toPersistence(entity: Entity): PrismaData`. 
  - `toDomain` is strictly responsible for calling the Entity's `static fromPersistence()` method to reconstitute the aggregate without firing side-effects.
- **Event Dispatching**: When saving an aggregate (`save()`), the repository must ensure that Domain Events queued on the entity are dispatched, typically via extending the base `PrismaRepository` and calling `await this.dispatchEvents(entity)`.
- **Transactions**: Multi-table persistence (e.g. replacing categories or saving related entities) must be wrapped in `this.prisma.$transaction(...)`.

### CQRS Read-Side Pragmatism
- Repositories can define specific Query methods returning flattened DTO streams or `Enriched[...]Data` (e.g., `findWithEnrichment`, `findAllWithFilters`).
- These methods use raw `this.prisma.[model].findMany({ select: {...} })` and map directly to lightweight DTOs.
- **CRITICAL**: This intentionally bypasses full Aggregate hydration (like `this.toDomain()`), dramatically improving performance for list operations.

## 4. CQRS Commands & Queries (Application Layer)

### Structural Rules
- **Combined Files**: The Input interface and the Handler class MUST live in the exact same file (e.g., `create-product.command.ts`, `get-product.query.ts`). Do not create separate "commands" and "handlers" subfolders.
- **Naming Conventions**: 
  - File: `[action-name].command.ts` or `[action-name].query.ts`
  - Input: `[Action]Input` extending `ICommand` or `IQuery`.
  - Handler: `[Action]Handler`. **CRITICAL:** Do *not* append `CommandHandler` or `QueryHandler` to the class name.

### Command Handlers
- **Role**: Orchestration only. They receive flat input data, pass it to an Application Service to execute business logic, and return the result.
- **Return Type**: Handlers must wrap the service response and return `Promise<CommandResult<DTO>>`.
- **Error Handling**: `CommandResult` supports both a singular `error` and an array of `errors` (e.g., for bulk validation mapping).

### Query Handlers
- **Role**: Read-only data fetching. Like commands, they delegate the actual data retrieval to the Service or directly to the Repository's read-optimized methods.
- **Return Pattern**: Queries return pure un-wrapped `DTO` payloads or custom Result objects (like `ListUsersResult`) directly from the handler.
- **Query Result Format**: `QueryResult` (which enforces a pure singular `error` object unlike `CommandResult`) is typically utilized at the ResponseHelper boundary, not wrapped inside the Query Handler.

## 5. Application Services (Orchestrators)

### Responsibilities
- **Application Logic**: Services coordinate Repositories and Domain Entities. They do *not* contain the domain logic itself (e.g., checking if a price is valid), but they handle the workflow (e.g., fetch entity -> call entity method -> save entity).
- **Cross-Aggregate Operations**: When an action spans multiple aggregates (e.g., User, UserProfile, Address, and PaymentMethod), the Service is responsible for fetching all necessary data and enforcing the inter-aggregate consistency.

### Method Signatures
- **Input**: Accept strictly primitive values, primitive records, or flat parameter interfaces from the Command Handlers.
- **Returns**: A Service must **never** return a Domain Entity. It must map the Entity to a DTO before returning, usually using the Entity's own `static toDTO(entity)` method.

### Internal Helper Pattern
- **`_getEntity(id: string)` Helper**: Services commonly use a private helper method (e.g., `_getProduct(id)`) that abstracts taking a string ID, converting it to a Value Object, fetching it from the repository, throwing a `NotFoundError` if it doesn't exist, and returning the raw Entity object natively to the other service methods.

## 6. Domain Errors, Constants & Enums

### Domain Errors
- **Base Class**: Must extend `DomainError` from `packages/core`.
- **HTTP Mapping**: The error's `constructor` must supply the specific HTTP mapping to `super()`: message, strict string Error Code, and HTTP Status Code (`404`, `400`, etc.). This allows the Controller bounding layer to catch and format API responses perfectly without logic.

### Constants
- **Grouping**: Moduler constants (e.g. limit bounds, token expiry times) are grouped into a strictly typed object (`export const [MODULE]_CONSTANTS = { ... } as const;`).
- **File Structure**: If constants are short, they can be grouped into one file rather than split.

### Enums
- **Values**: Strictly use String Enums for serialization safety without magical integers.
- **File Structure**: By default, use "One File Per Enum". However, **if the enum files in one folder are short with their content, they can be combined into one file.** Ensure they are exported clean out of `index.ts`.

## 7. Infra Layer (HTTP Routing & Controllers)

### Route Files (`.routes.ts`)
- **Signature**: Must export an async function `register[Module]Routes(fastify: FastifyInstance, controller: [Module]Controller)`.
- **Fastify Schema**: Every route must specify a Swagger/OpenAPI `schema` containing `tags`, `summary`, `security`, and exact `response` definitions.
- **Middleware Organization**:
  - `preValidation`: Strictly used for `validateParams(...)` and `validateQuery(...)` to catch malformed URLs immediately.
  - `preHandler`: Used for authentication (`authenticate`), authorization (`RolePermissions.[ROLE]`), and body validation (`validateBody(...)`).

### Controllers & Authenticated Requests
- **Type Casting**: In the route declaration, aggressively cast to authenticated requests if the route is protected: `request as AuthenticatedRequest`.
- **Data Aggregation (BFF)**: Controllers sometimes act as Backend-for-Frontend (BFF). For a complex `GET` route, they can call a Query Handler, inject those IDs directly into an Application Service to fetch enrichment mappings, and return a single unified JSON response.
- **Global Try/Catch Safety Net**: Every controller method MUST be securely wrapped in `try { ... } catch (error) { return ResponseHelper.error(reply, error); }`. This prevents unhandled rejections and seamlessly maps Domain Errors to HTTP statuses.
- **ResponseHelper**: The Controller wraps CQRS Handler outputs cleanly:
  - For GET queries: `return ResponseHelper.ok(reply, 'Success', result);`
  - For POST commands: `return ResponseHelper.fromCommand(reply, result, 'Created', 201);`
  - For PUT/PATCH commands: `return ResponseHelper.fromCommand(reply, result, 'Updated');`

### The DELETE 204 Pattern
- When executing a `DELETE` route, **do not** return a `200 { success: true }` body. 
- The Controller must explicitly check if the Command handled successfully. If it did, it must bypass `ResponseHelper` and return `reply.status(204).send()`. If it failed (e.g. business rule violation), it falls back to `ResponseHelper.fromCommand(...)`.
