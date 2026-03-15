export type Transform<T> = (data: T[]) => T[];

export type Where<T> = <K extends keyof T>(
  key: K,
  value: T[K]
) => Transform<T>;

export type Sort<T> = <K extends keyof T>(
  key: K
) => Transform<T>;

export type Group<T, K extends keyof T> = {
  key: T[K];
  items: T[];
};

export type GroupBy<T> = <K extends keyof T>(
  key: K
) => (data: T[]) => Group<T, K>[];

export type Having<T> = <K extends keyof T>(
  predicate: (group: Group<T, K>) => boolean
) => (groups: Group<T, K>[]) => Group<T, K>[];

export type StageType = 'where' | 'groupBy' | 'having' | 'sort';

export type ValidateOrder<T extends StageType[]> = T extends [] ? [] : 
  T extends [infer First, ...infer Rest] ?
    First extends 'where' ?
      Rest extends StageType[] ? [First, ...ValidateOrder<Rest>] : never :
    First extends 'groupBy' ?
      Rest extends StageType[] ? 
        NoWhereAfterGroupBy<Rest> extends true ? [First, ...ValidateOrder<Rest>] : never :
      never :
    First extends 'having' ?
      Rest extends StageType[] ?
        NoWhereOrGroupByAfterHaving<Rest> extends true ? [First, ...ValidateOrder<Rest>] : never :
      never :
    First extends 'sort' ?
      Rest extends StageType[] ?
        OnlySortAfterSort<Rest> extends true ? [First, ...ValidateOrder<Rest>] : never :
      never :
    never
  : never;

export type NoWhereAfterGroupBy<T extends StageType[]> = 
  T extends [] ? true :
  T extends [infer First, ...infer Rest] ?
    First extends 'where' ? false :
    First extends 'groupBy' ? NoWhereAfterGroupBy<Rest extends StageType[] ? Rest : []> :
    First extends 'having' ? NoWhereAfterGroupBy<Rest extends StageType[] ? Rest : []> :
    First extends 'sort' ? NoWhereAfterGroupBy<Rest extends StageType[] ? Rest : []> :
    false
  : true;

export type NoWhereOrGroupByAfterHaving<T extends StageType[]> = 
  T extends [] ? true :
  T extends [infer First, ...infer Rest] ?
    First extends 'where' ? false :
    First extends 'groupBy' ? false :
    First extends 'having' ? NoWhereOrGroupByAfterHaving<Rest extends StageType[] ? Rest : []> :
    First extends 'sort' ? NoWhereOrGroupByAfterHaving<Rest extends StageType[] ? Rest : []> :
    false
  : true;

export type OnlySortAfterSort<T extends StageType[]> = 
  T extends [] ? true :
  T extends [infer First, ...infer Rest] ?
    First extends 'sort' ? OnlySortAfterSort<Rest extends StageType[] ? Rest : []> :
    false
  : true;

export function createWhere<T>(): Where<T> {
  return <K extends keyof T>(key: K, value: T[K]) => {
    return (data: T[]): T[] => {
      return data.filter(item => item[key] === value);
    };
  };
}

export function createSort<T>(): Sort<T> {
  return <K extends keyof T>(key: K) => {
    return (data: T[]): T[] => {
      return [...data].sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        if (av < bv) return -1;
        if (av > bv) return 1;
        return 0;
      });
    };
  };
}

export function createGroupBy<T>(): GroupBy<T> {
  return <K extends keyof T>(key: K) => {
    return (data: T[]): Group<T, K>[] => {
      const groups = new Map<T[K], Group<T, K>>();
      for (const item of data) {
        const groupKey = item[key];
        const existingGroup = groups.get(groupKey);
        if (existingGroup) {
          existingGroup.items.push(item);
        } else {
          groups.set(groupKey, {
            key: groupKey,
            items: [item]
          });
        }
      }
      return Array.from(groups.values());
    };
  };
}

export function createHaving<T>(): Having<T> {
  return <K extends keyof T>(predicate: (group: Group<T, K>) => boolean) => {
    return (groups: Group<T, K>[]): Group<T, K>[] => {
      return groups.filter(predicate);
    };
  };
}

export function query<T, S extends StageType[] = StageType[]>(
  ...steps: any[]
): (data: T[]) => any {
  return (initialData: T[]): any => {
    let result: any = initialData;
    for (const step of steps) {
      result = step(result);
    }
    return result;
  };
}