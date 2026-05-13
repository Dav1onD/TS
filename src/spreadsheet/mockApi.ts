import { cloneDocument, createEmptyDocument } from './documentUtils';
import type { CreateDocumentInput, DocumentApi, SpreadsheetDocument } from './types';

const STORAGE_KEY = 'ts-spreadsheet-documents';
const NETWORK_DELAY_MS = 80;

function wait() {
  return new Promise((resolve) => window.setTimeout(resolve, NETWORK_DELAY_MS));
}

function seedDocuments(): SpreadsheetDocument[] {
  const own = createEmptyDocument('user-1', 'Учебный бюджет', 24, 10);
  own.cells['0:0'] = 'Май';
  own.cells['0:1'] = '12000';
  own.cells['1:0'] = 'Июнь';
  own.cells['1:1'] = '15000';
  own.cells['2:0'] = '=SUM(B1:B2)';

  const foreign = createEmptyDocument('user-2', 'Чужой документ', 12, 6);
  foreign.cells['0:0'] = 'not-visible';

  return [own, foreign];
}

function loadDocuments(): SpreadsheetDocument[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = seedDocuments();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    return JSON.parse(raw) as SpreadsheetDocument[];
  } catch {
    const initial = seedDocuments();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
}

function saveDocuments(documents: SpreadsheetDocument[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
}

function updateCollection(
  updater: (documents: SpreadsheetDocument[]) => SpreadsheetDocument[],
): SpreadsheetDocument[] {
  const current = loadDocuments();
  const next = updater(current);
  saveDocuments(next);
  return next;
}

export function createLocalDocumentApi(): DocumentApi {
  return {
    async listDocuments(userId) {
      await wait();
      return loadDocuments()
        .filter((document) => document.userId === userId)
        .map((document) => cloneDocument(document));
    },
    async createDocument(userId, input: CreateDocumentInput) {
      await wait();
      const created = createEmptyDocument(userId, input.title, input.rowCount, input.columnCount);
      updateCollection((documents) => [created, ...documents]);
      return cloneDocument(created);
    },
    async renameDocument(id, title) {
      await wait();
      let updated: SpreadsheetDocument | null = null;
      updateCollection((documents) =>
        documents.map((document) => {
          if (document.id !== id) {
            return document;
          }

          updated = { ...document, title, updatedAt: new Date().toISOString() };
          return updated;
        }),
      );
      if (!updated) {
        throw new Error('Document not found');
      }
      return cloneDocument(updated);
    },
    async deleteDocument(id) {
      await wait();
      updateCollection((documents) => documents.filter((document) => document.id !== id));
    },
    async duplicateDocument(id, userId) {
      await wait();
      let duplicate: SpreadsheetDocument | null = null;
      updateCollection((documents) => {
        const source = documents.find((document) => document.id === id);
        if (!source) {
          return documents;
        }

        duplicate = {
          ...cloneDocument(source),
          id: crypto.randomUUID(),
          userId,
          title: `${source.title} (копия)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return [duplicate, ...documents];
      });
      if (!duplicate) {
        throw new Error('Document not found');
      }
      return cloneDocument(duplicate);
    },
    async patchDocument(id, document) {
      await wait();
      let updated: SpreadsheetDocument | null = null;
      updateCollection((documents) =>
        documents.map((item) => {
          if (item.id !== id) {
            return item;
          }

          updated = {
            ...cloneDocument(document),
            updatedAt: new Date().toISOString(),
          };
          return updated;
        }),
      );
      if (!updated) {
        throw new Error('Document not found');
      }
      return cloneDocument(updated);
    },
  };
}

export const localDocumentApi = createLocalDocumentApi();
