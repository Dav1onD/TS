import { describe, it, expectTypeOf } from 'vitest';
import { DeepReadonly, PickedByType, EventHandlers } from './types';

describe('DeepReadonly', () => {
  it('should make all properties readonly at all levels', () => {
    type Original = {
      a: number;
      b: {
        c: string;
        d: {
          e: boolean;
        };
      };
    };
    
    type Readonly = DeepReadonly<Original>;
    
    expectTypeOf<Readonly>().toMatchTypeOf<{
      readonly a: number;
      readonly b: {
        readonly c: string;
        readonly d: {
          readonly e: boolean;
        };
      };
    }>();
  });

  it('should work with arrays', () => {
    type Original = {
      items: number[];
      nested: {
        values: string[];
      };
    };
    
    type Readonly = DeepReadonly<Original>;
    
    expectTypeOf<Readonly>().toMatchTypeOf<{
      readonly items: readonly number[];
      readonly nested: {
        readonly values: readonly string[];
      };
    }>();
  });

  it('should work with primitive types', () => {
    type Original = {
      str: string;
      num: number;
      bool: boolean;
      nul: null;
      und: undefined;
    };
    
    type Readonly = DeepReadonly<Original>;
    
    expectTypeOf<Readonly>().toMatchTypeOf<{
      readonly str: string;
      readonly num: number;
      readonly bool: boolean;
      readonly nul: null;
      readonly und: undefined;
    }>();
  });
});

describe('PickedByType', () => {
  it('should pick only string properties', () => {
    type Original = {
      id: number;
      name: string;
      age: number;
      email: string;
      active: boolean;
    };
    
    type StringProps = PickedByType<Original, string>;
    
    expectTypeOf<StringProps>().toMatchTypeOf<{
      name: string;
      email: string;
    }>();
  });

  it('should pick only number properties', () => {
    type Original = {
      id: number;
      name: string;
      age: number;
      email: string;
      active: boolean;
    };
    
    type NumberProps = PickedByType<Original, number>;
    
    expectTypeOf<NumberProps>().toMatchTypeOf<{
      id: number;
      age: number;
    }>();
  });

  it('should pick only boolean properties', () => {
    type Original = {
      id: number;
      name: string;
      age: number;
      email: string;
      active: boolean;
      verified: boolean;
    };
    
    type BooleanProps = PickedByType<Original, boolean>;
    
    expectTypeOf<BooleanProps>().toMatchTypeOf<{
      active: boolean;
      verified: boolean;
    }>();
  });

  it('should return empty object when no properties match', () => {
    type Original = {
      id: number;
      name: string;
      age: number;
    };
    
    type BooleanProps = PickedByType<Original, boolean>;
    
    expectTypeOf<BooleanProps>().toMatchTypeOf<{}>();
  });

  it('should work with union types', () => {
    type Original = {
      id: number;
      value: string | number;
      status: 'active' | 'inactive';
    };
    
    type StringOrNumberProps = PickedByType<Original, string | number>;
    
    expectTypeOf<StringOrNumberProps>().toMatchTypeOf<{
      value: string | number;
      status: 'active' | 'inactive';
    }>();
  });
});

describe('EventHandlers', () => {
  it('should generate onEventName handlers from event object', () => {
    type Events = {
      click: { x: number; y: number };
      submit: { data: string };
      focus: void;
      blur: void;
    };
    
    type Handlers = EventHandlers<Events>;
    
    expectTypeOf<Handlers>().toMatchTypeOf<{
      onClick: (payload: { x: number; y: number }) => void;
      onSubmit: (payload: { data: string }) => void;
      onFocus: (payload: void) => void;
      onBlur: (payload: void) => void;
    }>();
  });

  it('should work with single event', () => {
    type Events = {
      change: string;
    };
    
    type Handlers = EventHandlers<Events>;
    
    expectTypeOf<Handlers>().toMatchTypeOf<{
      onChange: (payload: string) => void;
    }>();
  });

  it('should handle complex payload types', () => {
    type Events = {
      data: { id: number; values: number[]; meta: { timestamp: number } };
      error: Error;
      complete: null;
    };
    
    type Handlers = EventHandlers<Events>;
    
    expectTypeOf<Handlers>().toMatchTypeOf<{
      onData: (payload: { id: number; values: number[]; meta: { timestamp: number } }) => void;
      onError: (payload: Error) => void;
      onComplete: (payload: null) => void;
    }>();
  });

  it('should preserve property order', () => {
    type Events = {
      first: string;
      second: number;
      third: boolean;
    };
    
    type Handlers = EventHandlers<Events>;
    
    expectTypeOf<Handlers>().toMatchTypeOf<{
      onFirst: (payload: string) => void;
      onSecond: (payload: number) => void;
      onThird: (payload: boolean) => void;
    }>();
  });

  it('should work with empty events object', () => {
    type Events = {};
    type Handlers = EventHandlers<Events>;
    expectTypeOf<Handlers>().toMatchTypeOf<{}>();
  });
});