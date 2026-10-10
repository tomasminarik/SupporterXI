import type { MetadataRoute } from 'next';
import { isIndexable, publicOrigin } from '../domain/site';

// Until the public domain is connected nothing is crawlable; afterwards only the builder is. The backoffice and
// the design system page are not listed here: they answer with a noindex header (next.config.ts), which a
// crawler can only read if it is allowed to fetch them.
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable()) return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/dev/', '/sxi/'] }, sitemap: `${publicOrigin}/sitemap.xml`, host: publicOrigin };
}
