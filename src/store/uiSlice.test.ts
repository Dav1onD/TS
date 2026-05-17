import { describe, expect, it } from 'vitest';
import { uiReducer, openCreateModal, setCreateInput, startRenaming, stopRenaming } from './uiSlice';

describe('uiSlice', () => {
  it('opens create modal and updates form fields', () => {
    const opened = uiReducer(undefined, openCreateModal());
    const updated = uiReducer(opened, setCreateInput({ title: 'План', rowCount: 10 }));

    expect(opened.isCreateModalOpen).toBe(true);
    expect(updated.createInput.title).toBe('План');
    expect(updated.createInput.rowCount).toBe(10);
  });

  it('handles rename controls', () => {
    const started = uiReducer(undefined, startRenaming({ id: 'doc-1', title: 'Имя' }));
    const stopped = uiReducer(started, stopRenaming());

    expect(started.renamingDocumentId).toBe('doc-1');
    expect(stopped.renamingDocumentId).toBeNull();
  });
});
