export type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
  };
  
  export type PickedByType<T, U> = {
    [P in keyof T as T[P] extends U ? P : never]: T[P];
  };
  
  export type EventHandlers<T extends Record<string, any>> = {
    [K in keyof T as K extends string ? `on${Capitalize<K>}` : never]: (payload: T[K]) => void;
  };