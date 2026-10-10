import { describe, expect, it } from 'vitest';
import type { CaptureResult } from 'posthog-js';
import { allow, events, options, shouldTrack, startAnalytics, track } from '../../src/analytics/analytics';

const sent = (event: string, properties: Record<string, unknown> = {}) => ({ event, properties, uuid: 'u' }) as unknown as CaptureResult;

describe('usage tracking is cookieless and never carries a lineup (user decision, 10 October 2026)', () => {
  it('sends only the listed events', () => {
    expect(Object.keys(events).sort()).toEqual(['contact_clicked', 'lineup_completed', 'lineup_started', 'not_found_seen', 'share_failed', 'share_image_saved', 'share_opened']);
    expect(allow(sent('$pageview'))?.event).toBe('$pageview');
    expect(allow(sent('$autocapture'))).toBeNull();
    expect(allow(sent('player_picked', { player: 'p-07' }))).toBeNull();
  });
  it('strips anything that is not a listed property, so lineup content cannot ride along', () => {
    const result = allow(sent('share_image_saved', { fixture: 'f-1', size: 'square', method: 'download', formation: '4-3-3', players: ['p-01'], roles: 3, $current_url: 'https://supporterxi.com/', site: 'supporterxi' }));
    expect(result?.properties).toEqual({ fixture: 'f-1', size: 'square', method: 'download', $current_url: 'https://supporterxi.com/', site: 'supporterxi' });
    expect(allow(sent('lineup_completed', { formation: '4-4-2' }))?.properties).toEqual({});
    for (const allowed of Object.values(events)) for (const key of allowed) expect(key).not.toMatch(/player|formation|role|lineup|name|number/i);
  });
  it('stores nothing in the browser and records no people, clicks, sessions or surveys', () => {
    expect(options).toMatchObject({ cookieless_mode: 'always', persistence: 'memory', person_profiles: 'never', autocapture: false, disable_session_recording: true, disable_surveys: true, capture_heatmaps: false, advanced_disable_flags: true });
  });
  it('runs only where a key is configured, and never on the backoffice or development pages', () => {
    expect(shouldTrack(undefined, '/')).toBe(false);
    expect(shouldTrack('', '/')).toBe(false);
    expect(shouldTrack('phc_x', '/')).toBe(true);
    expect(shouldTrack('phc_x', '/gameplan')).toBe(true);
    for (const path of ['/gaffer', '/gaffer/x', '/dev/workbench', '/api/featured-fixture']) expect(shouldTrack('phc_x', path)).toBe(false);
  });
  it('does nothing when tracking is off', () => {
    startAnalytics(undefined);
    expect(() => track('lineup_started')).not.toThrow();
  });
});
