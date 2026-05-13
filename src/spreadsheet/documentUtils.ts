import { getDisplayValue, makeCellKey } from './formulas';
import type { CellRecord, CellStore, SpreadsheetDocument } from './types';

export const DEFAULT_COLUMN_WIDTH = 120;
export const DEFAULT_ROW_HEIGHT = 32;

export function createSizeMap(length: number, initialValue: number) {
  return Array.from({ length }, () => initialValue);
}

export function cloneDocument(document: SpreadsheetDocument): SpreadsheetDocument {
  return structuredClone(document);
}

export function createEmptyDocument(
  userId: string,
  title: string,
  rowCount: number,
  columnCount: number,
): SpreadsheetDocument {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    userId,
    title,
    createdAt: now,
    updatedAt: now,
    rowCount,
    columnCount,
    cells: {},
    columnWidths: createSizeMap(columnCount, DEFAULT_COLUMN_WIDTH),
    rowHeights: createSizeMap(rowCount, DEFAULT_ROW_HEIGHT),
  };
}

export function cellStoreToMap(cells: CellStore): Map<string, CellRecord> {
  const map = new Map<string, CellRecord>();
  Object.entries(cells).forEach(([key, raw]) => {
    map.set(key, { raw });
  });
  return map;
}

export function mapToCellStore(cells: Map<string, CellRecord>): CellStore {
  const next: CellStore = {};
  cells.forEach((value, key) => {
    if (value.raw.trim() !== '') {
      next[key] = value.raw;
    }
  });
  return next;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function buildDocumentPreview(document: SpreadsheetDocument): string[][] {
  const map = cellStoreToMap(document.cells);
  return Array.from({ length: 3 }, (_, row) =>
    Array.from({ length: 3 }, (_, col) => getDisplayValue(map, row, col)),
  );
}

export function exportDocumentToJson(document: SpreadsheetDocument): string {
  return JSON.stringify(document, null, 2);
}

function escapeCsvValue(value: string): string {
  if (
    value.includes('"') ||
    value.includes(',') ||
    value.includes(';') ||
    value.includes('\n') ||
    value.includes('\r')
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportDocumentToCsv(document: SpreadsheetDocument): string {
  const delimiter = ';';
  const lines: string[] = [];

  for (let row = 0; row < document.rowCount; row += 1) {
    const values = Array.from({ length: document.columnCount }, (_, col) => {
      return escapeCsvValue(document.cells[makeCellKey(row, col)] ?? '');
    });
    lines.push(values.join(delimiter));
  }

  return `\uFEFF${lines.join('\r\n')}`;
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function parseCsv(text: string): string[][] {
  const normalizedText = text.replace(/^\uFEFF/, '');
  const delimiter = detectCsvDelimiter(normalizedText);
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = '';
  let inQuotes = false;

  for (let index = 0; index < normalizedText.length; index += 1) {
    const char = normalizedText[index];
    const nextChar = normalizedText[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      currentRow.push(currentValue);
      currentValue = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1;
      }
      currentRow.push(currentValue);
      rows.push(currentRow);
      currentRow = [];
      currentValue = '';
      continue;
    }

    currentValue += char;
  }

  if (currentValue !== '' || currentRow.length > 0) {
    currentRow.push(currentValue);
    rows.push(currentRow);
  }

  return rows.filter((row) => row.some((item) => item.trim() !== ''));
}

function detectCsvDelimiter(text: string): string {
  const sample = text.split(/\r?\n/, 1)[0] ?? '';
  const candidates = [',', ';', '\t'];
  const scores = new Map<string, number>();

  for (const delimiter of candidates) {
    let count = 0;
    let inQuotes = false;

    for (let index = 0; index < sample.length; index += 1) {
      const char = sample[index];
      const nextChar = sample[index + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === delimiter && !inQuotes) {
        count += 1;
      }
    }

    scores.set(delimiter, count);
  }

  const best = candidates.reduce((currentBest, delimiter) => {
    return (scores.get(delimiter) ?? 0) > (scores.get(currentBest) ?? 0) ? delimiter : currentBest;
  }, candidates[0]);

  return (scores.get(best) ?? 0) > 0 ? best : ',';
}

export function importCsvIntoDocument(document: SpreadsheetDocument, csvText: string): SpreadsheetDocument {
  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    return document;
  }

  const hasColumnHeaderRow = isSpreadsheetHeaderRow(rows[0]);
  const dataRows = hasColumnHeaderRow ? rows.slice(1) : rows;
  const columnCount = Math.max(
    1,
    rows.reduce((max, row) => Math.max(max, row.length), 0) || document.columnCount,
  );
  const nextCells: CellStore = {};

  dataRows.forEach((rowValues, row) => {
    for (let col = 0; col < columnCount; col += 1) {
      const value = rowValues[col] ?? '';
      if (value.trim() !== '') {
        nextCells[makeCellKey(row, col)] = value;
      }
    }
  });

  return {
    ...document,
    rowCount: Math.max(1, dataRows.length || document.rowCount),
    columnCount,
    cells: nextCells,
    columnWidths: createSizeMap(columnCount, DEFAULT_COLUMN_WIDTH),
    rowHeights: createSizeMap(Math.max(1, dataRows.length || document.rowCount), DEFAULT_ROW_HEIGHT),
  };
}

function isSpreadsheetHeaderRow(row: string[] | undefined): boolean {
  if (!row || row.length === 0) {
    return false;
  }

  return row.every((value, index) => {
    const trimmed = value.trim().toUpperCase();
    return trimmed !== '' && trimmed === numberToColumnLabel(index);
  });
}

function numberToColumnLabel(index: number): string {
  let current = index + 1;
  let label = '';

  while (current > 0) {
    const remainder = (current - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    current = Math.floor((current - 1) / 26);
  }

  return label;
}
