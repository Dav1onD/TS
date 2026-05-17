import type { Middleware } from '@reduxjs/toolkit';
import {
  deleteColumn,
  deleteRow,
  importCsv,
  insertColumn,
  insertRow,
  redo,
  setColumnWidth,
  setDocumentTitle,
  setRowHeight,
  undo,
  updateCell,
} from './spreadsheetSlice';
import { saveActiveDocument } from './thunks';
import { setSaveStatus } from './uiSlice';
import type { RootState } from './index';

const AUTOSAVE_DELAY_MS = 500;

const watchedActions: Set<string> = new Set([
  deleteColumn.type,
  deleteRow.type,
  importCsv.type,
  insertColumn.type,
  insertRow.type,
  redo.type,
  setColumnWidth.type,
  setDocumentTitle.type,
  setRowHeight.type,
  undo.type,
  updateCell.type,
]);

export function createAutoSaveMiddleware(): Middleware<{}, RootState> {
  let timeoutId: number | null = null;

  return (storeApi) => (next) => (action) => {
    const result = next(action);
    const typedAction: { type: string } | null =
      action && typeof action === 'object' && 'type' in action && typeof action.type === 'string'
        ? { type: action.type }
        : null;

    if (
      typedAction &&
      (saveActiveDocument.fulfilled.match(typedAction) || saveActiveDocument.rejected.match(typedAction))
    ) {
      timeoutId = null;
      const state = storeApi.getState();
      if (
        state.spreadsheet.currentDocument &&
        JSON.stringify(state.spreadsheet.currentDocument) !== state.spreadsheet.lastSavedSerialized
      ) {
        storeApi.dispatch(setSaveStatus('pending'));
      }
      return result;
    }

    if (!typedAction || !watchedActions.has(typedAction.type)) {
      return result;
    }

    const state = storeApi.getState();
    if (!state.spreadsheet.currentDocument) {
      return result;
    }

    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }

    storeApi.dispatch(setSaveStatus('pending'));
    timeoutId = window.setTimeout(() => {
      void storeApi.dispatch(saveActiveDocument() as never);
    }, AUTOSAVE_DELAY_MS);

    return result;
  };
}
