import { DeepReadonly, PickedByType, EventHandlers } from './types';

type User = {
  id: number;
  name: string;
  address: {
    city: string;
    street: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  tags: string[];
};

type ReadonlyUser = DeepReadonly<User>;

const user: ReadonlyUser = {
  id: 1,
  name: "John",
  address: {
    city: "NY",
    street: "Main St",
    coordinates: {
      lat: 40.7128,
      lng: -74.0060
    }
  },
  tags: ["admin", "user"]
};

type Config = {
  apiUrl: string;
  timeout: number;
  retries: number;
  debug: boolean;
  version: string;
  cache: boolean;
};

type StringConfig = PickedByType<Config, string>;
type NumberConfig = PickedByType<Config, number>;
type BooleanConfig = PickedByType<Config, boolean>;

type AppEvents = {
  click: { x: number; y: number; button: number };
  keypress: { key: string; ctrlKey: boolean };
  data: { id: number; payload: unknown };
  error: Error;
  ready: void;
};

type AppHandlers = EventHandlers<AppEvents>;

class EventEmitter {
  private handlers: Partial<AppHandlers> = {};

  on<K extends keyof AppHandlers>(event: K, handler: AppHandlers[K]): void {
    this.handlers[event] = handler;
  }

  emit<K extends keyof AppEvents>(event: K, payload: AppEvents[K]): void {
    const handlerName = `on${event.charAt(0).toUpperCase() + event.slice(1)}` as keyof AppHandlers;
    const handler = this.handlers[handlerName];
    if (handler) {
      (handler as any)(payload);
    }
  }
}

const emitter = new EventEmitter();

emitter.on('onClick', (payload) => {
  console.log(`Click at (${payload.x}, ${payload.y})`);
});

emitter.on('onData', (payload) => {
  console.log(`Data received: id=${payload.id}`);
});

emitter.emit('click', { x: 100, y: 200, button: 0 });
emitter.emit('data', { id: 42, payload: { message: "hello" } });

console.log('StringConfig:', {} as StringConfig);
console.log('NumberConfig:', {} as NumberConfig);
console.log('BooleanConfig:', {} as BooleanConfig);