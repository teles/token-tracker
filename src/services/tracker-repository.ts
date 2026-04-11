import type { TrackerWorkspace } from '@/types/token-tracker';

const WORKSPACE_STORAGE_KEY = 'token-tracker:workspace:v1';

function getStorage(): Storage | null {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return null;
  }

  return globalThis.localStorage;
}

export interface TrackerRepository {
  loadWorkspace(): TrackerWorkspace | null;
  saveWorkspace(workspace: TrackerWorkspace): void;
  clearWorkspace(): void;
}

export class LocalStorageTrackerRepository implements TrackerRepository {
  loadWorkspace(): TrackerWorkspace | null {
    const storage = getStorage();

    if (!storage) {
      return null;
    }

    const raw = storage.getItem(WORKSPACE_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as TrackerWorkspace;
    } catch {
      return null;
    }
  }

  saveWorkspace(workspace: TrackerWorkspace): void {
    const storage = getStorage();

    if (!storage) {
      return;
    }

    storage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
  }

  clearWorkspace(): void {
    const storage = getStorage();

    if (!storage) {
      return;
    }

    storage.removeItem(WORKSPACE_STORAGE_KEY);
  }
}

let activeTrackerRepository: TrackerRepository = new LocalStorageTrackerRepository();

export function getTrackerRepository(): TrackerRepository {
  return activeTrackerRepository;
}

export function setTrackerRepository(repository: TrackerRepository): void {
  activeTrackerRepository = repository;
}

export const TOKEN_TRACKER_WORKSPACE_STORAGE_KEY = WORKSPACE_STORAGE_KEY;
