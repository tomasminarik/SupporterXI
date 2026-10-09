import { Logo } from './brand';
import ShareButton from '../share/share-button';

// The share action needs the builder's XI; pages without a builder leave it out.
export default function SiteHeader({ share = true }: { share?: boolean }) {
  return <header className="sx-header">
    <Logo />
    {share && <ShareButton />}
  </header>;
}
