import { useEffect, useMemo, useRef, useState } from 'react';
import { columnLabelFromIndex, getDisplayValue, makeCellKey } from './formulas';
import { cellStoreToMap } from './documentUtils';
import type { CellCoord, ContextMenuState, SelectionRange } from './types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  deleteColumn,
  deleteRow,
  insertColumn,
  insertRow,
  selectCell,
  selectRange,
  setColumnWidth,
  setRowHeight,
  updateCell,
} from '../store/spreadsheetSlice';

const HEADER_HEIGHT = 36;
const INDEX_COLUMN_WIDTH = 56;
const OVERSCAN = 8;
const MIN_COLUMN_WIDTH = 48;
const MIN_ROW_HEIGHT = 24;

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

export function Spreadsheet() {
  const dispatch = useAppDispatch();
  const document = useAppSelector((state) => state.spreadsheet.currentDocument);
  const selectedCell = useAppSelector((state) => state.spreadsheet.selectedCell);
  const selectionRange = useAppSelector((state) => state.spreadsheet.selectionRange);
  const [editingCell, setEditingCell] = useState<CellCoord | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(560);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const cells = document?.cells ?? {};
  const columnWidths = document?.columnWidths ?? [];
  const rowHeights = document?.rowHeights ?? [];
  const cellsMap = useMemo(() => cellStoreToMap(cells), [cells]);
  const columnOffsets = useMemo(() => prefixSums(columnWidths), [columnWidths]);
  const rowOffsets = useMemo(() => prefixSums(rowHeights), [rowHeights]);
  const totalWidth = columnOffsets[columnOffsets.length - 1];
  const totalHeight = rowOffsets[rowOffsets.length - 1];
  const activeRawValue = cells[makeCellKey(selectedCell.row, selectedCell.col)] ?? '';

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

  if (!document) {
    return null;
  }

  const startEdit = (row: number, col: number) => {
    setEditingCell({ row, col });
    setDraftValue(document.cells[makeCellKey(row, col)] ?? '');
  };

  const commitEdit = (row: number, col: number, value: string) => {
    dispatch(updateCell({ row, col, value }));
    setEditingCell(null);
    setDraftValue('');
  };

  const updateFormulaValue = (value: string) => {
    dispatch(updateCell({ row: selectedCell.row, col: selectedCell.col, value }));
  };

  const handleCellClick = (row: number, col: number, shiftKey: boolean) => {
    const cell = { row, col };
    dispatch(selectCell(cell));
    if (shiftKey) {
      dispatch(selectRange({ start: selectedCell, end: cell }));
    } else {
      dispatch(selectRange({ start: cell, end: cell }));
    }
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
      dispatch(selectCell(next));
      dispatch(selectRange({ start: next, end: next }));
    }
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

      if (type === 'column') {
        dispatch(setColumnWidth({ index, width: nextSize }));
        return;
      }

      dispatch(setRowHeight({ index, height: nextSize }));
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
                      dispatch(selectCell({ row, col }));
                      dispatch(selectRange({ start: { row, col }, end: { row, col } }));
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
          <button type="button" onClick={() => dispatch(insertRow(contextMenu.row))}>
            Вставить строку
          </button>
          <button type="button" onClick={() => dispatch(deleteRow(contextMenu.row))}>
            Удалить строку
          </button>
          <button type="button" onClick={() => dispatch(insertColumn(contextMenu.col))}>
            Вставить столбец
          </button>
          <button type="button" onClick={() => dispatch(deleteColumn(contextMenu.col))}>
            Удалить столбец
          </button>
        </div>
      )}
    </div>
  );
}
