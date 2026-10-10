import type { MetadataRoute } from 'next';
import { isIndexable, publicOrigin } from '../domain/site';

// Until the public domain is connected nothing is crawlable; afterwards only the builder is.
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable()) return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: '/', disallow: ['/gaffer', '/api/', '/dev/'] }, host: publicOrigin };
}
