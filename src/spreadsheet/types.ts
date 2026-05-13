export type CellCoord = {
  row: number;
  col: number;
};

export type CellRecord = {
  raw: string;
};

export type CellStore = Record<string, string>;

export type SelectionRange = {
  start: CellCoord;
  end: CellCoord;
};

export type ContextMenuState = {
  x: number;
  y: number;
  row: number;
  col: number;
} | null;

export type SpreadsheetDocument = {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  rowCount: number;
  columnCount: number;
  cells: CellStore;
  columnWidths: number[];
  rowHeights: number[];
};

export type DocumentSaveStatus = 'saved' | 'saving' | 'error' | 'pending';

export type CreateDocumentInput = {
  title: string;
  rowCount: number;
  columnCount: number;
};

export type DocumentApi = {
  listDocuments: (userId: string) => Promise<SpreadsheetDocument[]>;
  createDocument: (userId: string, input: CreateDocumentInput) => Promise<SpreadsheetDocument>;
  renameDocument: (id: string, title: string) => Promise<SpreadsheetDocument>;
  deleteDocument: (id: string) => Promise<void>;
  duplicateDocument: (id: string, userId: string) => Promise<SpreadsheetDocument>;
  patchDocument: (id: string, document: SpreadsheetDocument) => Promise<SpreadsheetDocument>;
};
