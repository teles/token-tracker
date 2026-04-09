import {
  getNextPlanningState,
  interpretFutureDayState,
  summarizePlanningStates
} from '@/domain/planning';

describe('planning state interpretation', () => {
  it('toggles planning states between on and off', () => {
    expect(getNextPlanningState('off')).toBe('on');
    expect(getNextPlanningState('on')).toBe('off');
  });

  it('interprets future day states correctly', () => {
    expect(interpretFutureDayState('on')).toEqual({
      countsAsUsage: true,
      countsAsOff: false,
      intensityWeight: 1
    });

    expect(interpretFutureDayState('off')).toEqual({
      countsAsUsage: false,
      countsAsOff: true,
      intensityWeight: 0
    });
  });

  it('summarizes future planning states for diagnostics', () => {
    const summary = summarizePlanningStates(
      {
        '2026-04-11': 'on',
        '2026-04-12': 'off',
        '2026-04-13': 'on'
      },
      ['2026-04-11', '2026-04-12', '2026-04-13', '2026-04-14']
    );

    expect(summary).toEqual({
      plannedUsageDays: 2,
      plannedOffDays: 2,
      totalFutureDays: 4
    });
  });
});
