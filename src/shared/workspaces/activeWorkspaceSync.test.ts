import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  broadcastActiveWorkspaceChange,
  parseActiveWorkspaceBroadcast,
  persistActiveWorkspaceSession,
  readStoredActiveWorkspaceId,
} from './activeWorkspaceSync';
import { ACTIVE_WORKSPACE_BROADCAST_KEY, ACTIVE_WORKSPACE_STORAGE_KEY } from './constants';

class MockStorage {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  removeItem(key: string) {
    this.store.delete(key);
  }
}

function setupWindow() {
  const sessionStorage = new MockStorage();
  const localStorage = new MockStorage();

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      sessionStorage,
      localStorage,
    },
  });

  return { sessionStorage, localStorage };
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'window');
});

describe('activeWorkspaceSync', () => {
  it('persists and reads active workspace id in session storage', () => {
    const { sessionStorage } = setupWindow();

    persistActiveWorkspaceSession('workspace-1');

    expect(sessionStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY)).toBe('workspace-1');
    expect(readStoredActiveWorkspaceId()).toBe('workspace-1');
  });

  it('removes active workspace id when null is persisted', () => {
    const { sessionStorage } = setupWindow();
    sessionStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, 'workspace-1');

    persistActiveWorkspaceSession(null);

    expect(sessionStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY)).toBeNull();
  });

  it('broadcasts workspace changes through local storage key', () => {
    const { localStorage } = setupWindow();
    const setItemSpy = vi.spyOn(localStorage, 'setItem');
    const removeItemSpy = vi.spyOn(localStorage, 'removeItem');

    broadcastActiveWorkspaceChange('workspace-2');

    expect(setItemSpy).toHaveBeenCalledWith(
      ACTIVE_WORKSPACE_BROADCAST_KEY,
      expect.stringContaining('workspace-2'),
    );
    expect(removeItemSpy).toHaveBeenCalledWith(ACTIVE_WORKSPACE_BROADCAST_KEY);
  });

  it('parses broadcast payload values', () => {
    expect(parseActiveWorkspaceBroadcast('{"workspaceId":"workspace-3","timestamp":1}')).toBe('workspace-3');
    expect(parseActiveWorkspaceBroadcast('{"workspaceId":null,"timestamp":1}')).toBeNull();
    expect(parseActiveWorkspaceBroadcast('{"workspaceId":123,"timestamp":1}')).toBeUndefined();
    expect(parseActiveWorkspaceBroadcast('not-json')).toBeUndefined();
  });
});
