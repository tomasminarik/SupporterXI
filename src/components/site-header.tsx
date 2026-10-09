import { Logo } from './brand';

// The share action is shown as designed but stays disabled until PNG export is built.
export default function SiteHeader({ share = true }: { share?: boolean }) {
  return <header className="sx-header">
    <Logo />
    {share && <>
      <button type="button" className="sx-share" disabled aria-describedby="share-note">Share your XI</button>
      <span id="share-note" className="sr-only">Image sharing is not available yet.</span>
    </>}
  </header>;
}
