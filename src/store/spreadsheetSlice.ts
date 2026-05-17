import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { importCsvIntoDocument } from '../spreadsheet/documentUtils';
import type { CellCoord, SelectionRange, SpreadsheetDocument } from '../spreadsheet/types';
import { makeCellKey } from '../spreadsheet/formulas';
import {
  createDocumentThunk,
  deleteDocumentThunk,
  loadDocumentById,
  renameDocumentThunk,
  saveActiveDocument,
} from './thunks';

const MIN_COLUMN_WIDTH = 48;
const MIN_ROW_HEIGHT = 24;

export type SpreadsheetState = {
  currentDocument: SpreadsheetDocument | null;
  selectedCell: CellCoord;
  selectionRange: SelectionRange | null;
  history: SpreadsheetDocument[];
  future: SpreadsheetDocument[];
  lastSavedSerialized: string;
};

const initialCell: CellCoord = { row: 0, col: 0 };

const initialState: SpreadsheetState = {
  currentDocument: null,
  selectedCell: initialCell,
  selectionRange: null,
  history: [],
  future: [],
  lastSavedSerialized: '',
};

function withHistory(
  state: SpreadsheetState,
  updater: (document: SpreadsheetDocument) => SpreadsheetDocument,
) {
  if (!state.currentDocument) {
    return;
  }

  const currentSerialized = JSON.stringify(state.currentDocument);
  const nextDocument = updater(state.currentDocument);
  const nextSerialized = JSON.stringify(nextDocument);

  if (currentSerialized === nextSerialized) {
    return;
  }

  state.history.push(state.currentDocument);
  state.currentDocument = nextDocument;
  state.future = [];
}

function setCellValue(document: SpreadsheetDocument, row: number, col: number, value: string) {
  const key = makeCellKey(row, col);
  const nextCells = { ...document.cells };

  if (value.trim() === '') {
    delete nextCells[key];
  } else {
    nextCells[key] = value;
  }

  return { ...document, cells: nextCells };
}

function shiftRows(document: SpreadsheetDocument, rowIndex: number, direction: 1 | -1) {
  const nextCells: Record<string, string> = {};
  Object.entries(document.cells).forEach(([key, raw]) => {
    const [row, col] = key.split(':').map(Number);
    if (direction === -1 && row === rowIndex) {
      return;
    }
    const targetRow = row >= rowIndex && direction === 1 ? row + 1 : row > rowIndex ? row - 1 : row;
    nextCells[makeCellKey(targetRow, col)] = raw;
  });

  const rowHeights =
    direction === 1
      ? [...document.rowHeights.slice(0, rowIndex), MIN_ROW_HEIGHT + 8, ...document.rowHeights.slice(rowIndex)]
      : document.rowHeights.filter((_, index) => index !== rowIndex);

  return {
    ...document,
    rowCount: Math.max(1, document.rowCount + direction),
    cells: nextCells,
    rowHeights,
  };
}

function shiftColumns(document: SpreadsheetDocument, colIndex: number, direction: 1 | -1) {
  const nextCells: Record<string, string> = {};
  Object.entries(document.cells).forEach(([key, raw]) => {
    const [row, col] = key.split(':').map(Number);
    if (direction === -1 && col === colIndex) {
      return;
    }
    const targetCol = col >= colIndex && direction === 1 ? col + 1 : col > colIndex ? col - 1 : col;
    nextCells[makeCellKey(row, targetCol)] = raw;
  });

  const columnWidths =
    direction === 1
      ? [...document.columnWidths.slice(0, colIndex), 120, ...document.columnWidths.slice(colIndex)]
      : document.columnWidths.filter((_, index) => index !== colIndex);

  return {
    ...document,
    columnCount: Math.max(1, document.columnCount + direction),
    cells: nextCells,
    columnWidths,
  };
}

