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

export type GroupTransform<T, K extends keyof T> = (
  groups: Group<T, K>[]
) => Group<T, K>[];

export type Having<T> = <K extends keyof T>(
  predicate: (group: Group<T, K>) => boolean
) => GroupTransform<T, K>;

export function query<T, R = T>(
  ...steps: Array<(data: any) => any>
): (data: T[]) => R[] {
  return (initialData: T[]): R[] => {
    let result: any = initialData;
    for (const step of steps) {
      result = step(result);
    }
    return result as R[];
  };
}

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