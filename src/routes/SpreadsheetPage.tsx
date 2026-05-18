import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Link,
  UNSAFE_NavigationContext,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { Spreadsheet } from '../spreadsheet/Spreadsheet';
import {
  downloadTextFile,
  exportDocumentToCsv,
  exportDocumentToJson,
  parseCsv,
} from '../spreadsheet/documentUtils';
import type { DocumentSaveStatus } from '../spreadsheet/types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { closeActiveDocument } from '../store/documentsSlice';
import {
  closeDocument as closeSpreadsheetDocument,
  importCsv,
  redo,
  setDocumentTitle,
  undo,
} from '../store/spreadsheetSlice';
import { closeImportModal, openImportModal, setCsvImportText } from '../store/uiSlice';
import {
  deleteDocumentThunk,
  duplicateDocumentThunk,
  loadDocumentById,
  saveActiveDocument,
} from '../store/thunks';
import { NotFoundPage } from './NotFoundPage';

function saveStatusLabel(status: DocumentSaveStatus) {
  if (status === 'saving') return 'Сохранение...';
  if (status === 'error') return 'Ошибка сохранения';
  if (status === 'pending') return 'Изменения не сохранены';
  return 'Сохранено';
}

export function SpreadsheetPage() {
  const { documentId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const draftDocument = useAppSelector((state) => state.spreadsheet.currentDocument);
  const lastSavedSerialized = useAppSelector((state) => state.spreadsheet.lastSavedSerialized);
  const saveStatus = useAppSelector((state) => state.ui.saveStatus);
  const csvImportText = useAppSelector((state) => state.ui.csvImportText);
  const isImportModalOpen = useAppSelector((state) => state.ui.isImportModalOpen);
  const draftDocumentRef = useRef(draftDocument);
  const [pageState, setPageState] = useState<'loading' | 'ready' | 'not-found'>('loading');

  useEffect(() => {
    draftDocumentRef.current = draftDocument;
  }, [draftDocument]);

  useEffect(() => {
    let isCancelled = false;
    setPageState('loading');

    void dispatch(loadDocumentById(documentId))
      .unwrap()
      .then(() => {
        if (!isCancelled) {
          setPageState('ready');
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setPageState('not-found');
        }
      });

    return () => {
      isCancelled = true;
      dispatch(closeActiveDocument());
      dispatch(closeSpreadsheetDocument());
    };
  }, [dispatch, documentId]);

  const draftSerialized = useMemo(
    () => (draftDocument ? JSON.stringify(draftDocument) : ''),
    [draftDocument],
  );
  const hasUnsavedChanges = Boolean(draftDocument) && draftSerialized !== lastSavedSerialized;
  const navigationContext = useContext(UNSAFE_NavigationContext);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const navigator = navigationContext?.navigator as {
      block?: (blocker: (tx: { retry: () => void }) => void) => () => void;
    };

    if (!navigator?.block) {
      return;
    }

    const unblock = navigator.block((tx) => {
      if (!window.confirm('Есть несохранённые изменения. Покинуть страницу?')) {
        return;
      }

      unblock();
      tx.retry();
    });

    return unblock;
  }, [hasUnsavedChanges, navigationContext]);

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

  const parsedCsvHeaders = useMemo(() => {
    if (!csvImportText.trim()) {
      return [];
    }

    const rows = parseCsv(csvImportText);
    return rows[0] ?? [];
  }, [csvImportText]);

  const confirmNavigation = () => {
    if (!hasUnsavedChanges) {
      return true;
    }

    return window.confirm('Есть несохранённые изменения. Покинуть страницу?');
  };

  const handleDeleteDocument = async () => {
    if (!draftDocument || !window.confirm('Удалить документ?')) {
      return;
    }

    await dispatch(deleteDocumentThunk(draftDocument.id));
    navigate('/dashboard');
  };

  const handleDuplicateDocument = async () => {
    if (!draftDocument) {
      return;
    }

    const duplicate = await dispatch(duplicateDocumentThunk(draftDocument.id)).unwrap();
    navigate(`/documents/${duplicate.id}`);
  };

  if (pageState === 'not-found') {
    return (
      <NotFoundPage
        title="Документ не найден"
        description={`Документ с id "${documentId}" не существует или недоступен.`}
      />
    );
  }

  if (pageState === 'loading' || !draftDocument || draftDocument.id !== documentId) {
    return <div className="loading-screen">Загрузка документа...</div>;
  }

  return (
    <div className="editor-shell">
      <div className="editor-header">
        <div className="breadcrumbs" aria-label="Хлебные крошки">
          <Link
            className="breadcrumb-link"
            to="/dashboard"
            onClick={(event) => {
              if (confirmNavigation()) {
                return;
              }

              event.preventDefault();
            }}
          >
            Мои документы
          </Link>
          <span className="breadcrumb-separator">/</span>
          <span>{draftDocument.title}</span>
        </div>
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
          <button
            className="ghost-button"
            onClick={() => {
              if (!confirmNavigation()) {
                return;
              }

              navigate('/dashboard');
            }}
          >
            Назад к документам
          </button>
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
          <button className="ghost-button" onClick={() => void handleDuplicateDocument()}>
            Дублировать
          </button>
          <button className="danger-button" onClick={() => void handleDeleteDocument()}>
            Удалить
          </button>
        </div>
      </div>

      <p className="route-hint">{location.pathname}</p>
      <Spreadsheet />

      {isImportModalOpen && (
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
