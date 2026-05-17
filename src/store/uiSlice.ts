import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CreateDocumentInput, DocumentSaveStatus } from '../spreadsheet/types';
import { createDocumentThunk, loadDocumentById, renameDocumentThunk, saveActiveDocument } from './thunks';

export type UiState = {
  isCreateModalOpen: boolean;
  isImportModalOpen: boolean;
  saveStatus: DocumentSaveStatus;
  notification: string | null;
  renamingDocumentId: string | null;
  renameValue: string;
  csvImportText: string;
  createInput: CreateDocumentInput;
};

export const defaultCreateInput: CreateDocumentInput = {
  title: 'Новый документ',
  rowCount: 100,
  columnCount: 26,
};

const initialState: UiState = {
  isCreateModalOpen: false,
  isImportModalOpen: false,
  saveStatus: 'saved',
  notification: null,
  renamingDocumentId: null,
  renameValue: '',
  csvImportText: '',
  createInput: defaultCreateInput,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openCreateModal(state) {
      state.isCreateModalOpen = true;
    },
    closeCreateModal(state) {
      state.isCreateModalOpen = false;
    },
    setCreateInput(state, action: PayloadAction<Partial<CreateDocumentInput>>) {
      state.createInput = { ...state.createInput, ...action.payload };
    },
    openImportModal(state) {
      state.isImportModalOpen = true;
    },
    closeImportModal(state) {
      state.isImportModalOpen = false;
      state.csvImportText = '';
    },
    setCsvImportText(state, action: PayloadAction<string>) {
      state.csvImportText = action.payload;
    },
    startRenaming(state, action: PayloadAction<{ id: string; title: string }>) {
      state.renamingDocumentId = action.payload.id;
      state.renameValue = action.payload.title;
    },
    stopRenaming(state) {
      state.renamingDocumentId = null;
      state.renameValue = '';
    },
    setRenameValue(state, action: PayloadAction<string>) {
      state.renameValue = action.payload;
    },
    setSaveStatus(state, action: PayloadAction<DocumentSaveStatus>) {
      state.saveStatus = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadDocumentById.fulfilled, (state) => {
        state.saveStatus = 'saved';
        state.isImportModalOpen = false;
        state.csvImportText = '';
      })
      .addCase(createDocumentThunk.fulfilled, (state) => {
        state.isCreateModalOpen = false;
        state.createInput = defaultCreateInput;
        state.saveStatus = 'saved';
      })
      .addCase(renameDocumentThunk.fulfilled, (state) => {
        state.renamingDocumentId = null;
        state.renameValue = '';
      })
      .addCase(saveActiveDocument.pending, (state) => {
        state.saveStatus = 'saving';
      })
      .addCase(saveActiveDocument.fulfilled, (state) => {
        state.saveStatus = 'saved';
      })
      .addCase(saveActiveDocument.rejected, (state) => {
        state.saveStatus = 'error';
      });
  },
});

export const {
  closeCreateModal,
  closeImportModal,
  openCreateModal,
  openImportModal,
  setCreateInput,
  setCsvImportText,
  setRenameValue,
  setSaveStatus,
  startRenaming,
  stopRenaming,
} = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
