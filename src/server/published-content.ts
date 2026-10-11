import 'server-only';
import { createHash } from 'node:crypto';
import rawContent from '../../content/shared.json';
import { contentSchema } from '../domain/content';
import { featuredResponse } from '../domain/featured-fixture';

// Bundled accepted content: no GitHub or provider call on a supporter request.
const content = contentSchema.parse(rawContent);
// Hashed as parsed, like the backoffice's digest (src/server/admin/github.ts), so the two agree however the file is laid out.
const revision = createHash('sha256').update(JSON.stringify(content)).digest('hex');
export function readFeaturedFixture() {
  return featuredResponse(content, revision, Date.now());
}
