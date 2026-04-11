import {
  buildDataExportPayload,
  parseDataImportPayload,
  serializeDataExportPayload
} from '@/services/data-transfer';
import type { PersistedStateV2 } from '@/services/persistence';
import type { CycleInfo } from '@/types/token-tracker';

describe('data transfer service', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 3, 9, 12, 0, 0)));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const cycle: CycleInfo = {
    cycleStart: '2026-04-01',
    resetDate: '2026-04-30',
    quotaPercent: 100
  };

  const state: PersistedStateV2 = {
    activeMeasurementDate: '2026-04-09',
    usageHistory: {
      '2026-04-09': 26.5
    },
    planning: {
      '2026-04-10': 'on'
    },
    dayNotes: {
      '2026-04-09': 'Teste'
    }
  };

  it('exports and imports payload for the same cycle', () => {
    const payload = buildDataExportPayload({
      cycle,
      state,
      language: 'pt-BR'
    });
    const serialized = serializeDataExportPayload(payload);
    const parsed = parseDataImportPayload(serialized, cycle);

    expect(parsed.ok).toBe(true);

    if (!parsed.ok) {
      return;
    }

    expect(parsed.state.activeMeasurementDate).toBe(state.activeMeasurementDate);
    expect(parsed.state.usageHistory['2026-04-09']).toBe(26.5);
    expect(parsed.state.dayNotes?.['2026-04-09']).toBe('Teste');
    expect(parsed.importedLanguage).toBe('pt-BR');
  });

  it('rejects payload from a different cycle', () => {
    const payload = buildDataExportPayload({
      cycle: {
        ...cycle,
        cycleStart: '2026-03-01'
      },
      state,
      language: 'en-US'
    });
    const serialized = serializeDataExportPayload(payload);
    const parsed = parseDataImportPayload(serialized, cycle);

    expect(parsed.ok).toBe(false);

    if (parsed.ok) {
      return;
    }

    expect(parsed.errorCode).toBe('cycle-mismatch');
  });

  it('rejects malformed json payload', () => {
    const parsed = parseDataImportPayload('{not-json', cycle);

    expect(parsed.ok).toBe(false);

    if (parsed.ok) {
      return;
    }

    expect(parsed.errorCode).toBe('invalid-json');
  });
});
