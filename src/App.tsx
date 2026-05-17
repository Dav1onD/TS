import { useEffect, useMemo, useRef } from 'react';
import { Provider } from 'react-redux';
import { Spreadsheet } from './spreadsheet/Spreadsheet';
import {
  buildDocumentPreview,
  downloadTextFile,
  exportDocumentToCsv,
  exportDocumentToJson,
  formatDate,
  parseCsv,
} from './spreadsheet/documentUtils';
import { localDocumentApi } from './spreadsheet/mockApi';
import type { DocumentApi, DocumentSaveStatus } from './spreadsheet/types';
import { createAppStore } from './store';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { closeActiveDocument } from './store/documentsSlice';
import {
  closeDocument as closeSpreadsheetDocument,
  importCsv,
  redo,
  setDocumentTitle,
  undo,
} from './store/spreadsheetSlice';
import {
  closeCreateModal,
  closeImportModal,
  openCreateModal,
  openImportModal,
  setCreateInput,
  setCsvImportText,
  setRenameValue,
  startRenaming,
  stopRenaming,
} from './store/uiSlice';
import {
  createDocumentThunk,
  deleteDocumentThunk,
  duplicateDocumentThunk,
  fetchDocuments,
  loadDocumentById,
  renameDocumentThunk,
  saveActiveDocument,
} from './store/thunks';

type AppProps = {
  api?: DocumentApi;
};

function saveStatusLabel(status: DocumentSaveStatus) {
  if (status === 'saving') return 'Сохранение...';
  if (status === 'error') return 'Ошибка сохранения';
  if (status === 'pending') return 'Изменения не сохранены';
  return 'Сохранено';
}

