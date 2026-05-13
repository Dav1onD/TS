import type { CellRecord } from './types';

const CELL_REF_REGEX = /\b([A-Z]+)(\d+)\b/g;
const RANGE_FUNCTION_REGEX = /^(SUM|AVERAGE)\(([A-Z]+\d+):([A-Z]+\d+)\)$/i;

export function columnLabelFromIndex(index: number): string {
  let current = index + 1;
  let label = '';

  while (current > 0) {
    const remainder = (current - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    current = Math.floor((current - 1) / 26);
  }

  return label;
}

export function columnIndexFromLabel(label: string): number {
  return label.split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0) - 1;
}

export function makeCellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

export function parsePrimitive(raw: string): string | number | boolean {
  const trimmed = raw.trim();

  if (trimmed === '') {
    return '';
  }

  if (/^(true|false)$/i.test(trimmed)) {
    return trimmed.toLowerCase() === 'true';
  }

  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric) && trimmed !== '') {
    return numeric;
  }

  return raw;
}

function getCellNumericValue(
  cells: Map<string, CellRecord>,
  row: number,
  col: number,
  visited: Set<string>,
): number {
  const value = evaluateCell(cells, row, col, visited);

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'boolean') {
    return Number(value);
  }

  const converted = Number(value);
  return Number.isNaN(converted) ? 0 : converted;
}

function expandRange(startRef: string, endRef: string) {
  const start = parseCellReference(startRef);
  const end = parseCellReference(endRef);

  const rowStart = Math.min(start.row, end.row);
  const rowEnd = Math.max(start.row, end.row);
  const colStart = Math.min(start.col, end.col);
  const colEnd = Math.max(start.col, end.col);

  const items: Array<{ row: number; col: number }> = [];

  for (let row = rowStart; row <= rowEnd; row += 1) {
    for (let col = colStart; col <= colEnd; col += 1) {
      items.push({ row, col });
    }
  }

  return items;
}

export function parseCellReference(reference: string) {
  const match = reference.match(/^([A-Z]+)(\d+)$/);
  if (!match) {
    throw new Error(`Invalid cell reference: ${reference}`);
  }

  return {
    col: columnIndexFromLabel(match[1]),
    row: Number(match[2]) - 1
  };
}

export function evaluateFormula(
  expression: string,
  cells: Map<string, CellRecord>,
  visited: Set<string>,
): string | number {
  const trimmed = expression.trim();
  const rangeMatch = trimmed.match(RANGE_FUNCTION_REGEX);

  if (rangeMatch) {
    const [, functionName, startRef, endRef] = rangeMatch;
    const values = expandRange(startRef.toUpperCase(), endRef.toUpperCase()).map(({ row, col }) =>
      getCellNumericValue(cells, row, col, visited),
    );

    if (functionName.toUpperCase() === 'SUM') {
      return values.reduce((acc, item) => acc + item, 0);
    }

    return values.length === 0 ? 0 : values.reduce((acc, item) => acc + item, 0) / values.length;
  }

  const replaced = trimmed.replace(CELL_REF_REGEX, (_, label: string, rowValue: string) => {
    const row = Number(rowValue) - 1;
    const col = columnIndexFromLabel(label);
    return String(getCellNumericValue(cells, row, col, visited));
  });

  if (!/^[\d+\-*/().\s]+$/.test(replaced)) {
    return '#ERROR';
  }

  try {
    const result = Function(`"use strict"; return (${replaced});`)();
    return typeof result === 'number' && Number.isFinite(result) ? result : '#ERROR';
  } catch {
    return '#ERROR';
  }
}

export function evaluateCell(
  cells: Map<string, CellRecord>,
  row: number,
  col: number,
  visited = new Set<string>(),
): string | number | boolean {
  const key = makeCellKey(row, col);

  if (visited.has(key)) {
    return '#CYCLE';
  }

  const cell = cells.get(key);
  if (!cell || cell.raw.trim() === '') {
    return '';
  }

  if (!cell.raw.startsWith('=')) {
    return parsePrimitive(cell.raw);
  }

  visited.add(key);
  const result = evaluateFormula(cell.raw.slice(1), cells, visited);
  visited.delete(key);
  return result;
}

export function getDisplayValue(cells: Map<string, CellRecord>, row: number, col: number): string {
  const value = evaluateCell(cells, row, col);
  return String(value);
}
