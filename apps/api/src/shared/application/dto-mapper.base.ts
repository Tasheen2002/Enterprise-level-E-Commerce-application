export interface DtoMapper<Entity, DTO> {
  toDto(entity: Entity): DTO;
  toDtoList(entities: Entity[]): DTO[];
}

export abstract class BaseDtoMapper<Entity, DTO> implements DtoMapper<Entity, DTO> {
  abstract toDto(entity: Entity): DTO;

  toDtoList(entities: Entity[]): DTO[] {
    return entities.map((entity) => this.toDto(entity));
  }
}

export interface TimestampedDto {
  createdAt: string;
  updatedAt: string;
}

export interface IdentifiableDto {
  id: string;
}

export interface BaseEntityDto extends IdentifiableDto, TimestampedDto {}
