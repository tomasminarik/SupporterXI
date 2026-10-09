'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Draft } from '../domain/draft';

// The share button lives in the page header, outside the builder. The builder publishes its
// working XI here; nothing is stored and nothing leaves the page.
type ShareSource = Pick<Draft, 'fixture' | 'players' | 'lineup'>;
const Context = createContext<{ source: ShareSource | null; publish: (source: ShareSource | null) => void } | null>(null);

export function ShareProvider({ children }: { children: ReactNode }) {
  const [source, publish] = useState<ShareSource | null>(null);
  return <Context value={{ source, publish }}>{children}</Context>;
}
export const useShareSource = () => useContext(Context)?.source ?? null;
/** Called by the builder with its open XI, or null while there is none to share. */
export function usePublishShareSource(source: ShareSource | null) {
  const publish = useContext(Context)?.publish;
  useEffect(() => { publish?.(source); }, [publish, source]);
  // Withdrawn only when the builder itself goes away, so an open dialog survives a background refresh.
  useEffect(() => () => publish?.(null), [publish]);
}
