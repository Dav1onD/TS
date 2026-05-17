import { describe, expect, it } from 'vitest';
import { createEmptyDocument } from '../spreadsheet/documentUtils';
import {
  redo,
  selectCell,
  spreadsheetReducer,
  undo,
  updateCell,
} from './spreadsheetSlice';
import { loadDocumentById } from './thunks';

describe('spreadsheetSlice', () => {
  it('opens document and selects first cell', () => {
    const document = createEmptyDocument('user-1', 'Таблица', 5, 5);
    const state = spreadsheetReducer(undefined, loadDocumentById.fulfilled(document, '', document.id));

    expect(state.currentDocument?.id).toBe(document.id);
    expect(state.selectedCell).toEqual({ row: 0, col: 0 });
  });

  it('updates cells and supports undo redo', () => {
    const document = createEmptyDocument('user-1', 'Таблица', 5, 5);
    const opened = spreadsheetReducer(undefined, loadDocumentById.fulfilled(document, '', document.id));
    const selected = spreadsheetReducer(opened, selectCell({ row: 1, col: 2 }));
    const changed = spreadsheetReducer(selected, updateCell({ row: 1, col: 2, value: '42' }));
    const undone = spreadsheetReducer(changed, undo());
    const redone = spreadsheetReducer(undone, redo());

    expect(changed.currentDocument?.cells['1:2']).toBe('42');
    expect(undone.currentDocument?.cells['1:2']).toBeUndefined();
    expect(redone.currentDocument?.cells['1:2']).toBe('42');
  });
});
