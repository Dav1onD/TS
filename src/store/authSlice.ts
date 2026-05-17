import { createSlice } from '@reduxjs/toolkit';

export type AuthState = {
  mockUser: {
    id: string;
    name: string;
  } | null;
};

const initialState: AuthState = {
  mockUser: {
    id: 'user-1',
    name: 'Учебный пользователь',
  },
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
});

export const authReducer = authSlice.reducer;
