import { buildDefaultCycleState } from '@/mocks/initial-data';
import { sanitizePersistedState, TOKEN_TRACKER_STORAGE_KEY } from '@/services/persistence';
import {
  getTrackerRepository
} from '@/services/tracker-repository';
import type { PersistedStateV2 } from '@/services/persistence';
import type {
  CycleInfo,
  ISODateString,
  TrackerAccount,
  TrackerAccountProvider,
  TrackerCycleCadence,
  TrackerCycleRecord,
  TrackerWorkspace
} from '@/types/token-tracker';
import {
  endOfMonth,
  endOfWeekSunday,
  isBetweenInclusive,
  startOfMonth,
  startOfWeekMonday,
  todayIsoDate
} from '@/utils/date';

type LegacyPersistedV1 = {
  snapshot?: {
    measurementDate?: ISODateString;
    consumedPercent?: number;
  };
  planning?: Record<string, unknown>;
};

const LEGACY_STATE_V1_KEY = 'token-tracker:state:v1';
const WORKSPACE_SCHEMA_VERSION = 1 as const;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface TrackerAccountSummary {
  id: string;
  name: string;
  provider: TrackerAccountProvider;
  cadence: TrackerCycleCadence;
  quotaPercent: number;
  activeCycleStart: ISODateString;
  activeCycleEnd: ISODateString;
  closedCyclesCount: number;
  isActive: boolean;
  isArchived: boolean;
}

export interface CreateTrackerAccountInput {
  name: string;
  provider: TrackerAccountProvider;
  cadence: TrackerCycleCadence;
  quotaPercent?: number;
}

type TrackerAccountScope = 'active' | 'archived' | 'all';

export interface ListTrackerAccountsOptions {
  scope?: TrackerAccountScope;
}

export interface ActiveTrackerSlice {
  workspace: TrackerWorkspace;
  activeAccount: TrackerAccount;
  activeCycle: TrackerCycleRecord;
  cycle: CycleInfo;
  state: PersistedStateV2;
}

function nowIsoTimestamp(): string {
  return new Date().toISOString();
}

function isArchivedAccount(account: TrackerAccount): boolean {
  return typeof account.archivedAt === 'string' && account.archivedAt.length > 0;
}

function listNonArchivedAccountIds(workspace: TrackerWorkspace): string[] {
  return Object.values(workspace.accounts)
    .filter((account) => !isArchivedAccount(account))
    .map((account) => account.id);
}

