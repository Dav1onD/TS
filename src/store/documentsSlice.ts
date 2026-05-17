import { createSlice } from '@reduxjs/toolkit';
import type { SpreadsheetDocument } from '../spreadsheet/types';
import {
  createDocumentThunk,
  deleteDocumentThunk,
  duplicateDocumentThunk,
  fetchDocuments,
  loadDocumentById,
  renameDocumentThunk,
  saveActiveDocument,
} from './thunks';

export type DocumentsState = {
  items: SpreadsheetDocument[];
  isLoading: boolean;
  activeDocumentId: string | null;
};

const initialState: DocumentsState = {
  items: [],
  isLoading: true,
  activeDocumentId: null,
};

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    closeActiveDocument(state) {
      state.activeDocumentId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.items = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchDocuments.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(loadDocumentById.fulfilled, (state, action) => {
        state.activeDocumentId = action.payload.id;
      })
      .addCase(createDocumentThunk.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.activeDocumentId = action.payload.id;
      })
      .addCase(renameDocumentThunk.fulfilled, (state, action) => {
        state.items = state.items.map((item) => (item.id === action.payload.id ? action.payload : item));
      })
      .addCase(deleteDocumentThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
        if (state.activeDocumentId === action.payload) {
          state.activeDocumentId = null;
        }
      })
      .addCase(duplicateDocumentThunk.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(saveActiveDocument.fulfilled, (state, action) => {
        state.items = state.items.map((item) => (item.id === action.payload.saved.id ? action.payload.saved : item));
      });
  },
});

export const { closeActiveDocument } = documentsSlice.actions;
export const documentsReducer = documentsSlice.reducer;
