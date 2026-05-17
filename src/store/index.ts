import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { localDocumentApi } from '../spreadsheet/mockApi';
import type { DocumentApi } from '../spreadsheet/types';
import { createAutoSaveMiddleware } from './autoSaveMiddleware';
import { authReducer } from './authSlice';
import { documentsReducer } from './documentsSlice';
import { spreadsheetReducer } from './spreadsheetSlice';
import { uiReducer } from './uiSlice';

export const rootReducer = combineReducers({
  auth: authReducer,
  documents: documentsReducer,
  spreadsheet: spreadsheetReducer,
  ui: uiReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export function createAppStore(api: DocumentApi = localDocumentApi) {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: { api },
        },
      }).concat(createAutoSaveMiddleware()),
    devTools: true,
  });
}

export type AppStore = ReturnType<typeof createAppStore>;
export type AppDispatch = AppStore['dispatch'];
