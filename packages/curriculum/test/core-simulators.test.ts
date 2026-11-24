import { describe, expect, it } from 'vitest';
import { CORE_SIMULATORS, SIM_ACHIEVEMENT_BADGES, SIM_DIFFICULTIES, coreSimById, coreSimMissionLabId, coreSimulatorsFor, summariseCoreSimProgress, validateCoreSimulatorCatalogue } from '../src';

describe('Flagship CBSE Class XI & XII Simulator Catalogue (A–J)', () => {
  it('defines all 10 core experiences A–J with valid CBSE 2026–27 units, clauses, and 4 progressive missions each', () => {
    expect(CORE_SIMULATORS.map(s => s.code)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']);
    expect(validateCoreSimulatorCatalogue()).toEqual([]);
    for (const sim of CORE_SIMULATORS) {
      expect(coreSimById(sim.id)).toBe(sim);
      expect(sim.missions.map(m => m.tier)).toEqual(['BEGINNER', 'PRACTICE', 'CHALLENGE', 'MASTER']);
      expect(sim.keyTerms.length).toBeGreaterThanOrEqual(3);
      // Master tier enforces 0 hints; Beginner/Practice/Challenge follow progressive hint reduction
      expect(sim.missions[0]!.hints.length).toBeGreaterThanOrEqual(2);
      expect(sim.missions[3]!.hints.length).toBe(0);
    }
    expect(SIM_DIFFICULTIES.map(d => d.id)).toEqual(['BEGINNER', 'PRACTICE', 'CHALLENGE', 'MASTER']);
  });

  it('filters Class XI and Class XII simulators cleanly by Option I vs Option II syllabus route', () => {
    const xi = coreSimulatorsFor('XI');
    expect(xi.map(s => s.code)).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);

    const xiiOpt1 = coreSimulatorsFor('XII', 'OPTION_I_ANALYSIS');
    expect(xiiOpt1.map(s => s.code)).toEqual(['G', 'H', 'I']);

    const xiiOpt2 = coreSimulatorsFor('XII', 'OPTION_II_COMPUTERISED');
    expect(xiiOpt2.map(s => s.code)).toEqual(['G', 'H', 'J']);

    const xiiAll = coreSimulatorsFor('XII', 'OPTION_I_ANALYSIS', { showAllRoutes: true });
    expect(xiiAll.map(s => s.code)).toEqual(['G', 'H', 'I', 'J']);
  });

  it('computes mission completion and unlocks Class XI, Class XII, and Challenge Ace badges deterministically', () => {
    const seen = [
      { t: 1, lab: coreSimMissionLabId('equation-lab', 'BEGINNER'), tab: 'example' as const },
      { t: 2, lab: coreSimMissionLabId('journal-ledger-lab', 'CHALLENGE'), tab: 'example' as const },
      { t: 3, lab: coreSimMissionLabId('cashbook-brs-lab', 'MASTER'), tab: 'example' as const },
      { t: 4, lab: coreSimMissionLabId('partnership-lab', 'CHALLENGE'), tab: 'example' as const },
      { t: 5, lab: coreSimMissionLabId('company-lab', 'PRACTICE'), tab: 'example' as const },
      { t: 6, lab: coreSimMissionLabId('financial-analysis-lab', 'BEGINNER'), tab: 'example' as const },
    ];
    const summary = summariseCoreSimProgress(seen, 'OPTION_I_ANALYSIS');
    expect(summary.totalMissionsCompleted).toBe(6);
    expect(summary.totalMissionsAvailable).toBe(9 * 4); // 6 XI + 3 XII (Option I)
    const badgeIds = summary.earnedBadges.map(b => b.id);
    expect(badgeIds).toContain('sim-xi-process');
    expect(badgeIds).toContain('sim-xii-corporate');
    expect(badgeIds).toContain('sim-xii-specialist');
    expect(badgeIds).toContain('sim-challenge-ace'); // journal-ledger (CHALLENGE), cashbook-brs (MASTER), partnership (CHALLENGE)
    expect(badgeIds).not.toContain('sim-xi-auditor');
    expect(SIM_ACHIEVEMENT_BADGES.length).toBe(5);
  });
});
