// The public address (printed on share images) and when search engines may index the site.
export const publicHost = 'supporterxi.com';
export const publicOrigin = `https://${publicHost}`;

/** Indexing starts by itself once the domain is connected (user decision, 9 October 2026): only a
    production deployment whose production domain is the public address asks to be indexed. Vercel sets
    VERCEL_PROJECT_PRODUCTION_URL at build time, so the first deployment after the domain is connected
    switches it on; previews, local builds and the vercel.app address stay out of search results. */
export function isIndexable(env: Record<string, string | undefined> = process.env): boolean {
  const domain = env.VERCEL_PROJECT_PRODUCTION_URL?.toLowerCase();
  return env.VERCEL_ENV === 'production' && (domain === publicHost || domain === `www.${publicHost}`);
}
