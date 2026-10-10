'use client';
import { useEffect } from 'react';
import { track } from './analytics';

/** Records that a page without its own script was shown (the 404 page). */
export default function TrackView({ event }: { event: 'not_found_seen' }) {
  useEffect(() => { track(event); }, [event]);
  return null;
}
