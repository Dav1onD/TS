import { createAsyncThunk } from '@reduxjs/toolkit';
import { cloneDocument } from '../spreadsheet/documentUtils';
import type { CreateDocumentInput, DocumentApi, SpreadsheetDocument } from '../spreadsheet/types';
import type { RootState } from './index';

export const CURRENT_USER_ID = 'user-1';

export type StoreExtra = {
  api: DocumentApi;
};

export const fetchDocuments = createAsyncThunk<
  SpreadsheetDocument[],
  void,
  { state: RootState; extra: StoreExtra }
>('documents/fetchDocuments', async (_, { extra }) => {
  return extra.api.listDocuments(CURRENT_USER_ID);
});

export const loadDocumentById = createAsyncThunk<
  SpreadsheetDocument,
  string,
  { state: RootState; extra: StoreExtra }
>('documents/loadDocumentById', async (id, { extra, rejectWithValue }) => {
  const document = await extra.api.getDocumentById(CURRENT_USER_ID, id);
  if (!document) {
    return rejectWithValue('Document not found');
  }

  return cloneDocument(document);
});

export const saveActiveDocument = createAsyncThunk<
  { saved: SpreadsheetDocument; snapshot: string },
  void,
  { state: RootState; extra: StoreExtra }
>('documents/saveActiveDocument', async (_, { extra, getState, rejectWithValue }) => {
  const currentDocument = getState().spreadsheet.currentDocument;
  if (!currentDocument) {
    return rejectWithValue('No active document');
  }

  const snapshot = JSON.stringify(currentDocument);
  const saved = await extra.api.patchDocument(currentDocument.id, currentDocument);
  return { saved, snapshot };
});

export const createDocumentThunk = createAsyncThunk<
  SpreadsheetDocument,
  CreateDocumentInput,
  { state: RootState; extra: StoreExtra }
>('documents/createDocument', async (input, { extra }) => {
  return extra.api.createDocument(CURRENT_USER_ID, input);
});

export const renameDocumentThunk = createAsyncThunk<
  SpreadsheetDocument,
  { id: string; title: string },
  { state: RootState; extra: StoreExtra }
>('documents/renameDocument', async ({ id, title }, { extra }) => {
  return extra.api.renameDocument(id, title);
});

export const deleteDocumentThunk = createAsyncThunk<
  string,
  string,
  { state: RootState; extra: StoreExtra }
>('documents/deleteDocument', async (id, { extra }) => {
  await extra.api.deleteDocument(id);
  return id;
});

export const duplicateDocumentThunk = createAsyncThunk<
  SpreadsheetDocument,
  string,
  { state: RootState; extra: StoreExtra }
>('documents/duplicateDocument', async (id, { extra }) => {
  return extra.api.duplicateDocument(id, CURRENT_USER_ID);
});
