import { projectExhaustionDate, projectionStrategies } from '@/domain/projection';

describe('quota exhaustion projection', () => {
  it('projects with linear strategy using fixed daily pace', () => {
    expect(
      projectExhaustionDate(
        {
          measurementDate: '2026-04-08',
          resetDate: '2026-04-30',
          remainingPercent: 60,
          currentPacePerDay: 5
        },
        projectionStrategies.linear
      )
    ).toBe('2026-04-20');
  });

  it('projects with seasonal strategy (workday/weekend pattern)', () => {
    expect(
      projectExhaustionDate(
        {
          measurementDate: '2026-04-10',
          resetDate: '2026-04-30',
          remainingPercent: 15,
          currentPacePerDay: 5
        },
        projectionStrategies['seasonal-week-pattern']
      )
    ).toBe('2026-04-14');
  });

  it('returns null when there is no current pace', () => {
    expect(
      projectExhaustionDate(
        {
          measurementDate: '2026-04-08',
          resetDate: '2026-04-30',
          remainingPercent: 60,
          currentPacePerDay: 0
        },
        projectionStrategies.linear
      )
    ).toBeNull();
  });

  it('returns measurement date when quota is already exhausted', () => {
    expect(
      projectExhaustionDate(
        {
          measurementDate: '2026-04-08',
          resetDate: '2026-04-30',
          remainingPercent: 0,
          currentPacePerDay: 3
        },
        projectionStrategies.linear
      )
    ).toBe('2026-04-08');
  });
});
