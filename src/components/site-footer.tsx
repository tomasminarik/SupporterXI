import Link from 'next/link';
import ContactEmail from './contact-email';
import { club } from '../design/club';

// The last line is always in view, on every page (user decision, 12 October 2026; docs/reviews/legal-review.md).
export default function SiteFooter() {
  return <footer className="sx-footer"><span>Supporter XI</span><ContactEmail /><Link className="sx-footer-link" href="/privacy">Privacy</Link><span>Unofficial. Not affiliated with or endorsed by {club.name}.</span></footer>;
}
