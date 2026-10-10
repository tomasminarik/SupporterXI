'use client';
import { useSyncExternalStore } from 'react';
import { publicHost } from '../domain/site';

const subscribe = () => () => {};

/** The contact address, kept out of the page's source so address harvesters that read raw pages do not find
    it (user request, 10 October 2026). It is put together in the browser; without scripts it reads as words. */
export default function ContactEmail() {
  const inBrowser = useSyncExternalStore(subscribe, () => true, () => false);
  if (!inBrowser) return <span>{`dugout at ${publicHost}`}</span>;
  const address = ['dugout', publicHost].join(String.fromCharCode(64));
  return <a className="sx-footer-link" href={`mailto:${address}`}>{address}</a>;
}
