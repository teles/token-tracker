import { TOKEN_TRACKER_STORAGE_KEY } from '@/services/persistence';
import {
  activateTrackerAccount,
  archiveTrackerAccount,
  createTrackerAccount,
  deleteArchivedTrackerAccount,
  listAccountCycles,
  listTrackerAccounts,
  loadActiveTrackerSlice,
  renameTrackerAccount,
  unarchiveTrackerAccount
} from '@/services/tracker-workspace';
import { TOKEN_TRACKER_WORKSPACE_STORAGE_KEY } from '@/services/tracker-repository';
import { todayIsoDate } from '@/utils/date';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class MemoryStorage implements Storage {
  private map = new Map<string, string>();

  get length(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

describe('tracker workspace', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 3, 9, 12, 0, 0)));

    Object.defineProperty(globalThis, 'localStorage', {
      value: new MemoryStorage(),
      configurable: true,
      writable: true
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('migrates legacy cycle state into workspace storage', () => {
    globalThis.localStorage.setItem(
      TOKEN_TRACKER_STORAGE_KEY,
      JSON.stringify({
        activeMeasurementDate: '2026-04-09',
        usageHistory: {
          '2026-04-09': 26.5
        },
        planning: {
          '2026-04-10': 'on'
        },
        dayNotes: {
          '2026-04-09': 'Legacy note'
        }
      })
    );

    const slice = loadActiveTrackerSlice();
    const workspaceRaw = globalThis.localStorage.getItem(TOKEN_TRACKER_WORKSPACE_STORAGE_KEY);

    expect(slice.state.activeMeasurementDate).toBe('2026-04-09');
    expect(slice.state.dayNotes['2026-04-09']).toBe('Legacy note');
    expect(workspaceRaw).not.toBeNull();
  });

  it('archives previous month cycle and creates a new active cycle', () => {
    const aprilSlice = loadActiveTrackerSlice();

    expect(aprilSlice.cycle.cycleStart).toBe('2026-04-01');
    expect(aprilSlice.cycle.resetDate).toBe('2026-04-30');

    vi.setSystemTime(new Date(Date.UTC(2026, 4, 2, 12, 0, 0)));

    const maySlice = loadActiveTrackerSlice();
    const accountCycles = listAccountCycles(maySlice.activeAccount.id);
    const aprilCycle = accountCycles.find((cycle) => cycle.cycleStart === '2026-04-01');

    expect(maySlice.cycle.cycleStart).toBe('2026-05-01');
    expect(maySlice.cycle.resetDate).toBe('2026-05-31');
    expect(aprilCycle?.status).toBe('closed');
  });

  it('supports weekly cadence cycles', () => {
    const weeklyWorkspace = {
      schemaVersion: 1,
      activeAccountId: 'acct-weekly',
      accounts: {
        'acct-weekly': {
          id: 'acct-weekly',
          name: 'Weekly Codex',
          provider: 'codex',
          cadence: 'weekly',
          quotaPercent: 100,
          activeCycleId: 'acct-weekly:2026-04-06:2026-04-12',
          cycleIds: ['acct-weekly:2026-04-06:2026-04-12'],
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-09T00:00:00.000Z'
        }
      },
      cycles: {
        'acct-weekly:2026-04-06:2026-04-12': {
          id: 'acct-weekly:2026-04-06:2026-04-12',
          accountId: 'acct-weekly',
          cadence: 'weekly',
          cycleStart: '2026-04-06',
          resetDate: '2026-04-12',
          status: 'active',
          state: {
            activeMeasurementDate: '2026-04-09',
            usageHistory: {
              '2026-04-09': 40
            },
            planning: {},
            dayNotes: {}
          },
          createdAt: '2026-04-06T00:00:00.000Z',
          updatedAt: '2026-04-09T00:00:00.000Z'
        }
      }
    };

    globalThis.localStorage.setItem(
      TOKEN_TRACKER_WORKSPACE_STORAGE_KEY,
      JSON.stringify(weeklyWorkspace)
    );

    vi.setSystemTime(new Date(Date.UTC(2026, 3, 15, 12, 0, 0)));

    const slice = loadActiveTrackerSlice();
    const closedCycle = listAccountCycles(slice.activeAccount.id).find((cycle) => cycle.cycleStart === '2026-04-06');

    expect(slice.cycle.cycleStart).toBe('2026-04-13');
    expect(slice.cycle.resetDate).toBe('2026-04-19');
    expect(closedCycle?.status).toBe('closed');
  });

  it('creates a new account and switches context', () => {
    const baseSlice = loadActiveTrackerSlice();
    const defaultAccountId = baseSlice.activeAccount.id;

    expect(defaultAccountId).toMatch(UUID_PATTERN);

    const createdSlice = createTrackerAccount({
      name: 'Codex Team B',
      provider: 'codex',
      cadence: 'weekly'
    });
    const accountList = listTrackerAccounts();
    const createdAccount = accountList.find((account) => account.id === createdSlice.activeAccount.id);

    expect(createdSlice.activeAccount.name).toBe('Codex Team B');
    expect(createdSlice.activeAccount.id).toMatch(UUID_PATTERN);
    expect(createdSlice.activeAccount.cadence).toBe('weekly');
    expect(createdAccount?.isActive).toBe(true);
    expect(accountList.length).toBeGreaterThanOrEqual(2);
  });

  it('switches between existing accounts', () => {
    const baseSlice = loadActiveTrackerSlice();
    const defaultAccountId = baseSlice.activeAccount.id;
    const createdSlice = createTrackerAccount({
      name: 'Claude Ops',
      provider: 'claude',
      cadence: 'monthly'
    });
    const switchedSlice = activateTrackerAccount(defaultAccountId);

    expect(createdSlice.activeAccount.id).not.toBe(defaultAccountId);
    expect(switchedSlice).not.toBeNull();
    expect(switchedSlice?.activeAccount.id).toBe(defaultAccountId);
  });

  it('renames an account', () => {
    const baseSlice = loadActiveTrackerSlice();
    const renamedSlice = renameTrackerAccount(baseSlice.activeAccount.id, 'Operations Team');
    const summaries = listTrackerAccounts();
    const renamedSummary = summaries.find((summary) => summary.id === baseSlice.activeAccount.id);

    expect(renamedSlice).not.toBeNull();
    expect(renamedSlice?.activeAccount.name).toBe('Operations Team');
    expect(renamedSummary?.name).toBe('Operations Team');
  });

  it('archives an account, keeps it out of active selectors, and allows restore/delete lifecycle', () => {
    const baseSlice = loadActiveTrackerSlice();
    const defaultAccountId = baseSlice.activeAccount.id;
    const createdSlice = createTrackerAccount({
      name: 'Archive Candidate',
      provider: 'custom',
      cadence: 'monthly'
    });
    const candidateAccountId = createdSlice.activeAccount.id;

    const archivedSlice = archiveTrackerAccount(candidateAccountId);
    const activeSummariesAfterArchive = listTrackerAccounts();
    const archivedSummariesAfterArchive = listTrackerAccounts(todayIsoDate(), { scope: 'archived' });
    const archivedSummary = archivedSummariesAfterArchive.find((summary) => summary.id === candidateAccountId);
    const activateArchived = activateTrackerAccount(candidateAccountId);

    expect(archivedSlice).not.toBeNull();
    expect(archivedSlice?.activeAccount.id).toBe(defaultAccountId);
    expect(activeSummariesAfterArchive.some((summary) => summary.id === candidateAccountId)).toBe(false);
    expect(archivedSummary?.isArchived).toBe(true);
    expect(activateArchived).toBeNull();

    const unarchivedSlice = unarchiveTrackerAccount(candidateAccountId);
    const activeSummariesAfterUnarchive = listTrackerAccounts();

    expect(unarchivedSlice).not.toBeNull();
    expect(activeSummariesAfterUnarchive.some((summary) => summary.id === candidateAccountId)).toBe(true);

    const archivedAgainSlice = archiveTrackerAccount(candidateAccountId);
    const deletedSlice = deleteArchivedTrackerAccount(candidateAccountId);
    const activeSummariesAfterDelete = listTrackerAccounts();
    const archivedSummariesAfterDelete = listTrackerAccounts(todayIsoDate(), { scope: 'archived' });

    expect(archivedAgainSlice).not.toBeNull();
    expect(deletedSlice).not.toBeNull();
    expect(activeSummariesAfterDelete.some((summary) => summary.id === candidateAccountId)).toBe(false);
    expect(archivedSummariesAfterDelete.some((summary) => summary.id === candidateAccountId)).toBe(false);
  });

  it('does not archive the only active account', () => {
    const baseSlice = loadActiveTrackerSlice();
    const archivedSlice = archiveTrackerAccount(baseSlice.activeAccount.id);

    expect(archivedSlice).toBeNull();
  });

  it('migrates legacy account ids into UUIDs in workspace storage', () => {
    globalThis.localStorage.setItem(
      TOKEN_TRACKER_WORKSPACE_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        activeAccountId: 'account-default',
        accounts: {
          'account-default': {
            id: 'account-default',
            name: 'Default Legacy',
            provider: 'custom',
            cadence: 'monthly',
            quotaPercent: 100,
            activeCycleId: 'account-default:2026-04-01:2026-04-30',
            cycleIds: ['account-default:2026-04-01:2026-04-30'],
            createdAt: '2026-04-01T00:00:00.000Z',
            updatedAt: '2026-04-09T00:00:00.000Z'
          }
        },
        cycles: {
          'account-default:2026-04-01:2026-04-30': {
            id: 'account-default:2026-04-01:2026-04-30',
            accountId: 'account-default',
            cadence: 'monthly',
            cycleStart: '2026-04-01',
            resetDate: '2026-04-30',
            status: 'active',
            state: {
              activeMeasurementDate: '2026-04-09',
              usageHistory: {
                '2026-04-09': 40
              },
              planning: {},
              dayNotes: {}
            },
            createdAt: '2026-04-01T00:00:00.000Z',
            updatedAt: '2026-04-09T00:00:00.000Z'
          }
        }
      })
    );

    const slice = loadActiveTrackerSlice();
    const storedWorkspace = JSON.parse(globalThis.localStorage.getItem(TOKEN_TRACKER_WORKSPACE_STORAGE_KEY) ?? '{}');
    const migratedCycle = Object.values(storedWorkspace.cycles ?? {})[0] as { accountId: string; id: string } | undefined;

    expect(slice.activeAccount.id).toMatch(UUID_PATTERN);
    expect(storedWorkspace.activeAccountId).toBe(slice.activeAccount.id);
    expect(Object.keys(storedWorkspace.accounts ?? {})).toEqual([slice.activeAccount.id]);
    expect(migratedCycle?.accountId).toBe(slice.activeAccount.id);
    expect(migratedCycle?.id.startsWith(`${slice.activeAccount.id}:`)).toBe(true);
  });
});
