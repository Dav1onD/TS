import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { createEmptyDocument } from './spreadsheet/documentUtils';
import type { DocumentApi, SpreadsheetDocument } from './spreadsheet/types';

function createTestApi(initial: SpreadsheetDocument[]): DocumentApi {
  let documents = [...initial];

  return {
    listDocuments: vi.fn(async (userId: string) => documents.filter((item) => item.userId === userId)),
    getDocumentById: vi.fn(async (userId, id) => {
      const document = documents.find((item) => item.userId === userId && item.id === id) ?? null;
      return document;
    }),
    createDocument: vi.fn(async (userId, input) => {
      const created = createEmptyDocument(userId, input.title, input.rowCount, input.columnCount);
      documents = [created, ...documents];
      return created;
    }),
    renameDocument: vi.fn(async (id, title) => {
      const next = documents.find((item) => item.id === id);
      if (!next) throw new Error('not found');
      const updated = { ...next, title };
      documents = documents.map((item) => (item.id === id ? updated : item));
      return updated;
    }),
    deleteDocument: vi.fn(async (id) => {
      documents = documents.filter((item) => item.id !== id);
    }),
    duplicateDocument: vi.fn(async (id, userId) => {
      const source = documents.find((item) => item.id === id);
      if (!source) throw new Error('not found');
      const copy = { ...source, id: `${id}-copy`, userId, title: `${source.title} (копия)` };
      documents = [copy, ...documents];
      return copy;
    }),
    patchDocument: vi.fn(async (id, document) => {
      const updated = { ...document, updatedAt: new Date().toISOString() };
      documents = documents.map((item) => (item.id === id ? updated : item));
      return updated;
    }),
  };
}

describe('App document management', () => {
  it('shows only documents of current user', async () => {
    const own = createEmptyDocument('user-1', 'Мой документ', 10, 5);
    const foreign = createEmptyDocument('user-2', 'Чужой документ', 10, 5);
    const api = createTestApi([own, foreign]);

    render(<App api={api} initialEntries={['/dashboard']} />);

    expect(await screen.findByText('Мой документ')).toBeInTheDocument();
    expect(screen.queryByText('Чужой документ')).not.toBeInTheDocument();
  });

  it('autosaves changes after 500ms debounce', async () => {
    const own = createEmptyDocument('user-1', 'Таблица', 10, 5);
    const api = createTestApi([own]);

    render(<App api={api} initialEntries={['/dashboard']} />);
    fireEvent.click(await screen.findByTestId(`open-document-${own.id}`));

    const formulaInput = await screen.findByTestId('formula-input');
    vi.useFakeTimers();

    try {
      fireEvent.change(formulaInput, { target: { value: '42' } });

      expect(screen.getByTestId('save-status')).toHaveTextContent('Изменения не сохранены');

      await act(async () => {
        vi.advanceTimersByTime(499);
      });
      expect(api.patchDocument).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(1);
        await Promise.resolve();
      });

      expect(api.patchDocument).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }

    await waitFor(() => expect(screen.getByTestId('save-status')).toHaveTextContent('Сохранено'));
  });

  it('creates and duplicates documents', async () => {
    const own = createEmptyDocument('user-1', 'Исходник', 10, 5);
    const api = createTestApi([own]);

    render(<App api={api} initialEntries={['/dashboard']} />);

    fireEvent.click(await screen.findByText('Новый документ'));
    fireEvent.change(screen.getByDisplayValue('Новый документ'), {
      target: { value: 'План' },
    });
    fireEvent.click(screen.getByText('Создать'));

    await waitFor(() => expect(screen.getByDisplayValue('План')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Назад к документам'));

    const sourceCard = screen.getByText('Исходник').closest('.document-card');
    expect(sourceCard).not.toBeNull();
    fireEvent.click(within(sourceCard as HTMLElement).getByText('Дублировать'));

    expect(await screen.findByDisplayValue('Исходник (копия)')).toBeInTheDocument();
  });

  it('opens document by direct link and passes document id via route param', async () => {
    const own = createEmptyDocument('user-1', 'Прямая ссылка', 10, 5);
    const api = createTestApi([own]);

    render(<App api={api} initialEntries={[`/documents/${own.id}`]} />);

    expect(await screen.findByDisplayValue('Прямая ссылка')).toBeInTheDocument();
    expect(api.getDocumentById).toHaveBeenCalledWith('user-1', own.id);
  });

  it('asks for confirmation before leaving editor with unsaved changes', async () => {
    const own = createEmptyDocument('user-1', 'Черновик', 10, 5);
    const api = createTestApi([own]);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<App api={api} initialEntries={[`/documents/${own.id}`]} />);

    const formulaInput = await screen.findByTestId('formula-input');
    fireEvent.change(formulaInput, { target: { value: '42' } });
    fireEvent.click(screen.getByText('Назад к документам'));

    expect(confirmSpy).toHaveBeenCalledWith('Есть несохранённые изменения. Покинуть страницу?');
    expect(screen.getByDisplayValue('Черновик')).toBeInTheDocument();

    confirmSpy.mockRestore();
  });
});
