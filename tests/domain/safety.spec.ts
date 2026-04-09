import { classifySafetyStatus } from '@/domain/safety';

describe('safety classification', () => {
  it('classifies as risk when projected exhaustion happens before reset', () => {
    expect(
      classifySafetyStatus({
        estimatedExhaustionDate: '2026-04-23',
        resetDate: '2026-04-30',
        currentPacePerDay: 4,
        safeDailyBudgetAllDays: 3
      })
    ).toBe('risk');
  });

  it('classifies as risk when pace is over safe daily budget', () => {
    expect(
      classifySafetyStatus({
        estimatedExhaustionDate: '2026-05-01',
        resetDate: '2026-04-30',
        currentPacePerDay: 3.2,
        safeDailyBudgetAllDays: 3
      })
    ).toBe('risk');
  });

  it('classifies as attention when pace is near threshold', () => {
    expect(
      classifySafetyStatus({
        estimatedExhaustionDate: '2026-04-30',
        resetDate: '2026-04-30',
        currentPacePerDay: 2.5,
        safeDailyBudgetAllDays: 3
      })
    ).toBe('attention');
  });

  it('classifies as safe when pace is comfortably below threshold', () => {
    expect(
      classifySafetyStatus({
        estimatedExhaustionDate: null,
        resetDate: '2026-04-30',
        currentPacePerDay: 1.6,
        safeDailyBudgetAllDays: 3
      })
    ).toBe('safe');
  });
});
