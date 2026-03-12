import { describe, it, expect } from 'vitest';
import { 
    createUser,
    createBook,
    calculateArea,
    getStatusColor,
    capitalizeFirstLetter,
    trimAndTransform,
    getFirstElement,
    findById
} from './index';

describe('createUser', () => {
    it('should create user with required fields', () => {
        const user = createUser(1, 'Иван');
        expect(user).toEqual({
            id: 1,
            name: 'Иван',
            isActive: true,
            email: undefined
        });
    });

    it('should create user with email', () => {
        const user = createUser(2, 'Мария', true, 'maria@example.com');
        expect(user).toEqual({
            id: 2,
            name: 'Мария',
            isActive: true,
            email: 'maria@example.com'
        });
    });
});

describe('createBook', () => {
    it('should create book with all fields', () => {
        const book = createBook({
            title: 'Война и мир',
            author: 'Лев Толстой',
            year: 1869,
            genre: 'fiction'
        });

        expect(book).toEqual({
            title: 'Война и мир',
            author: 'Лев Толстой',
            year: 1869,
            genre: 'fiction'
        });
    });

    it('should create book without year', () => {
        const book = createBook({
            title: 'Sapiens',
            author: 'Юваль Харари',
            genre: 'non-fiction'
        });

        expect(book.year).toBeUndefined();
    });
});

describe('calculateArea', () => {
    it('should calculate circle area', () => {
        expect(calculateArea('circle', 5)).toBeCloseTo(78.53981633974483);
    });

    it('should calculate square area', () => {
        expect(calculateArea('square', 4)).toBe(16);
    });
});

describe('getStatusColor', () => {
    it('should return correct colors', () => {
        expect(getStatusColor('active')).toBe('green');
        expect(getStatusColor('inactive')).toBe('gray');
        expect(getStatusColor('new')).toBe('blue');
    });
});

describe('StringFormatter', () => {
    it('should capitalize first letter', () => {
        expect(capitalizeFirstLetter('hello')).toBe('Hello');
    });

    it('should trim spaces', () => {
        expect(trimAndTransform('  hello  ')).toBe('hello');
    });

    it('should uppercase when true', () => {
        expect(capitalizeFirstLetter('hello', true)).toBe('HELLO');
        expect(trimAndTransform('  hello  ', true)).toBe('HELLO');
    });
});

describe('getFirstElement', () => {
    it('should return first element', () => {
        expect(getFirstElement([1, 2, 3])).toBe(1);
        expect(getFirstElement(['a', 'b'])).toBe('a');
    });

    it('should return undefined for empty array', () => {
        expect(getFirstElement([])).toBeUndefined();
    });
});

describe('findById', () => {
    const items = [
        { id: 1, name: 'First' },
        { id: 2, name: 'Second' }
    ];

    it('should find by id', () => {
        expect(findById(items, 2)).toEqual({ id: 2, name: 'Second' });
    });

    it('should return undefined for non-existent id', () => {
        expect(findById(items, 999)).toBeUndefined();
    });
});