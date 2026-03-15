import {
    query,
    createWhere,
    createSort,
    createGroupBy,
    createHaving,
    Group
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

console.log('=== Фильтрация и сортировка ===');
const search = query<User>(
    where("name", "John"),
    where("surname", "Doe"),
    sort("age"),
);

const result = search(users);
console.log(JSON.stringify(result, null, 2));

console.log('\n=== Группировка по городу ===');
const groupByCity = groupBy("city");
const groups = groupByCity(users);
console.log(JSON.stringify(groups, null, 2));

console.log('\n=== Группировка и фильтр по группам ===');
const groupAndFilter = query<User>(
    groupBy("city"),
    having(group => group.items.length > 2)
);

const grouped = groupAndFilter(users);
console.log(JSON.stringify(grouped, null, 2));

console.log('\n=== Комбинированный конвейер ===');
const pipeline = query<User>(
    where("surname", "Doe"),
    groupBy("city"),
    having(group => group.items.some(u => u.age > 34))
);

const res = pipeline(users);
console.log(JSON.stringify(res, null, 2));