function AppInner() {
  const dispatch = useAppDispatch();
  const documents = useAppSelector((state) => state.documents.items);
  const isLoading = useAppSelector((state) => state.documents.isLoading);
  const activeDocumentId = useAppSelector((state) => state.documents.activeDocumentId);
  const draftDocument = useAppSelector((state) => state.spreadsheet.currentDocument);
  const lastSavedSerialized = useAppSelector((state) => state.spreadsheet.lastSavedSerialized);
  const saveStatus = useAppSelector((state) => state.ui.saveStatus);
  const isCreateModalOpen = useAppSelector((state) => state.ui.isCreateModalOpen);
  const createInput = useAppSelector((state) => state.ui.createInput);
  const renamingDocumentId = useAppSelector((state) => state.ui.renamingDocumentId);
  const renameValue = useAppSelector((state) => state.ui.renameValue);
  const csvImportText = useAppSelector((state) => state.ui.csvImportText);
  const isImportModalOpen = useAppSelector((state) => state.ui.isImportModalOpen);
  const draftDocumentRef = useRef(draftDocument);

  useEffect(() => {
    draftDocumentRef.current = draftDocument;
  }, [draftDocument]);

  useEffect(() => {
    void dispatch(fetchDocuments());
  }, [dispatch]);

  const draftSerialized = useMemo(
    () => (draftDocument ? JSON.stringify(draftDocument) : ''),
    [draftDocument],
  );
  const hasUnsavedChanges = Boolean(draftDocument) && draftSerialized !== lastSavedSerialized;

  const closeDocument = () => {
    dispatch(closeActiveDocument());
    dispatch(closeSpreadsheetDocument());
  };

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) {
        return;
      }
      event.preventDefault();
      event.returnValue = '';
    };

    const handleHotkey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void dispatch(saveActiveDocument());
      }

      if (!draftDocumentRef.current || isTypingTarget) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        dispatch(undo());
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        dispatch(redo());
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('keydown', handleHotkey);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keydown', handleHotkey);
    };
  }, [dispatch, hasUnsavedChanges]);

  const handleRenameDocument = async (id: string) => {
    const nextTitle = renameValue.trim();
    if (!nextTitle) {
      dispatch(stopRenaming());
      return;
    }

    await dispatch(renameDocumentThunk({ id, title: nextTitle }));
  };

  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm('Удалить документ?')) {
      return;
    }

    await dispatch(deleteDocumentThunk(id));
    if (activeDocumentId === id) {
      closeDocument();
    }
  };

  const handleDuplicateDocument = async (id: string) => {
    await dispatch(duplicateDocumentThunk(id));
  };

  const activeDocument =
    documents.find((item: (typeof documents)[number]) => item.id === activeDocumentId) ?? null;
  const parsedCsvHeaders = useMemo(() => {
    if (!csvImportText.trim()) {
      return [];
    }

    const rows = parseCsv(csvImportText);
    return rows[0] ?? [];
  }, [csvImportText]);

  if (isLoading) {
    return <div className="loading-screen">Загрузка документов...</div>;
  }

  return (
    <div className="page-shell">
      {!draftDocument ? (
        <div className="dashboard">
          <div className="dashboard-hero dashboard-hero-compact">
            <button className="primary-button" onClick={() => dispatch(openCreateModal())}>
              Новый документ
            </button>
          </div>

          <div className="document-grid">
            {documents.map((item: (typeof documents)[number]) => {
              const preview = buildDocumentPreview(item);
              return (
                <article className="document-card" key={item.id}>
                  <button
                    className="document-open-button"
                    onClick={() => void dispatch(loadDocumentById(item.id))}
                    data-testid={`open-document-${item.id}`}
                  >
                    <div className="preview-grid" aria-hidden="true">
                      {preview.flat().map((value, index) => (
                        <span className="preview-cell" key={index}>
                          {value}
                        </span>
                      ))}
                    </div>
                    <div className="document-card-body">
                      {renamingDocumentId === item.id ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(event) => dispatch(setRenameValue(event.target.value))}
                          onBlur={() => void handleRenameDocument(item.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              void handleRenameDocument(item.id);
                            }
                          }}
                        />
                      ) : (
                        <h2>{item.title}</h2>
                      )}
                      <p>Создан: {formatDate(item.createdAt)}</p>
                      <p>Изменён: {formatDate(item.updatedAt)}</p>
                    </div>
                  </button>
                  <div className="card-actions">
                    <button
                      type="button"
                      onClick={() => dispatch(startRenaming({ id: item.id, title: item.title }))}
                    >
                      Переименовать
                    </button>
                    <button type="button" onClick={() => void handleDuplicateDocument(item.id)}>
                      Дублировать
                    </button>
                    <button type="button" onClick={() => void handleDeleteDocument(item.id)}>
                      Удалить
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="editor-shell">
          <div className="editor-header">
            <button className="ghost-button" onClick={closeDocument}>
              Назад к документам
            </button>
            <div className="editor-title-block">
              <input
                className="document-title-input"
                value={draftDocument.title}
                onChange={(event) => dispatch(setDocumentTitle(event.target.value))}
              />
              <span className={`save-pill save-${saveStatus}`} data-testid="save-status">
                {saveStatusLabel(saveStatus)}
              </span>
            </div>
            <div className="editor-actions">
              <button className="ghost-button" onClick={() => void dispatch(saveActiveDocument())}>
                Сохранить
              </button>
              <button
                className="ghost-button"
                onClick={() =>
                  downloadTextFile(
                    `${draftDocument.title}.csv`,
                    exportDocumentToCsv(draftDocument),
                    'text/csv;charset=utf-8',
                  )
                }
              >
                Экспорт CSV
              </button>
              <button
                className="ghost-button"
                onClick={() =>
                  downloadTextFile(
                    `${draftDocument.title}.json`,
                    exportDocumentToJson(draftDocument),
                    'application/json;charset=utf-8',
                  )
                }
              >
                Экспорт JSON
              </button>
              <button className="ghost-button" onClick={() => dispatch(openImportModal())}>
                Импорт CSV
              </button>
              {activeDocument && (
                <>
                  <button
                    className="ghost-button"
                    onClick={() => void handleDuplicateDocument(activeDocument.id)}
                  >
                    Дублировать
                  </button>
                  <button
                    className="danger-button"
                    onClick={() => void handleDeleteDocument(activeDocument.id)}
                  >
                    Удалить
                  </button>
                </>
              )}
            </div>
          </div>

          <Spreadsheet />
        </div>
      )}

      {isCreateModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2>Новый документ</h2>
            <label>
              Название
              <input
                value={createInput.title}
                onChange={(event) => dispatch(setCreateInput({ title: event.target.value }))}
              />
            </label>
            <div className="size-grid">
              <label>
                Строки
                <input
                  type="number"
                  min="1"
                  value={createInput.rowCount}
                  onChange={(event) =>
                    dispatch(setCreateInput({ rowCount: Math.max(1, Number(event.target.value)) }))
                  }
                />
              </label>
              <label>
                Столбцы
                <input
                  type="number"
                  min="1"
                  value={createInput.columnCount}
                  onChange={(event) =>
                    dispatch(
                      setCreateInput({ columnCount: Math.max(1, Number(event.target.value)) }),
                    )
                  }
                />
              </label>
            </div>
            <div className="modal-actions">
              <button className="ghost-button" onClick={() => dispatch(closeCreateModal())}>
                Отмена
              </button>
              <button
                className="primary-button"
                onClick={() => void dispatch(createDocumentThunk(createInput))}
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {isImportModalOpen && draftDocument && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2>Импорт CSV</h2>
            <label>
              Выберите CSV-файл
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }
                  dispatch(setCsvImportText(await file.text()));
                }}
              />
            </label>
            {parsedCsvHeaders.length > 0 && (
              <>
                <p className="helper-text">Найдены названия колонок:</p>
                <div className="header-chips">
                  {parsedCsvHeaders.map((header, index) => (
                    <span className="header-chip" key={`${header}-${index}`}>
                      {header || `Колонка ${index + 1}`}
                    </span>
                  ))}
                </div>
              </>
            )}
            <div className="modal-actions">
              <button className="ghost-button" onClick={() => dispatch(closeImportModal())}>
                Отмена
              </button>
              <button
                className="primary-button"
                disabled={!csvImportText.trim()}
                onClick={() => {
                  dispatch(importCsv(csvImportText));
                  dispatch(closeImportModal());
                }}
              >
                Импортировать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App({ api = localDocumentApi }: AppProps) {
  const storeRef = useRef(createAppStore(api));

  return (
    <Provider store={storeRef.current}>
      <AppInner />
    </Provider>
  );
}