const spreadsheetSlice = createSlice({
  name: 'spreadsheet',
  initialState,
  reducers: {
    closeDocument(state) {
      state.currentDocument = null;
      state.selectedCell = initialCell;
      state.selectionRange = null;
      state.history = [];
      state.future = [];
      state.lastSavedSerialized = '';
    },
    selectCell(state, action: PayloadAction<CellCoord>) {
      state.selectedCell = action.payload;
    },
    selectRange(state, action: PayloadAction<SelectionRange | null>) {
      state.selectionRange = action.payload;
    },
    setDocumentTitle(state, action: PayloadAction<string>) {
      withHistory(state, (document) => ({ ...document, title: action.payload }));
    },
    updateCell(state, action: PayloadAction<{ row: number; col: number; value: string }>) {
      withHistory(state, (document) =>
        setCellValue(document, action.payload.row, action.payload.col, action.payload.value),
      );
    },
    setColumnWidth(state, action: PayloadAction<{ index: number; width: number }>) {
      withHistory(state, (document) => ({
        ...document,
        columnWidths: document.columnWidths.map((value, idx) =>
          idx === action.payload.index ? Math.max(MIN_COLUMN_WIDTH, action.payload.width) : value,
        ),
      }));
    },
    setRowHeight(state, action: PayloadAction<{ index: number; height: number }>) {
      withHistory(state, (document) => ({
        ...document,
        rowHeights: document.rowHeights.map((value, idx) =>
          idx === action.payload.index ? Math.max(MIN_ROW_HEIGHT, action.payload.height) : value,
        ),
      }));
    },
    insertRow(state, action: PayloadAction<number>) {
      withHistory(state, (document) => shiftRows(document, action.payload, 1));
    },
    deleteRow(state, action: PayloadAction<number>) {
      withHistory(state, (document) => shiftRows(document, action.payload, -1));
    },
    insertColumn(state, action: PayloadAction<number>) {
      withHistory(state, (document) => shiftColumns(document, action.payload, 1));
    },
    deleteColumn(state, action: PayloadAction<number>) {
      withHistory(state, (document) => shiftColumns(document, action.payload, -1));
    },
    importCsv(state, action: PayloadAction<string>) {
      withHistory(state, (document) => importCsvIntoDocument(document, action.payload));
    },
    undo(state) {
      const previous = state.history.pop();
      if (!previous || !state.currentDocument) {
        return;
      }
      state.future.unshift(state.currentDocument);
      state.currentDocument = previous;
    },
    redo(state) {
      const next = state.future.shift();
      if (!next || !state.currentDocument) {
        return;
      }
      state.history.push(state.currentDocument);
      state.currentDocument = next;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadDocumentById.fulfilled, (state, action) => {
        state.currentDocument = action.payload;
        state.selectedCell = initialCell;
        state.selectionRange = { start: initialCell, end: initialCell };
        state.history = [];
        state.future = [];
        state.lastSavedSerialized = JSON.stringify(action.payload);
      })
      .addCase(createDocumentThunk.fulfilled, (state, action) => {
        state.currentDocument = action.payload;
        state.selectedCell = initialCell;
        state.selectionRange = { start: initialCell, end: initialCell };
        state.history = [];
        state.future = [];
        state.lastSavedSerialized = JSON.stringify(action.payload);
      })
      .addCase(renameDocumentThunk.fulfilled, (state, action) => {
        if (state.currentDocument?.id === action.payload.id) {
          state.currentDocument = { ...state.currentDocument, title: action.payload.title };
        }
      })
      .addCase(deleteDocumentThunk.fulfilled, (state, action) => {
        if (state.currentDocument?.id === action.payload) {
          state.currentDocument = null;
          state.selectionRange = null;
          state.history = [];
          state.future = [];
          state.lastSavedSerialized = '';
        }
      })
      .addCase(saveActiveDocument.fulfilled, (state, action) => {
        if (state.currentDocument?.id !== action.payload.saved.id) {
          return;
        }

        if (JSON.stringify(state.currentDocument) === action.payload.snapshot) {
          state.currentDocument = action.payload.saved;
        }

        state.lastSavedSerialized = JSON.stringify(action.payload.saved);
      });
  },
});

export const {
  closeDocument,
  deleteColumn,
  deleteRow,
  importCsv,
  insertColumn,
  insertRow,
  redo,
  selectCell,
  selectRange,
  setColumnWidth,
  setDocumentTitle,
  setRowHeight,
  undo,
  updateCell,
} = spreadsheetSlice.actions;
export const spreadsheetReducer = spreadsheetSlice.reducer;
