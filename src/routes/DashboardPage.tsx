import { useNavigate } from 'react-router-dom';
import { buildDocumentPreview, formatDate } from '../spreadsheet/documentUtils';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  closeCreateModal,
  openCreateModal,
  setCreateInput,
  setRenameValue,
  startRenaming,
  stopRenaming,
} from '../store/uiSlice';
import {
  createDocumentThunk,
  deleteDocumentThunk,
  duplicateDocumentThunk,
  renameDocumentThunk,
} from '../store/thunks';
import { defaultCreateInput } from '../store/uiSlice';

export function DashboardPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const documents = useAppSelector((state) => state.documents.items);
  const isLoading = useAppSelector((state) => state.documents.isLoading);
  const isCreateModalOpen = useAppSelector((state) => state.ui.isCreateModalOpen);
  const createInput = useAppSelector((state) => state.ui.createInput);
  const renamingDocumentId = useAppSelector((state) => state.ui.renamingDocumentId);
  const renameValue = useAppSelector((state) => state.ui.renameValue);

  const handleOpenDocument = (id: string) => {
    navigate(`/documents/${id}`);
  };

  const handleCreateDocument = async () => {
    const created = await dispatch(createDocumentThunk(createInput)).unwrap();
    navigate(`/documents/${created.id}`);
  };

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
  };

  const handleDuplicateDocument = async (id: string) => {
    const duplicate = await dispatch(duplicateDocumentThunk(id)).unwrap();
    navigate(`/documents/${duplicate.id}`);
  };

  if (isLoading) {
    return <div className="loading-screen">Загрузка документов...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-hero dashboard-hero-compact">
        <button className="primary-button" onClick={() => dispatch(openCreateModal())}>
          Новый документ
        </button>
      </div>

      <div className="document-grid">
        {documents.map((item) => {
          const preview = buildDocumentPreview(item);
          return (
            <article className="document-card" key={item.id}>
              <button
                className="document-open-button"
                onClick={() => handleOpenDocument(item.id)}
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
              <button
                className="ghost-button"
                onClick={() => {
                  dispatch(closeCreateModal());
                  dispatch(setCreateInput(defaultCreateInput));
                }}
              >
                Отмена
              </button>
              <button className="primary-button" onClick={() => void handleCreateDocument()}>
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
