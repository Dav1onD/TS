export interface User {
    id: number;
    name: string;
    email?: string;
    isActive: boolean;
}

export function createUser(id: number, name: string, isActive: boolean = true, email?: string): User {
    return {
        id,
        name,
        email,
        isActive
    };
}

export type Genre = 'fiction' | 'non-fiction';

export interface Book {
    title: string;
    author: string;
    year?: number;
    genre: Genre;
}

export function createBook(book: Book): Book {
    return book;
}

export function calculateArea(shape: 'circle', radius: number): number;
export function calculateArea(shape: 'square', side: number): number;
export function calculateArea(shape: 'circle' | 'square', param: number): number {
    if (shape === 'circle') {
        return Math.PI * param * param;
    } else {
        return param * param;
    }
}

export type Status = 'active' | 'inactive' | 'new';

export function getStatusColor(status: Status): string {
    switch (status) {
        case 'active':
            return 'green';
        case 'inactive':
            return 'gray';
        case 'new':
            return 'blue';
        default:
            const exhaustiveCheck: never = status;
            return exhaustiveCheck;
    }
}

export type StringFormatter = (input: string, uppercase?: boolean) => string;

export const capitalizeFirstLetter: StringFormatter = (input, uppercase = false) => {
    let result = input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
    if (uppercase) {
        result = result.toUpperCase();
    }
    return result;
};

export const trimAndTransform: StringFormatter = (input, uppercase = false) => {
    let result = input.trim();
    if (uppercase) {
        result = result.toUpperCase();
    }
    return result;
};

export function getFirstElement<T>(arr: T[]): T | undefined {
    return arr.length > 0 ? arr[0] : undefined;
}

export interface HasId {
    id: number;
}

export function findById<T extends HasId>(items: T[], id: number): T | undefined {
    return items.find(item => item.id === id);
}

// Демонстрационная часть (остается без изменений)
const user1 = createUser(1, 'Иван');
const user2 = createUser(2, 'Мария', true, 'maria@example.com');
console.log('Пользователь 1:', user1);
console.log('Пользователь 2:', user2);

const book1 = createBook({
    title: 'Война и мир',
    author: 'Лев Толстой',
    year: 1869,
    genre: 'fiction'
});

const book2 = createBook({
    title: 'Sapiens',
    author: 'Юваль Харари',
    genre: 'non-fiction'
});

console.log('Книга 1:', book1);
console.log('Книга 2:', book2);

console.log('Площадь круга:', calculateArea('circle', 5));
console.log('Площадь квадрата:', calculateArea('square', 4));

console.log('active:', getStatusColor('active'));
console.log('inactive:', getStatusColor('inactive'));
console.log('new:', getStatusColor('new'));

console.log(capitalizeFirstLetter('hello'));
console.log(capitalizeFirstLetter('hello', true));
console.log(trimAndTransform('  hello world  '));
console.log(trimAndTransform('  hello world  ', true));

const numbers = [1, 2, 3, 4, 5];
const strings = ['a', 'b', 'c', 'd'];
const emptyArray: any[] = [];

console.log(getFirstElement(numbers));
console.log(getFirstElement(strings));
console.log(getFirstElement(emptyArray));

interface Product extends HasId {
    name: string;
    price: number;
}

interface Person extends HasId {
    name: string;
    age: number;
}

const products: Product[] = [
    { id: 1, name: 'Ноутбук', price: 999 },
    { id: 2, name: 'Мышь', price: 25 },
    { id: 3, name: 'Клавиатура', price: 75 }
];

const people: Person[] = [
    { id: 10, name: 'Анна', age: 25 },
    { id: 20, name: 'Петр', age: 30 },
    { id: 30, name: 'Елена', age: 28 }
];

console.log(findById(products, 2));
console.log(findById(people, 20));
console.log(findById(products, 999));