import type { MetadataRoute } from 'next';
import { isIndexable, publicOrigin } from '../domain/site';

// The builder is the only page offered to search engines, and only on the public domain.
export default function sitemap(): MetadataRoute.Sitemap {
  return isIndexable() ? [{ url: publicOrigin, changeFrequency: 'daily', priority: 1 }] : [];
}
