import { useEffect, useMemo, useRef, useState } from 'react';
import { columnLabelFromIndex, getDisplayValue, makeCellKey } from './formulas';
import { cellStoreToMap } from './documentUtils';
import type { CellCoord, ContextMenuState, SelectionRange, SpreadsheetDocument } from './types';

const HEADER_HEIGHT = 36;
const INDEX_COLUMN_WIDTH = 56;
const OVERSCAN = 8;
const MIN_COLUMN_WIDTH = 48;
const MIN_ROW_HEIGHT = 24;

type SpreadsheetProps = {
  document: SpreadsheetDocument;
  onChange: React.Dispatch<React.SetStateAction<SpreadsheetDocument | null>>;
};

function normalizeRange(range: SelectionRange): SelectionRange {
  return {
    start: {
      row: Math.min(range.start.row, range.end.row),
      col: Math.min(range.start.col, range.end.col),
    },
    end: {
      row: Math.max(range.start.row, range.end.row),
      col: Math.max(range.start.col, range.end.col),
    },
  };
}

function isInsideRange(row: number, col: number, range: SelectionRange | null) {
  if (!range) {
    return false;
  }

  const normalized = normalizeRange(range);
  return (
    row >= normalized.start.row &&
    row <= normalized.end.row &&
    col >= normalized.start.col &&
    col <= normalized.end.col
  );
}

function prefixSums(values: number[]) {
  const offsets = [0];
  for (const value of values) {
    offsets.push(offsets[offsets.length - 1] + value);
  }
  return offsets;
}

function findVisibleIndex(offsets: number[], position: number) {
  let low = 0;
  let high = offsets.length - 1;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (offsets[mid] <= position) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return Math.max(0, low - 1);
}

