import { describe, expect, it } from 'vitest';
import { evaluateCell, makeCellKey } from './formulas';
import { createEmptyDocument, exportDocumentToCsv, importCsvIntoDocument } from './documentUtils';
import type { CellRecord } from './types';

function createCells(entries: Array<[number, number, string]>) {
  const map = new Map<string, CellRecord>();
  for (const [row, col, raw] of entries) {
    map.set(makeCellKey(row, col), { raw });
  }
  return map;
}

describe('formula evaluation', () => {
  it('calculates SUM over a range', () => {
    const cells = createCells([
      [0, 0, '1'],
      [1, 0, '2'],
      [2, 0, '3'],
      [3, 0, '=SUM(A1:A3)']
    ]);

    expect(evaluateCell(cells, 3, 0)).toBe(6);
  });

  it('calculates AVERAGE over a range', () => {
    const cells = createCells([
      [0, 1, '3'],
      [1, 1, '6'],
      [2, 1, '=AVERAGE(B1:B2)']
    ]);

    expect(evaluateCell(cells, 2, 1)).toBe(4.5);
  });

  it('supports arithmetic formulas with references', () => {
    const cells = createCells([
      [0, 0, '4'],
      [0, 1, '5'],
      [1, 0, '=A1+B1'],
      [1, 1, '=A1*2']
    ]);

    expect(evaluateCell(cells, 1, 0)).toBe(9);
    expect(evaluateCell(cells, 1, 1)).toBe(8);
  });

  it('exports csv with semicolon delimiter and CRLF rows', () => {
    const document = createEmptyDocument('user-1', 'CSV', 2, 2);
    document.cells['0:0'] = 'name';
    document.cells['0:1'] = 'value';
    document.cells['1:0'] = 'test';
    document.cells['1:1'] = '123';

    const csv = exportDocumentToCsv(document);

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('name;value\r\n');
    expect(csv).not.toContain('A;B\r\n');
  });

  it('imports semicolon separated csv into rows and columns', () => {
    const document = createEmptyDocument('user-1', 'CSV', 1, 1);
    const imported = importCsvIntoDocument(document, '1;2;3\r\n4;5;6');

    expect(imported.columnCount).toBe(3);
    expect(imported.rowCount).toBe(2);
    expect(imported.cells[makeCellKey(0, 0)]).toBe('1');
    expect(imported.cells[makeCellKey(0, 2)]).toBe('3');
    expect(imported.cells[makeCellKey(1, 1)]).toBe('5');
  });

  it('imports csv with spreadsheet letter header row', () => {
    const document = createEmptyDocument('user-1', 'CSV', 1, 1);
    const imported = importCsvIntoDocument(document, 'A;B;C\r\n1;2;3\r\n4;5;6');

    expect(imported.columnCount).toBe(3);
    expect(imported.rowCount).toBe(2);
    expect(imported.cells[makeCellKey(0, 0)]).toBe('1');
    expect(imported.cells[makeCellKey(0, 2)]).toBe('3');
    expect(imported.cells[makeCellKey(1, 1)]).toBe('5');
  });
});
