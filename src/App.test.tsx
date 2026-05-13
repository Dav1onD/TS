import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { createEmptyDocument } from './spreadsheet/documentUtils';
import type { DocumentApi, SpreadsheetDocument } from './spreadsheet/types';

function createTestApi(initial: SpreadsheetDocument[]): DocumentApi {
  let documents = [...initial];

  return {
    listDocuments: vi.fn(async (userId: string) => documents.filter((item) => item.userId === userId)),
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

    render(<App api={api} />);

    expect(await screen.findByText('Мой документ')).toBeInTheDocument();
    expect(screen.queryByText('Чужой документ')).not.toBeInTheDocument();
  });

  it('autosaves changes after 500ms debounce', async () => {
    const own = createEmptyDocument('user-1', 'Таблица', 10, 5);
    const api = createTestApi([own]);

    render(<App api={api} />);
    fireEvent.click(await screen.findByTestId(`open-document-${own.id}`));

    vi.useFakeTimers();
    const formulaInput = screen.getByTestId('formula-input');
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
    vi.useRealTimers();
    await waitFor(() => expect(screen.getByTestId('save-status')).toHaveTextContent('Сохранено'));
  });

  it('creates and duplicates documents', async () => {
    const own = createEmptyDocument('user-1', 'Исходник', 10, 5);
    const api = createTestApi([own]);

    render(<App api={api} />);

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

    expect(await screen.findByText('Исходник (копия)')).toBeInTheDocument();
  });
});
