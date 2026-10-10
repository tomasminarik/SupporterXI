// Cookieless usage tracking with PostHog (user decision, 10 October 2026; docs/implementation/analytics.md).
// It counts visits and a handful of actions. It never receives a supporter's lineup: no players, no
// formation, no roles. Nothing is stored in the visitor's browser, so there is no consent banner.
import type { CaptureResult, PostHog, PostHogConfig } from 'posthog-js';

/** Every event the site may send besides PostHog's own page events, with the only properties allowed. */
export const events = {
  lineup_started: [],
  lineup_completed: [],
  share_opened: ['fixture'],
  share_image_saved: ['fixture', 'size', 'method'],
  share_failed: ['fixture', 'size'],
  contact_clicked: [],
  not_found_seen: [],
} as const satisfies Record<string, readonly string[]>;
export type EventName = keyof typeof events;
type Size = 'square' | 'portrait' | 'landscape';
type EventProps = {
  lineup_started: undefined; lineup_completed: undefined; contact_clicked: undefined; not_found_seen: undefined;
  share_opened: { fixture: string };
  share_image_saved: { fixture: string; size: Size; method: 'download' | 'share' };
  share_failed: { fixture: string; size: Size };
};

/** Requests go to this path on our own domain and are passed on to PostHog's EU servers (next.config.ts). */
export const proxyPath = '/sxi';
export const posthogHosts = { ingest: 'https://eu.i.posthog.com', assets: 'https://eu-assets.i.posthog.com', app: 'https://eu.posthog.com' };
const automatic = ['$pageview', '$pageleave', '$web_vitals'];

/** The last check before anything leaves the browser: an event that is not on the list is dropped, and a
    listed event keeps only its listed properties (PostHog's own `$` properties describe the page and device). */
export function allow(event: CaptureResult | null): CaptureResult | null {
  if (!event) return null;
  if (automatic.includes(event.event)) return event;
  const allowed: readonly string[] | undefined = (events as Record<string, readonly string[]>)[event.event];
  if (!allowed) return null;
  const properties = Object.fromEntries(Object.entries(event.properties ?? {}).filter(([key]) => key.startsWith('$') || key === 'token' || key === 'distinct_id' || key === 'site' || allowed.includes(key)));
  return { ...event, properties };
}

export const options: Partial<PostHogConfig> = {
  api_host: proxyPath,
  ui_host: posthogHosts.app,
  cookieless_mode: 'always',
  persistence: 'memory',
  person_profiles: 'never',
  autocapture: false,
  capture_pageview: true,
  capture_pageleave: true,
  capture_performance: { web_vitals: true, network_timing: false },
  capture_heatmaps: false,
  capture_dead_clicks: false,
  capture_exceptions: false,
  disable_session_recording: true,
  disable_surveys: true,
  advanced_disable_flags: true,
  before_send: allow,
};

/** Tracking runs only where a key is configured (Vercel Production) and never on the backoffice or the
    development pages. */
export function shouldTrack(key: string | undefined, pathname: string): key is string {
  return Boolean(key) && !/^\/(gaffer|dev|api)(\/|$)/.test(pathname);
}

let client: Promise<PostHog> | null = null;

export function startAnalytics(key = process.env.NEXT_PUBLIC_POSTHOG_KEY): void {
  if (client || typeof window === 'undefined' || !shouldTrack(key, window.location.pathname)) return;
  // Loaded after the page, so the builder never waits for it.
  client = import('posthog-js').then(({ default: posthog }) => {
    posthog.init(key, options);
    posthog.register({ site: 'supporterxi' });
    return posthog;
  });
  client.catch(() => { client = null; });
}

/** Records one of the listed events. Does nothing where tracking is off. */
export function track<E extends EventName>(event: E, ...props: EventProps[E] extends undefined ? [] : [EventProps[E]]): void {
  void client?.then((posthog) => posthog.capture(event, props[0])).catch(() => {});
}
