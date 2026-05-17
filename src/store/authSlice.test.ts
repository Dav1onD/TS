import { describe, expect, it } from 'vitest';
import { authReducer } from './authSlice';

describe('authSlice', () => {
  it('keeps mock user in store', () => {
    const state = authReducer(undefined, { type: 'unknown' });

    expect(state.mockUser?.id).toBe('user-1');
  });
});
