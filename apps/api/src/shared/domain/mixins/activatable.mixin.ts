export interface Activatable {
  isActive: boolean;
  activate(): void;
  deactivate(): void;
}

export function ActivatableMixin<TBase extends new (...args: any[]) => {}>(Base: TBase) {
  return class extends Base implements Activatable {
    isActive: boolean = true;

    activate(): void {
      this.isActive = true;
    }

    deactivate(): void {
      this.isActive = false;
    }
  };
}
