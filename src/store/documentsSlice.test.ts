import { describe, expect, it } from 'vitest';
import { createEmptyDocument } from '../spreadsheet/documentUtils';
import { documentsReducer, closeActiveDocument } from './documentsSlice';
import {
  createDocumentThunk,
  deleteDocumentThunk,
  fetchDocuments,
  loadDocumentById,
  renameDocumentThunk,
} from './thunks';

describe('documentsSlice', () => {
  it('stores fetched documents', () => {
    const document = createEmptyDocument('user-1', 'Документ', 5, 5);
    const state = documentsReducer(undefined, fetchDocuments.fulfilled([document], '', undefined));

    expect(state.items).toEqual([document]);
    expect(state.isLoading).toBe(false);
  });

  it('sets active document id on open and clears it on close', () => {
    const document = createEmptyDocument('user-1', 'Документ', 5, 5);
    const opened = documentsReducer(undefined, loadDocumentById.fulfilled(document, '', document.id));
    const closed = documentsReducer(opened, closeActiveDocument());

    expect(opened.activeDocumentId).toBe(document.id);
    expect(closed.activeDocumentId).toBeNull();
  });

  it('updates items for create rename and delete', () => {
    const document = createEmptyDocument('user-1', 'Документ', 5, 5);
    const created = documentsReducer(undefined, createDocumentThunk.fulfilled(document, '', {
      title: 'Документ',
      rowCount: 5,
      columnCount: 5,
    }));
    const renamed = documentsReducer(
      created,
      renameDocumentThunk.fulfilled({ ...document, title: 'Новое имя' }, '', {
        id: document.id,
        title: 'Новое имя',
      }),
    );
    const deleted = documentsReducer(renamed, deleteDocumentThunk.fulfilled(document.id, '', document.id));

    expect(created.items).toHaveLength(1);
    expect(renamed.items[0].title).toBe('Новое имя');
    expect(deleted.items).toHaveLength(0);
  });
});
