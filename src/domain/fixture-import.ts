import { z } from 'zod';
import { contentSchema, type Fixture, type SharedContent } from './content';

const providerMatchSchema = z.object({
  id: z.number().int().positive(),
  competition: z.object({ code: z.string(), name: z.string().trim().min(1) }),
  homeTeam: z.object({ id: z.number().int(), name: z.string().trim().min(1) }),
  awayTeam: z.object({ id: z.number().int(), name: z.string().trim().min(1) }),
  status: z.string(),
  utcDate: z.string().nullable(),
  matchday: z.number().int().positive().nullable().optional(),
  stage: z.string().nullable().optional(),
});
const providerResponseSchema = z.object({ matches: z.array(providerMatchSchema).max(500) });
const unitedId = 66;
const competitions = new Set(['PL', 'CL']);
const statuses = { SCHEDULED: 'scheduled', TIMED: 'scheduled', POSTPONED: 'postponed', CANCELLED: 'cancelled' } as const;
export type ImportReport = { received: number; eligible: number; added: number; updated: number; unchanged: number; ambiguous: string[]; skipped: number };

function possibleManualMatch(existing: Fixture, incoming: Fixture): boolean {
  if (existing.source.kind !== 'manual') return false;
  const a = existing.values; const b = incoming.values;
  if (a.venue !== b.venue || a.competition?.toLocaleLowerCase() !== b.competition?.toLocaleLowerCase()) return false;
  const sameOpponent = a.opponent.toLocaleLowerCase() === b.opponent.toLocaleLowerCase();
  if (a.kickoff.kind === 'unknown' || b.kickoff.kind === 'unknown') return sameOpponent;
  const gap = Math.abs(Date.parse(a.kickoff.at) - Date.parse(b.kickoff.at));
  return gap <= 36 * 3_600_000 || (sameOpponent && gap <= 3 * 86_400_000);
}

export function reconcileFixtures(current: SharedContent, input: unknown, newId: () => string): { content: SharedContent; report: ImportReport } {
  const { matches } = providerResponseSchema.parse(input);
  const next = structuredClone(current);
  const report: ImportReport = { received: matches.length, eligible: 0, added: 0, updated: 0, unchanged: 0, ambiguous: [], skipped: 0 };
  const seen = new Set<number>();
  for (const match of matches) {
    if (seen.has(match.id)) throw new Error(`Duplicate provider match ${match.id}`);
    seen.add(match.id);
    const unitedHome = match.homeTeam.id === unitedId;
    const unitedAway = match.awayTeam.id === unitedId;
    if (!competitions.has(match.competition.code) || unitedHome === unitedAway || !(match.status in statuses)) { report.skipped++; continue; }
    const status = statuses[match.status as keyof typeof statuses];
    const kickoff = match.utcDate === null ? { kind: 'unknown' as const } :
      Number.isFinite(Date.parse(match.utcDate)) && /(?:Z|[+-]\d\d:\d\d)$/.test(match.utcDate) ? { kind: 'confirmed' as const, at: match.utcDate } : null;
    if (!kickoff) throw new Error(`Invalid kickoff for provider match ${match.id}`);
    report.eligible++;
    const providerId = String(match.id);
    const values = {
      opponent: unitedHome ? match.awayTeam.name : match.homeTeam.name,
      venue: unitedHome ? 'home' as const : 'away' as const,
      competition: match.competition.name,
      round: match.matchday ? `Matchday ${match.matchday}` : match.stage ? match.stage.replaceAll('_', ' ') : null,
      status, kickoff,
    };
    const existing = next.fixtures.find((fixture) => fixture.source.kind === 'football-data.org' && fixture.source.providerId === providerId);
    if (existing) {
      if (JSON.stringify(existing.values) === JSON.stringify(values)) report.unchanged++;
      else { existing.values = values; report.updated++; }
    } else {
      const incoming: Fixture = { id: newId(), source: { kind: 'football-data.org', providerId }, values, overrides: {} };
      if (next.fixtures.some((fixture) => possibleManualMatch(fixture, incoming))) report.ambiguous.push(providerId);
      else { next.fixtures.push(incoming); report.added++; }
    }
  }
  // Imports never remove absent matches, manual fixtures, players or availability.
  return { content: contentSchema.parse(next), report };
}
