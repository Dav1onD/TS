import { useEffect, useMemo, useRef, useState } from 'react';
import { Spreadsheet } from './spreadsheet/Spreadsheet';
import {
  buildDocumentPreview,
  cloneDocument,
  downloadTextFile,
  exportDocumentToCsv,
  exportDocumentToJson,
  formatDate,
  importCsvIntoDocument,
  parseCsv,
} from './spreadsheet/documentUtils';
import { localDocumentApi } from './spreadsheet/mockApi';
import type {
  CreateDocumentInput,
  DocumentApi,
  DocumentSaveStatus,
  SpreadsheetDocument,
} from './spreadsheet/types';

const CURRENT_USER_ID = 'user-1';

type AppProps = {
  api?: DocumentApi;
};

function saveStatusLabel(status: DocumentSaveStatus) {
  if (status === 'saving') return 'Сохранение...';
  if (status === 'error') return 'Ошибка сохранения';
  if (status === 'pending') return 'Изменения не сохранены';
  return 'Сохранено';
}

export default function App({ api = localDocumentApi }: AppProps) {
  const [documents, setDocuments] = useState<SpreadsheetDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [draftDocument, setDraftDocument] = useState<SpreadsheetDocument | null>(null);
  const [saveStatus, setSaveStatus] = useState<DocumentSaveStatus>('saved');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInput, setCreateInput] = useState<CreateDocumentInput>({
    title: 'Новый документ',
    rowCount: 100,
    columnCount: 26,
  });
  const [renamingDocumentId, setRenamingDocumentId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [csvImportText, setCsvImportText] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const lastSavedSerializedRef = useRef('');
  const saveTimeoutRef = useRef<number | null>(null);
  const draftDocumentRef = useRef<SpreadsheetDocument | null>(null);

  useEffect(() => {
    draftDocumentRef.current = draftDocument;
  }, [draftDocument]);

  useEffect(() => {
    let isMounted = true;
    api.listDocuments(CURRENT_USER_ID).then((items) => {
      if (!isMounted) {
        return;
      }
      setDocuments(items);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [api]);

  const draftSerialized = useMemo(
    () => (draftDocument ? JSON.stringify(draftDocument) : ''),
    [draftDocument],
  );
  const hasUnsavedChanges =
    Boolean(draftDocument) && draftSerialized !== lastSavedSerializedRef.current;

  const openDocument = (document: SpreadsheetDocument) => {
    const copy = cloneDocument(document);
    setActiveDocumentId(document.id);
    setDraftDocument(copy);
    lastSavedSerializedRef.current = JSON.stringify(copy);
    setSaveStatus('saved');
  };

  const closeDocument = () => {
    setActiveDocumentId(null);
    setDraftDocument(null);
    setSaveStatus('saved');
    setCsvImportText('');
    setIsImportModalOpen(false);
  };

  const saveNow = async () => {
    const currentDraft = draftDocumentRef.current;
    if (!currentDraft) {
      return;
    }

    const serialized = JSON.stringify(currentDraft);
    if (serialized === lastSavedSerializedRef.current) {
      setSaveStatus('saved');
      return;
    }

    setSaveStatus('saving');

    try {
      const saved = await api.patchDocument(currentDraft.id, currentDraft);
      const savedSerialized = JSON.stringify(saved);
      lastSavedSerializedRef.current = savedSerialized;
      setDocuments((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
      setDraftDocument((prev) => {
        if (!prev || prev.id !== saved.id) {
          return prev;
        }
        return JSON.stringify(prev) === serialized ? saved : prev;
      });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  useEffect(() => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    if (!draftDocument || !hasUnsavedChanges) {
      return;
    }

    setSaveStatus((prev) => (prev === 'error' ? prev : 'pending'));
    saveTimeoutRef.current = window.setTimeout(() => {
      void saveNow();
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [draftDocument, draftSerialized, hasUnsavedChanges]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) {
        return;
      }
      event.preventDefault();
      event.returnValue = '';
    };

    const handleHotkey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void saveNow();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('keydown', handleHotkey);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keydown', handleHotkey);
    };
  }, [hasUnsavedChanges]);

  const handleCreateDocument = async () => {
    const created = await api.createDocument(CURRENT_USER_ID, createInput);
    setDocuments((prev) => [created, ...prev]);
    setIsCreateModalOpen(false);
    openDocument(created);
  };

  const handleRenameDocument = async (id: string) => {
    const nextTitle = renameValue.trim();
    if (!nextTitle) {
      setRenamingDocumentId(null);
      return;
    }

    const renamed = await api.renameDocument(id, nextTitle);
    setDocuments((prev) => prev.map((item) => (item.id === id ? renamed : item)));
    setDraftDocument((prev) => (prev && prev.id === id ? { ...prev, title: renamed.title } : prev));
    setRenamingDocumentId(null);
  };

  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm('Удалить документ?')) {
      return;
    }

    await api.deleteDocument(id);
    setDocuments((prev) => prev.filter((item) => item.id !== id));
    if (activeDocumentId === id) {
      closeDocument();
    }
  };

  const handleDuplicateDocument = async (id: string) => {
    const copy = await api.duplicateDocument(id, CURRENT_USER_ID);
    setDocuments((prev) => [copy, ...prev]);
  };

  const activeDocument = documents.find((document) => document.id === activeDocumentId) ?? null;
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
            <button className="primary-button" onClick={() => setIsCreateModalOpen(true)}>
              Новый документ
            </button>
          </div>

          <div className="document-grid">
            {documents.map((document) => {
              const preview = buildDocumentPreview(document);
              return (
                <article className="document-card" key={document.id}>
                  <button
                    className="document-open-button"
                    onClick={() => openDocument(document)}
                    data-testid={`open-document-${document.id}`}
                  >
                    <div className="preview-grid" aria-hidden="true">
                      {preview.flat().map((value, index) => (
                        <span className="preview-cell" key={index}>
                          {value}
                        </span>
                      ))}
                    </div>
                    <div className="document-card-body">
                      {renamingDocumentId === document.id ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(event) => setRenameValue(event.target.value)}
                          onBlur={() => void handleRenameDocument(document.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              void handleRenameDocument(document.id);
                            }
                          }}
                        />
                      ) : (
                        <h2>{document.title}</h2>
                      )}
                      <p>Создан: {formatDate(document.createdAt)}</p>
                      <p>Изменён: {formatDate(document.updatedAt)}</p>
                    </div>
                  </button>
                  <div className="card-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setRenamingDocumentId(document.id);
                        setRenameValue(document.title);
                      }}
                    >
                      Переименовать
                    </button>
                    <button type="button" onClick={() => void handleDuplicateDocument(document.id)}>
                      Дублировать
                    </button>
                    <button type="button" onClick={() => void handleDeleteDocument(document.id)}>
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
                onChange={(event) =>
                  setDraftDocument((prev) => (prev ? { ...prev, title: event.target.value } : prev))
                }
              />
              <span className={`save-pill save-${saveStatus}`} data-testid="save-status">
                {saveStatusLabel(saveStatus)}
              </span>
            </div>
            <div className="editor-actions">
              <button className="ghost-button" onClick={() => void saveNow()}>
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
              <button className="ghost-button" onClick={() => setIsImportModalOpen(true)}>
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

          <Spreadsheet
            document={draftDocument}
            onChange={setDraftDocument}
          />
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
                onChange={(event) =>
                  setCreateInput((prev) => ({ ...prev, title: event.target.value }))
                }
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
                    setCreateInput((prev) => ({
                      ...prev,
                      rowCount: Math.max(1, Number(event.target.value)),
                    }))
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
                    setCreateInput((prev) => ({
                      ...prev,
                      columnCount: Math.max(1, Number(event.target.value)),
                    }))
                  }
                />
              </label>
            </div>
            <div className="modal-actions">
              <button className="ghost-button" onClick={() => setIsCreateModalOpen(false)}>
                Отмена
              </button>
              <button className="primary-button" onClick={() => void handleCreateDocument()}>
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
                  setCsvImportText(await file.text());
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
              <button className="ghost-button" onClick={() => setIsImportModalOpen(false)}>
                Отмена
              </button>
              <button
                className="primary-button"
                disabled={!csvImportText.trim()}
                onClick={() => {
                  setDraftDocument((prev) =>
                    prev ? importCsvIntoDocument(prev, csvImportText) : prev,
                  );
                  setIsImportModalOpen(false);
                  setCsvImportText('');
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