function resolveSafeActiveAccountId(
  workspace: TrackerWorkspace,
  preferredActiveAccountId: string
): string | null {
  const nonArchivedAccountIds = listNonArchivedAccountIds(workspace);
  const allAccountIds = Object.keys(workspace.accounts);

  if (nonArchivedAccountIds.length === 0) {
    return allAccountIds[0] ?? null;
  }

  if (nonArchivedAccountIds.includes(preferredActiveAccountId)) {
    return preferredActiveAccountId;
  }

  return nonArchivedAccountIds[0];
}

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function generateUuid(): string {
  if (typeof globalThis !== 'undefined' && 'crypto' in globalThis && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  let seed = Date.now();

  return template.replace(/[xy]/g, (token) => {
    const random = (seed + Math.random() * 16) % 16 | 0;
    seed = Math.floor(seed / 16);

    if (token === 'x') {
      return random.toString(16);
    }

    return ((random & 0x3) | 0x8).toString(16);
  });
}

function buildUniqueAccountId(usedAccountIds: Set<string>): string {
  let nextId = generateUuid();

  while (usedAccountIds.has(nextId)) {
    nextId = generateUuid();
  }

  usedAccountIds.add(nextId);
  return nextId;
}

function buildAccountId(): string {
  return generateUuid();
}

function resolveCycleWindow(referenceDate: ISODateString, cadence: TrackerCycleCadence): {
  cycleStart: ISODateString;
  resetDate: ISODateString;
} {
  if (cadence === 'weekly') {
    return {
      cycleStart: startOfWeekMonday(referenceDate),
      resetDate: endOfWeekSunday(referenceDate)
    };
  }

  return {
    cycleStart: startOfMonth(referenceDate),
    resetDate: endOfMonth(referenceDate)
  };
}

function cloneWorkspace(workspace: TrackerWorkspace): TrackerWorkspace {
  return {
    schemaVersion: workspace.schemaVersion,
    activeAccountId: workspace.activeAccountId,
    accounts: { ...workspace.accounts },
    cycles: { ...workspace.cycles }
  };
}

function toCycleInfoFromRecord(cycle: TrackerCycleRecord): CycleInfo {
  return {
    cycleStart: cycle.cycleStart,
    resetDate: cycle.resetDate,
    quotaPercent: 100
  };
}

function sanitizeCycleState(state: PersistedStateV2, cycle: CycleInfo): PersistedStateV2 {
  const sanitized = sanitizePersistedState(state, cycle);

  if (sanitized) {
    return {
      activeMeasurementDate: sanitized.activeMeasurementDate,
      usageHistory: { ...sanitized.usageHistory },
      estimatedHistory: { ...(sanitized.estimatedHistory ?? {}) },
      planning: { ...sanitized.planning },
      dayNotes: { ...(sanitized.dayNotes ?? {}) }
    };
  }

  const defaults = buildDefaultCycleState(cycle, cycle.cycleStart);

  return {
    activeMeasurementDate: defaults.snapshot.measurementDate,
    usageHistory: { ...defaults.usageHistory },
    estimatedHistory: {},
    planning: { ...defaults.planning },
    dayNotes: {}
  };
}

function buildCycleRecord(input: {
  accountId: string;
  cadence: TrackerCycleCadence;
  cycleStart: ISODateString;
  resetDate: ISODateString;
  quotaPercent: number;
  seedDate: ISODateString;
}): TrackerCycleRecord {
  const createdAt = nowIsoTimestamp();
  const cycleId = `${input.accountId}:${input.cycleStart}:${input.resetDate}`;
  const cycleInfo: CycleInfo = {
    cycleStart: input.cycleStart,
    resetDate: input.resetDate,
    quotaPercent: input.quotaPercent
  };
  const defaults = buildDefaultCycleState(cycleInfo, input.seedDate);

  return {
    id: cycleId,
    accountId: input.accountId,
    cadence: input.cadence,
    cycleStart: input.cycleStart,
    resetDate: input.resetDate,
    status: 'active',
    state: {
      activeMeasurementDate: defaults.snapshot.measurementDate,
      usageHistory: { ...defaults.usageHistory },
      estimatedHistory: {},
      planning: { ...defaults.planning },
      dayNotes: {}
    },
    createdAt,
    updatedAt: createdAt
  };
}

function buildDefaultAccount(referenceDate: ISODateString): {
  account: TrackerAccount;
  cycle: TrackerCycleRecord;
} {
  const accountId = buildAccountId();
  const cadence: TrackerCycleCadence = 'monthly';
  const { cycleStart, resetDate } = resolveCycleWindow(referenceDate, cadence);
  const cycle = buildCycleRecord({
    accountId,
    cadence,
    cycleStart,
    resetDate,
    quotaPercent: 100,
    seedDate: referenceDate
  });
  const createdAt = nowIsoTimestamp();

  return {
    account: {
      id: accountId,
      name: 'Default Account',
      provider: 'custom',
      cadence,
      quotaPercent: 100,
      activeCycleId: cycle.id,
      cycleIds: [cycle.id],
      archivedAt: null,
      createdAt,
      updatedAt: createdAt
    },
    cycle
  };
}

function buildWorkspaceFromDefault(referenceDate: ISODateString): TrackerWorkspace {
  const { account, cycle } = buildDefaultAccount(referenceDate);

  return {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    activeAccountId: account.id,
    accounts: {
      [account.id]: account
    },
    cycles: {
      [cycle.id]: cycle
    }
  };
}

function toRecordFromLegacy(legacyRaw: string | null): unknown | null {
  if (!legacyRaw) {
    return null;
  }

  try {
    return JSON.parse(legacyRaw) as LegacyPersistedV1;
  } catch {
    return null;
  }
}

function migrateLegacyState(referenceDate: ISODateString): TrackerWorkspace {
  const repository = getTrackerRepository();
  const storage = typeof globalThis !== 'undefined' && 'localStorage' in globalThis
    ? globalThis.localStorage
    : null;
  const defaults = buildWorkspaceFromDefault(referenceDate);

  if (!storage) {
    return defaults;
  }

  const defaultAccountId = defaults.activeAccountId;
  const cycleId = defaults.accounts[defaultAccountId].activeCycleId;
  const activeCycle = defaults.cycles[cycleId];
  const cycleInfo = toCycleInfoFromRecord(activeCycle);
  const legacyV2 = toRecordFromLegacy(storage.getItem(TOKEN_TRACKER_STORAGE_KEY));
  const legacyV1 = toRecordFromLegacy(storage.getItem(LEGACY_STATE_V1_KEY));
  const sanitizedFromV2 = legacyV2 ? sanitizePersistedState(legacyV2, cycleInfo) : null;
  const sanitizedFromV1 = sanitizedFromV2 ? null : (legacyV1 ? sanitizePersistedState(legacyV1, cycleInfo) : null);
  const nextState = sanitizedFromV2 ?? sanitizedFromV1;

  if (!nextState) {
    repository.saveWorkspace(defaults);
    return defaults;
  }

  activeCycle.state = {
    activeMeasurementDate: nextState.activeMeasurementDate,
    usageHistory: { ...nextState.usageHistory },
    estimatedHistory: { ...(nextState.estimatedHistory ?? {}) },
    planning: { ...nextState.planning },
    dayNotes: { ...(nextState.dayNotes ?? {}) }
  };
  activeCycle.updatedAt = nowIsoTimestamp();
  repository.saveWorkspace(defaults);

  return defaults;
}

function ensureWorkspaceAccountIdsAreUuids(workspace: TrackerWorkspace): TrackerWorkspace {
  const accountIds = Object.keys(workspace.accounts);
  const nonUuidAccountIds = accountIds.filter((accountId) => !isUuid(accountId));

  if (nonUuidAccountIds.length === 0) {
    return workspace;
  }

  const usedAccountIds = new Set(accountIds.filter((accountId) => isUuid(accountId)));
  const accountIdByLegacyId = new Map<string, string>();

  for (const legacyId of nonUuidAccountIds) {
    accountIdByLegacyId.set(legacyId, buildUniqueAccountId(usedAccountIds));
  }

  const cycleIdByLegacyId = new Map<string, string>();
  const migratedCycles: Record<string, TrackerCycleRecord> = {};

  for (const [legacyCycleId, cycle] of Object.entries(workspace.cycles)) {
    const nextAccountId = accountIdByLegacyId.get(cycle.accountId) ?? cycle.accountId;
    const nextCycleId = nextAccountId === cycle.accountId
      ? legacyCycleId
      : `${nextAccountId}:${cycle.cycleStart}:${cycle.resetDate}`;

    cycleIdByLegacyId.set(legacyCycleId, nextCycleId);
    migratedCycles[nextCycleId] = {
      ...cycle,
      id: nextCycleId,
      accountId: nextAccountId
    };
  }

  const migratedAccounts: Record<string, TrackerAccount> = {};

  for (const [legacyAccountId, account] of Object.entries(workspace.accounts)) {
    const nextAccountId = accountIdByLegacyId.get(legacyAccountId) ?? legacyAccountId;
    const nextCycleIds = account.cycleIds
      .map((cycleId) => cycleIdByLegacyId.get(cycleId) ?? cycleId)
      .filter((cycleId, index, allCycleIds) => allCycleIds.indexOf(cycleId) === index)
      .sort();
    const nextActiveCycleId = cycleIdByLegacyId.get(account.activeCycleId) ?? account.activeCycleId;

    migratedAccounts[nextAccountId] = {
      ...account,
      id: nextAccountId,
      activeCycleId: nextActiveCycleId,
      cycleIds: nextCycleIds
    };
  }

  const nextActiveAccountId = accountIdByLegacyId.get(workspace.activeAccountId) ?? workspace.activeAccountId;
  const migratedWorkspace: TrackerWorkspace = {
    schemaVersion: workspace.schemaVersion,
    activeAccountId: nextActiveAccountId,
    accounts: migratedAccounts,
    cycles: migratedCycles
  };
  const fallbackActiveAccountId = resolveSafeActiveAccountId(migratedWorkspace, nextActiveAccountId);

  if (!fallbackActiveAccountId) {
    return migratedWorkspace;
  }

  return {
    schemaVersion: migratedWorkspace.schemaVersion,
    activeAccountId: fallbackActiveAccountId,
    accounts: migratedWorkspace.accounts,
    cycles: migratedWorkspace.cycles
  };
}

function isValidCadence(value: unknown): value is TrackerCycleCadence {
  return value === 'monthly' || value === 'weekly';
}

function isValidProvider(value: unknown): value is TrackerAccountProvider {
  return value === 'custom' || value === 'copilot' || value === 'claude' || value === 'codex';
}

function isValidIsoDate(value: unknown): value is ISODateString {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function sanitizeWorkspace(raw: TrackerWorkspace | null): TrackerWorkspace | null {
  if (!raw || raw.schemaVersion !== WORKSPACE_SCHEMA_VERSION) {
    return null;
  }

  if (!raw.activeAccountId || typeof raw.activeAccountId !== 'string') {
    return null;
  }

  const accounts: Record<string, TrackerAccount> = {};
  const cycles: Record<string, TrackerCycleRecord> = {};

  for (const [accountId, candidate] of Object.entries(raw.accounts ?? {})) {
    if (!candidate || typeof candidate !== 'object') {
      continue;
    }

    if (
      typeof candidate.name !== 'string' ||
      !isValidCadence(candidate.cadence) ||
      !isValidProvider(candidate.provider) ||
      typeof candidate.quotaPercent !== 'number' ||
      !Number.isFinite(candidate.quotaPercent) ||
      typeof candidate.activeCycleId !== 'string' ||
      !Array.isArray(candidate.cycleIds)
    ) {
      continue;
    }

    accounts[accountId] = {
      id: accountId,
      name: candidate.name,
      provider: candidate.provider,
      cadence: candidate.cadence,
      quotaPercent: candidate.quotaPercent,
      activeCycleId: candidate.activeCycleId,
      cycleIds: candidate.cycleIds.filter((cycleId): cycleId is string => typeof cycleId === 'string'),
      archivedAt: typeof candidate.archivedAt === 'string' ? candidate.archivedAt : null,
      createdAt: typeof candidate.createdAt === 'string' ? candidate.createdAt : nowIsoTimestamp(),
      updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : nowIsoTimestamp()
    };
  }

  for (const [cycleId, candidate] of Object.entries(raw.cycles ?? {})) {
    if (!candidate || typeof candidate !== 'object') {
      continue;
    }

    if (
      typeof candidate.accountId !== 'string' ||
      !isValidCadence(candidate.cadence) ||
      !isValidIsoDate(candidate.cycleStart) ||
      !isValidIsoDate(candidate.resetDate) ||
      (candidate.status !== 'active' && candidate.status !== 'closed')
    ) {
      continue;
    }

    const account = accounts[candidate.accountId];

    if (!account) {
      continue;
    }

    const cycleInfo: CycleInfo = {
      cycleStart: candidate.cycleStart,
      resetDate: candidate.resetDate,
      quotaPercent: account.quotaPercent
    };
    const nextState = sanitizePersistedState(candidate.state, cycleInfo);

    if (!nextState) {
      continue;
    }

    cycles[cycleId] = {
      id: cycleId,
      accountId: candidate.accountId,
      cadence: candidate.cadence,
      cycleStart: candidate.cycleStart,
      resetDate: candidate.resetDate,
      status: candidate.status,
      state: {
        activeMeasurementDate: nextState.activeMeasurementDate,
        usageHistory: { ...nextState.usageHistory },
        estimatedHistory: { ...(nextState.estimatedHistory ?? {}) },
        planning: { ...nextState.planning },
        dayNotes: { ...(nextState.dayNotes ?? {}) }
      },
      createdAt: typeof candidate.createdAt === 'string' ? candidate.createdAt : nowIsoTimestamp(),
      updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : nowIsoTimestamp()
    };
  }

  const migratedWorkspace = ensureWorkspaceAccountIdsAreUuids({
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    activeAccountId: raw.activeAccountId,
    accounts,
    cycles
  });
  const safeActiveAccountId = resolveSafeActiveAccountId(migratedWorkspace, migratedWorkspace.activeAccountId);

  if (!safeActiveAccountId) {
    return null;
  }

  return {
    schemaVersion: migratedWorkspace.schemaVersion,
    activeAccountId: safeActiveAccountId,
    accounts: migratedWorkspace.accounts,
    cycles: migratedWorkspace.cycles
  };
}

function ensureAccountHasActiveCycle(workspace: TrackerWorkspace, account: TrackerAccount, referenceDate: ISODateString) {
  const { cycleStart, resetDate } = resolveCycleWindow(referenceDate, account.cadence);
  const expectedCycleId = `${account.id}:${cycleStart}:${resetDate}`;
  const currentCycle = workspace.cycles[account.activeCycleId];
  const currentMatchesWindow =
    currentCycle &&
    currentCycle.accountId === account.id &&
    currentCycle.cycleStart === cycleStart &&
    currentCycle.resetDate === resetDate;

  if (currentMatchesWindow) {
    currentCycle.status = 'active';
    currentCycle.updatedAt = nowIsoTimestamp();

    const sanitizedState = sanitizeCycleState(
      currentCycle.state,
      {
        cycleStart: currentCycle.cycleStart,
        resetDate: currentCycle.resetDate,
        quotaPercent: account.quotaPercent
      }
    );
    currentCycle.state = sanitizedState;
    return;
  }

  if (currentCycle) {
    currentCycle.status = 'closed';
    currentCycle.updatedAt = nowIsoTimestamp();
  }

  const nextCycle = workspace.cycles[expectedCycleId] ?? buildCycleRecord({
    accountId: account.id,
    cadence: account.cadence,
    cycleStart,
    resetDate,
    quotaPercent: account.quotaPercent,
    seedDate: referenceDate
  });

  nextCycle.status = 'active';
  nextCycle.updatedAt = nowIsoTimestamp();
  nextCycle.state = sanitizeCycleState(
    nextCycle.state,
    {
      cycleStart: nextCycle.cycleStart,
      resetDate: nextCycle.resetDate,
      quotaPercent: account.quotaPercent
    }
  );
  workspace.cycles[nextCycle.id] = nextCycle;

  account.activeCycleId = nextCycle.id;
  if (!account.cycleIds.includes(nextCycle.id)) {
    account.cycleIds = [...account.cycleIds, nextCycle.id].sort();
  }
  account.updatedAt = nowIsoTimestamp();
}

function ensureWorkspaceAccounts(workspace: TrackerWorkspace, referenceDate: ISODateString) {
  for (const account of Object.values(workspace.accounts)) {
    if (isArchivedAccount(account)) {
      continue;
    }

    ensureAccountHasActiveCycle(workspace, account, referenceDate);
  }
}

function writeLegacyMirror(state: PersistedStateV2): void {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return;
  }

  globalThis.localStorage.setItem(TOKEN_TRACKER_STORAGE_KEY, JSON.stringify(state));
}

function loadWorkspace(referenceDate: ISODateString): TrackerWorkspace {
  const repository = getTrackerRepository();
  const raw = repository.loadWorkspace();
  const sanitized = sanitizeWorkspace(raw);

  if (sanitized) {
    return sanitized;
  }

  return migrateLegacyState(referenceDate);
}

export function loadActiveTrackerSlice(referenceDate: ISODateString = todayIsoDate()): ActiveTrackerSlice {
  const repository = getTrackerRepository();
  const workspace = loadWorkspace(referenceDate);
  ensureWorkspaceAccounts(workspace, referenceDate);
  const safeActiveAccountId = resolveSafeActiveAccountId(workspace, workspace.activeAccountId);
  const activeAccount = safeActiveAccountId
    ? workspace.accounts[safeActiveAccountId]
    : undefined;

  if (!activeAccount) {
    const fresh = buildWorkspaceFromDefault(referenceDate);
    repository.saveWorkspace(fresh);
    const fallbackAccount = fresh.accounts[fresh.activeAccountId];
    const fallbackCycle = fresh.cycles[fallbackAccount.activeCycleId];
    writeLegacyMirror(fallbackCycle.state);

    return {
      workspace: fresh,
      activeAccount: fallbackAccount,
      activeCycle: fallbackCycle,
      cycle: toCycleInfoFromRecord(fallbackCycle),
      state: fallbackCycle.state
    };
  }

  workspace.activeAccountId = activeAccount.id;

  ensureAccountHasActiveCycle(workspace, activeAccount, referenceDate);
  const activeCycle = workspace.cycles[activeAccount.activeCycleId];

  if (!activeCycle) {
    const freshCycle = buildCycleRecord({
      accountId: activeAccount.id,
      cadence: activeAccount.cadence,
      cycleStart: resolveCycleWindow(referenceDate, activeAccount.cadence).cycleStart,
      resetDate: resolveCycleWindow(referenceDate, activeAccount.cadence).resetDate,
      quotaPercent: activeAccount.quotaPercent,
      seedDate: referenceDate
    });
    workspace.cycles[freshCycle.id] = freshCycle;
    activeAccount.activeCycleId = freshCycle.id;
    activeAccount.cycleIds = [...activeAccount.cycleIds, freshCycle.id].sort();
  }

  const resolvedCycle = workspace.cycles[activeAccount.activeCycleId];
  const cycleInfo: CycleInfo = {
    cycleStart: resolvedCycle.cycleStart,
    resetDate: resolvedCycle.resetDate,
    quotaPercent: activeAccount.quotaPercent
  };
  const sanitizedState = sanitizeCycleState(resolvedCycle.state, cycleInfo);

  resolvedCycle.state = sanitizedState;
  resolvedCycle.updatedAt = nowIsoTimestamp();
  repository.saveWorkspace(workspace);
  writeLegacyMirror(resolvedCycle.state);

  return {
    workspace,
    activeAccount,
    activeCycle: resolvedCycle,
    cycle: cycleInfo,
    state: sanitizedState
  };
}

export function persistActiveTrackerState(
  activeCycleId: string,
  nextState: PersistedStateV2,
  referenceDate: ISODateString = todayIsoDate()
): void {
  const repository = getTrackerRepository();
  const workspace = loadWorkspace(referenceDate);
  const cycle = workspace.cycles[activeCycleId];

  if (!cycle) {
    return;
  }

  const account = workspace.accounts[cycle.accountId];

  if (!account) {
    return;
  }

  const cycleInfo: CycleInfo = {
    cycleStart: cycle.cycleStart,
    resetDate: cycle.resetDate,
    quotaPercent: account.quotaPercent
  };
  const sanitized = sanitizeCycleState(nextState, cycleInfo);

  cycle.state = sanitized;
  cycle.updatedAt = nowIsoTimestamp();
  repository.saveWorkspace(workspace);
  writeLegacyMirror(sanitized);
}

export function listAccountCycles(accountId: string): TrackerCycleRecord[] {
  const workspace = loadWorkspace(todayIsoDate());
  const account = workspace.accounts[accountId];

  if (!account) {
    return [];
  }

  return account.cycleIds
    .map((cycleId) => workspace.cycles[cycleId])
    .filter((cycle): cycle is TrackerCycleRecord => !!cycle)
    .sort((a, b) => b.cycleStart.localeCompare(a.cycleStart));
}

export function listTrackerAccounts(
  referenceDate: ISODateString = todayIsoDate(),
  options: ListTrackerAccountsOptions = {}
): TrackerAccountSummary[] {
  const workspace = loadWorkspace(referenceDate);
  ensureWorkspaceAccounts(workspace, referenceDate);
  const scope = options.scope ?? 'active';

  return Object.values(workspace.accounts)
    .map((account) => {
      const isArchived = isArchivedAccount(account);

      if (scope === 'active' && isArchived) {
        return null;
      }

      if (scope === 'archived' && !isArchived) {
        return null;
      }

      const activeCycle = workspace.cycles[account.activeCycleId];

      if (!activeCycle) {
        return null;
      }

      const closedCyclesCount = account.cycleIds
        .map((cycleId) => workspace.cycles[cycleId])
        .filter((cycle): cycle is TrackerCycleRecord => !!cycle && cycle.status === 'closed')
        .length;

      return {
        id: account.id,
        name: account.name,
        provider: account.provider,
        cadence: account.cadence,
        quotaPercent: account.quotaPercent,
        activeCycleStart: activeCycle.cycleStart,
        activeCycleEnd: activeCycle.resetDate,
        closedCyclesCount,
        isActive: account.id === workspace.activeAccountId,
        isArchived
      };
    })
    .filter((summary): summary is TrackerAccountSummary => !!summary)
    .sort((a, b) => {
      if (a.isArchived && !b.isArchived) {
        return 1;
      }

      if (!a.isArchived && b.isArchived) {
        return -1;
      }

      if (a.isActive && !b.isActive) {
        return -1;
      }

      if (!a.isActive && b.isActive) {
        return 1;
      }

      return a.name.localeCompare(b.name);
    });
}

export function activateTrackerAccount(
  accountId: string,
  referenceDate: ISODateString = todayIsoDate()
): ActiveTrackerSlice | null {
  const repository = getTrackerRepository();
  const workspace = cloneWorkspace(loadWorkspace(referenceDate));
  const candidateAccount = workspace.accounts[accountId];

  if (!candidateAccount || isArchivedAccount(candidateAccount)) {
    return null;
  }

  workspace.activeAccountId = accountId;
  repository.saveWorkspace(workspace);

  return loadActiveTrackerSlice(referenceDate);
}

export function createTrackerAccount(
  input: CreateTrackerAccountInput,
  referenceDate: ISODateString = todayIsoDate()
): ActiveTrackerSlice {
  const repository = getTrackerRepository();
  const workspace = cloneWorkspace(loadWorkspace(referenceDate));
  const createdAt = nowIsoTimestamp();
  const trimmedName = input.name.trim();
  const accountName = trimmedName.length > 0 ? trimmedName.slice(0, 60) : 'New Account';
  const accountId = buildAccountId();
  const cadence = input.cadence;
  const quotaPercent = Number.isFinite(input.quotaPercent)
    ? Math.max(1, Math.min(100, Number(input.quotaPercent)))
    : 100;
  const { cycleStart, resetDate } = resolveCycleWindow(referenceDate, cadence);
  const cycle = buildCycleRecord({
    accountId,
    cadence,
    cycleStart,
    resetDate,
    quotaPercent,
    seedDate: referenceDate
  });

  workspace.accounts[accountId] = {
    id: accountId,
    name: accountName,
    provider: input.provider,
    cadence,
    quotaPercent,
    activeCycleId: cycle.id,
    cycleIds: [cycle.id],
    archivedAt: null,
    createdAt,
    updatedAt: createdAt
  };
  workspace.cycles[cycle.id] = cycle;
  workspace.activeAccountId = accountId;
  repository.saveWorkspace(workspace);

  return loadActiveTrackerSlice(referenceDate);
}

export function renameTrackerAccount(
  accountId: string,
  nextName: string,
  referenceDate: ISODateString = todayIsoDate()
): ActiveTrackerSlice | null {
  const repository = getTrackerRepository();
  const workspace = cloneWorkspace(loadWorkspace(referenceDate));
  const account = workspace.accounts[accountId];

  if (!account) {
    return null;
  }

  const trimmedName = nextName.trim();

  if (trimmedName.length === 0) {
    return null;
  }

  account.name = trimmedName.slice(0, 60);
  account.updatedAt = nowIsoTimestamp();
  repository.saveWorkspace(workspace);

  return loadActiveTrackerSlice(referenceDate);
}

export function archiveTrackerAccount(
  accountId: string,
  referenceDate: ISODateString = todayIsoDate()
): ActiveTrackerSlice | null {
  const repository = getTrackerRepository();
  const workspace = cloneWorkspace(loadWorkspace(referenceDate));
  const account = workspace.accounts[accountId];

  if (!account || isArchivedAccount(account)) {
    return null;
  }

  const nonArchivedAccountIds = listNonArchivedAccountIds(workspace);

  if (nonArchivedAccountIds.length <= 1) {
    return null;
  }

  account.archivedAt = nowIsoTimestamp();
  account.updatedAt = nowIsoTimestamp();

  if (workspace.activeAccountId === accountId) {
    const fallbackAccountId = nonArchivedAccountIds.find((id) => id !== accountId) ?? null;

    if (!fallbackAccountId) {
      return null;
    }

    workspace.activeAccountId = fallbackAccountId;
  }

  repository.saveWorkspace(workspace);

  return loadActiveTrackerSlice(referenceDate);
}

export function unarchiveTrackerAccount(
  accountId: string,
  referenceDate: ISODateString = todayIsoDate()
): ActiveTrackerSlice | null {
  const repository = getTrackerRepository();
  const workspace = cloneWorkspace(loadWorkspace(referenceDate));
  const account = workspace.accounts[accountId];

  if (!account || !isArchivedAccount(account)) {
    return null;
  }

  account.archivedAt = null;
  account.updatedAt = nowIsoTimestamp();
  repository.saveWorkspace(workspace);

  return loadActiveTrackerSlice(referenceDate);
}

export function deleteArchivedTrackerAccount(
  accountId: string,
  referenceDate: ISODateString = todayIsoDate()
): ActiveTrackerSlice | null {
  const repository = getTrackerRepository();
  const workspace = cloneWorkspace(loadWorkspace(referenceDate));
  const account = workspace.accounts[accountId];

  if (!account || !isArchivedAccount(account)) {
    return null;
  }

  for (const cycleId of account.cycleIds) {
    delete workspace.cycles[cycleId];
  }

  delete workspace.accounts[accountId];

  const safeActiveAccountId = resolveSafeActiveAccountId(workspace, workspace.activeAccountId);

  if (!safeActiveAccountId) {
    return null;
  }

  workspace.activeAccountId = safeActiveAccountId;
  repository.saveWorkspace(workspace);

  return loadActiveTrackerSlice(referenceDate);
}

export function isDateInsideCycle(date: ISODateString, cycle: CycleInfo): boolean {
  return isBetweenInclusive(date, cycle.cycleStart, cycle.resetDate);
}
