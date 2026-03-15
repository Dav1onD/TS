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
  
  const validPipeline1 = query<User>(
    where('name', 'John'),
    where('surname', 'Doe'),
    sort('age')
  );
  
  const validPipeline2 = query<User>(
    where('surname', 'Doe'),
    groupBy('city'),
    having(group => group.items.length > 1)
  );
  
  console.log('Pipeline 1 result:', validPipeline1(users));
  console.log('Pipeline 2 result:', validPipeline2(users));