export function Spreadsheet({ document, onChange }: SpreadsheetProps) {
  const [selectedCell, setSelectedCell] = useState<CellCoord>({ row: 0, col: 0 });
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(null);
  const [editingCell, setEditingCell] = useState<CellCoord | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(560);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const cellsMap = useMemo(() => cellStoreToMap(document.cells), [document.cells]);
  const columnOffsets = useMemo(() => prefixSums(document.columnWidths), [document.columnWidths]);
  const rowOffsets = useMemo(() => prefixSums(document.rowHeights), [document.rowHeights]);
  const totalWidth = columnOffsets[columnOffsets.length - 1];
  const totalHeight = rowOffsets[rowOffsets.length - 1];
  const activeRawValue = document.cells[makeCellKey(selectedCell.row, selectedCell.col)] ?? '';

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const updateHeight = () => setViewportHeight(element.clientHeight - HEADER_HEIGHT);
    updateHeight();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setEditingCell(null);
        setDraftValue('');
        setContextMenu(null);
      }
    };

    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const patchDocument = (updater: (current: SpreadsheetDocument) => SpreadsheetDocument) => {
    onChange((current) => (current ? updater(current) : current));
  };

  const startEdit = (row: number, col: number) => {
    setEditingCell({ row, col });
    setDraftValue(document.cells[makeCellKey(row, col)] ?? '');
  };

  const commitEdit = (row: number, col: number, value: string) => {
    patchDocument((current) => {
      const key = makeCellKey(row, col);
      const nextCells = { ...current.cells };

      if (value.trim() === '') {
        delete nextCells[key];
      } else {
        nextCells[key] = value;
      }

      return { ...current, cells: nextCells };
    });

    setEditingCell(null);
    setDraftValue('');
  };

  const updateFormulaValue = (value: string) => {
    patchDocument((current) => {
      const key = makeCellKey(selectedCell.row, selectedCell.col);
      const nextCells = { ...current.cells };
      if (value.trim() === '') {
        delete nextCells[key];
      } else {
        nextCells[key] = value;
      }
      return { ...current, cells: nextCells };
    });
  };

  const handleCellClick = (row: number, col: number, shiftKey: boolean) => {
    const cell = { row, col };
    if (shiftKey) {
      setSelectionRange({ start: selectedCell, end: cell });
    } else {
      setSelectionRange({ start: cell, end: cell });
    }
    setSelectedCell(cell);
    setEditingCell(null);
  };

  const handleKeyboard = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (editingCell) {
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      startEdit(selectedCell.row, selectedCell.col);
      return;
    }

    const next = { ...selectedCell };
    if (event.key === 'ArrowDown') next.row = Math.min(document.rowCount - 1, selectedCell.row + 1);
    if (event.key === 'ArrowUp') next.row = Math.max(0, selectedCell.row - 1);
    if (event.key === 'ArrowRight') next.col = Math.min(document.columnCount - 1, selectedCell.col + 1);
    if (event.key === 'ArrowLeft') next.col = Math.max(0, selectedCell.col - 1);

    if (next.row !== selectedCell.row || next.col !== selectedCell.col) {
      setSelectedCell(next);
      setSelectionRange({ start: next, end: next });
    }
  };

  const shiftRows = (rowIndex: number, direction: 1 | -1) => {
    patchDocument((current) => {
      const nextCells: Record<string, string> = {};
      Object.entries(current.cells).forEach(([key, raw]) => {
        const [row, col] = key.split(':').map(Number);
        if (direction === -1 && row === rowIndex) {
          return;
        }
        const targetRow = row >= rowIndex && direction === 1 ? row + 1 : row > rowIndex ? row - 1 : row;
        nextCells[makeCellKey(targetRow, col)] = raw;
      });

      const rowHeights =
        direction === 1
          ? [...current.rowHeights.slice(0, rowIndex), MIN_ROW_HEIGHT + 8, ...current.rowHeights.slice(rowIndex)]
          : current.rowHeights.filter((_, index) => index !== rowIndex);

      return {
        ...current,
        rowCount: Math.max(1, current.rowCount + direction),
        cells: nextCells,
        rowHeights,
      };
    });
  };

  const shiftColumns = (colIndex: number, direction: 1 | -1) => {
    patchDocument((current) => {
      const nextCells: Record<string, string> = {};
      Object.entries(current.cells).forEach(([key, raw]) => {
        const [row, col] = key.split(':').map(Number);
        if (direction === -1 && col === colIndex) {
          return;
        }
        const targetCol = col >= colIndex && direction === 1 ? col + 1 : col > colIndex ? col - 1 : col;
        nextCells[makeCellKey(row, targetCol)] = raw;
      });

      const columnWidths =
        direction === 1
          ? [...current.columnWidths.slice(0, colIndex), 120, ...current.columnWidths.slice(colIndex)]
          : current.columnWidths.filter((_, index) => index !== colIndex);

      return {
        ...current,
        columnCount: Math.max(1, current.columnCount + direction),
        cells: nextCells,
        columnWidths,
      };
    });
  };

  const startResize = (
    type: 'column' | 'row',
    index: number,
    startPosition: number,
    startSize: number,
  ) => {
    const handleMove = (event: MouseEvent) => {
      const currentPosition = type === 'column' ? event.clientX : event.clientY;
      const minSize = type === 'column' ? MIN_COLUMN_WIDTH : MIN_ROW_HEIGHT;
      const nextSize = Math.max(minSize, startSize + currentPosition - startPosition);

      patchDocument((current) => {
        if (type === 'column') {
          return {
            ...current,
            columnWidths: current.columnWidths.map((value, idx) => (idx === index ? nextSize : value)),
          };
        }

        return {
          ...current,
          rowHeights: current.rowHeights.map((value, idx) => (idx === index ? nextSize : value)),
        };
      });
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const startRowIndex = Math.max(0, findVisibleIndex(rowOffsets, scrollTop) - OVERSCAN);
  const endRowIndex = Math.min(
    document.rowCount - 1,
    findVisibleIndex(rowOffsets, scrollTop + viewportHeight) + OVERSCAN,
  );
  const visibleRows = [];
  for (let row = startRowIndex; row <= endRowIndex; row += 1) {
    visibleRows.push(row);
  }

  return (
    <div className="sheet-shell">
      <div className="toolbar">
        <span className="toolbar-label">fx</span>
        <input
          className="formula-input"
          data-testid="formula-input"
          value={activeRawValue}
          onChange={(event) => updateFormulaValue(event.target.value)}
          placeholder="Выберите ячейку и введите значение или формулу"
        />
      </div>

      <div className="spreadsheet" ref={containerRef} onKeyDown={handleKeyboard} tabIndex={0}>
        <div className="corner-cell" style={{ width: INDEX_COLUMN_WIDTH, height: HEADER_HEIGHT }} />

        <div className="column-headers" style={{ left: INDEX_COLUMN_WIDTH }}>
          <div className="column-track" style={{ width: totalWidth }}>
            {Array.from({ length: document.columnCount }, (_, col) => (
              <div
                key={col}
                className="column-header"
                style={{
                  width: document.columnWidths[col],
                  left: columnOffsets[col],
                  height: HEADER_HEIGHT,
                }}
              >
                <span>{columnLabelFromIndex(col)}</span>
                <button
                  className="resize-handle resize-column"
                  onMouseDown={(event) =>
                    startResize('column', col, event.clientX, document.columnWidths[col])
                  }
                  aria-label={`Resize column ${columnLabelFromIndex(col)}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid-scroll" onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}>
          <div
            className="row-index-track"
            style={{ width: INDEX_COLUMN_WIDTH, height: totalHeight, top: HEADER_HEIGHT }}
          >
            {visibleRows.map((row) => (
              <div
                key={row}
                className="row-header"
                style={{ top: rowOffsets[row], height: document.rowHeights[row] }}
              >
                <span>{row + 1}</span>
                <button
                  className="resize-handle resize-row"
                  onMouseDown={(event) =>
                    startResize('row', row, event.clientY, document.rowHeights[row])
                  }
                  aria-label={`Resize row ${row + 1}`}
                />
              </div>
            ))}
          </div>

          <div
            className="cell-track"
            style={{
              left: INDEX_COLUMN_WIDTH,
              width: totalWidth,
              height: totalHeight,
              top: HEADER_HEIGHT,
            }}
          >
            {visibleRows.map((row) =>
              Array.from({ length: document.columnCount }, (_, col) => {
                const isSelected = selectedCell.row === row && selectedCell.col === col;
                const inRange = isInsideRange(row, col, selectionRange);
                const isEditing = editingCell?.row === row && editingCell?.col === col;
                const key = makeCellKey(row, col);

                return (
                  <div
                    key={key}
                    data-testid={`cell-${row}-${col}`}
                    className={`cell ${isSelected ? 'selected' : ''} ${inRange ? 'range' : ''}`}
                    style={{
                      width: document.columnWidths[col],
                      height: document.rowHeights[row],
                      left: columnOffsets[col],
                      top: rowOffsets[row],
                    }}
                    onClick={(event) => handleCellClick(row, col, event.shiftKey)}
                    onDoubleClick={() => startEdit(row, col)}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      setSelectedCell({ row, col });
                      setSelectionRange({ start: { row, col }, end: { row, col } });
                      setContextMenu({ x: event.clientX, y: event.clientY, row, col });
                    }}
                  >
                    {isEditing ? (
                      <input
                        className="cell-editor"
                        data-testid={`cell-editor-${row}-${col}`}
                        autoFocus
                        value={draftValue}
                        onChange={(event) => setDraftValue(event.target.value)}
                        onBlur={() => commitEdit(row, col, draftValue)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            commitEdit(row, col, draftValue);
                          }
                          if (event.key === 'Escape') {
                            setEditingCell(null);
                            setDraftValue('');
                          }
                        }}
                      />
                    ) : (
                      <span className="cell-value">{getDisplayValue(cellsMap, row, col)}</span>
                    )}
                  </div>
                );
              }),
            )}
          </div>
        </div>
      </div>

      {contextMenu && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button type="button" onClick={() => shiftRows(contextMenu.row, 1)}>
            Вставить строку
          </button>
          <button type="button" onClick={() => shiftRows(contextMenu.row, -1)}>
            Удалить строку
          </button>
          <button type="button" onClick={() => shiftColumns(contextMenu.col, 1)}>
            Вставить столбец
          </button>
          <button type="button" onClick={() => shiftColumns(contextMenu.col, -1)}>
            Удалить столбец
          </button>
        </div>
      )}
    </div>
  );
}
