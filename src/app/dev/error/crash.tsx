'use client';

export default function Crash(): never {
  throw new Error('Deliberate failure, to show the error page');
}
