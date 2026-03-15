import { describe, it, expect } from 'vitest';
import {
    query,
    createWhere,
    createSort,
    createGroupBy,
    createHaving
} from './transform';

type User = {
    id: number;
    name: string;
    surname: string;
    age: number;
    city: string;
};

const users: User[] = [
    { id: 1, name: "John", surname: "Doe", age: 34, city: "NY" },
    { id: 2, name: "John", surname: "Doe", age: 33, city: "NY" },
    { id: 3, name: "John", surname: "Doe", age: 35, city: "LA" },
    { id: 4, name: "Mike", surname: "Doe", age: 35, city: "LA" },
    { id: 5, name: "Jane", surname: "Smith", age: 28, city: "NY" },
    { id: 6, name: "Bob", surname: "Johnson", age: 42, city: "LA" },
];

const where = createWhere<User>();
const sort = createSort<User>();
const groupBy = createGroupBy<User>();
const having = createHaving<User>();

describe('transform functions', () => {
    describe('where', () => {
        it('should filter users by name', () => {
            const filterByName = where('name', 'John');
            const result = filterByName(users);
            
            expect(result).toHaveLength(3);
            expect(result.every(u => u.name === 'John')).toBe(true);
        });

        it('should filter users by name and surname', () => {
            const filterByName = where('name', 'John');
            const filterBySurname = where('surname', 'Doe');
            const result = filterBySurname(filterByName(users));
            
            expect(result).toHaveLength(3);
            expect(result.every(u => u.name === 'John' && u.surname === 'Doe')).toBe(true);
        });

        it('should filter users by city', () => {
            const filterByCity = where('city', 'NY');
            const result = filterByCity(users);
            
            expect(result).toHaveLength(3);
            expect(result.every(u => u.city === 'NY')).toBe(true);
        });

        it('should return empty array if no matches', () => {
            const filterByCity = where('city', 'Paris');
            const result = filterByCity(users);
            
            expect(result).toHaveLength(0);
        });
    });

    describe('sort', () => {
        it('should sort users by age ascending', () => {
            const sortByAge = sort('age');
            const result = sortByAge(users);
            
            expect(result[0].age).toBe(28);
            expect(result[1].age).toBe(33);
            expect(result[2].age).toBe(34);
            expect(result[3].age).toBe(35);
            expect(result[4].age).toBe(35);
            expect(result[5].age).toBe(42);
        });

        it('should sort users by name', () => {
            const sortByName = sort('name');
            const result = sortByName(users);
            
            expect(result[0].name).toBe('Bob');
            expect(result[1].name).toBe('Jane');
            expect(result[2].name).toBe('John');
            expect(result[3].name).toBe('John');
            expect(result[4].name).toBe('John');
            expect(result[5].name).toBe('Mike');
        });

        it('should not mutate original array', () => {
            const original = [...users];
            const sortByAge = sort('age');
            sortByAge(users);
            
            expect(users).toEqual(original);
        });
    });

    describe('groupBy', () => {
        it('should group users by city', () => {
            const groupByCity = groupBy('city');
            const result = groupByCity(users);
            
            expect(result).toHaveLength(2);
            
            const nyGroup = result.find(g => g.key === 'NY');
            expect(nyGroup?.items).toHaveLength(3);
            expect(nyGroup?.items.map(u => u.id)).toEqual([1, 2, 5]);
            
            const laGroup = result.find(g => g.key === 'LA');
            expect(laGroup?.items).toHaveLength(3);
            expect(laGroup?.items.map(u => u.id)).toEqual([3, 4, 6]);
        });

        it('should group users by surname', () => {
            const groupBySurname = groupBy('surname');
            const result = groupBySurname(users);
            
            expect(result).toHaveLength(3);
            
            const doeGroup = result.find(g => g.key === 'Doe');
            expect(doeGroup?.items).toHaveLength(4);
            
            const smithGroup = result.find(g => g.key === 'Smith');
            expect(smithGroup?.items).toHaveLength(1);
            
            const johnsonGroup = result.find(g => g.key === 'Johnson');
            expect(johnsonGroup?.items).toHaveLength(1);
        });
    });

    describe('having', () => {
        it('should filter groups with more than 2 items', () => {
            const groupByCity = groupBy('city');
            const groups = groupByCity(users);
            
            const filterGroups = having(group => group.items.length > 2);
            const result = filterGroups(groups);
            
            expect(result).toHaveLength(2);
            expect(result.every(g => g.items.length > 2)).toBe(true);
        });

        it('should filter groups with specific condition', () => {
            const groupByCity = groupBy('city');
            const groups = groupByCity(users);
            
            const filterGroups = having(group => 
                group.items.some(u => u.age > 40)
            );
            const result = filterGroups(groups);
            
            expect(result).toHaveLength(1);
            expect(result[0].key).toBe('LA');
            expect(result[0].items).toHaveLength(3);
        });
    });

    describe('query', () => {
        it('should chain where and sort', () => {
            const pipeline = query<User>(
                where('name', 'John'),
                where('surname', 'Doe'),
                sort('age')
            );
            
            const result = pipeline(users);
            
            expect(result).toHaveLength(3);
            expect(result[0].age).toBe(33);
            expect(result[1].age).toBe(34);
            expect(result[2].age).toBe(35);
        });

        it('should chain groupBy and having', () => {
            const pipeline = query<User>(
                groupBy('city'),
                having(group => group.items.length > 2)
            );
            
            const result = pipeline(users);
            
            expect(result).toHaveLength(2);
            expect((result as any)[0].items).toBeDefined();
            expect((result as any)[0].items.length).toBeGreaterThan(2);
        });

        it('should chain where, groupBy and having', () => {
            const pipeline = query<User>(
                where('surname', 'Doe'),
                groupBy('city'),
                having(group => group.items.some(u => u.age > 34))
            );
            
            const result = pipeline(users);
            
            expect(result).toHaveLength(1);
            const laGroup = (result as any[]).find((g: any) => g.key === 'LA');
            expect(laGroup.items).toHaveLength(2);
            expect(laGroup.items.every((u: User) => u.surname === 'Doe')).toBe(true);
        });

        it('should handle empty pipeline', () => {
            const pipeline = query<User>();
            const result = pipeline(users);
            
            expect(result).toEqual(users);
            expect(result).toHaveLength(6);
        });
    });
});