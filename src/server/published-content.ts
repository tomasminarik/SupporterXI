import 'server-only';
import { createHash } from 'node:crypto';
import rawContent from '../../content/shared.json';
import { contentSchema } from '../domain/content';
import { featuredResponse } from '../domain/featured-fixture';

// Bundled accepted content: no GitHub or provider call on a supporter request.
const content = contentSchema.parse(rawContent);
const revision = createHash('sha256').update(JSON.stringify(rawContent)).digest('hex');
export function readFeaturedFixture() {
  return featuredResponse(content, revision, Date.now());
}
