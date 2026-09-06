'use client';

import { useEffect, useState } from 'react';
import { countdownParts } from '@/lib/time';

export function Countdown({ target }: { target: string }) {
  const targetDate = new Date(target);
  const [parts, setParts] = useState(() => countdownParts(targetDate));

  useEffect(() => {
    const id = setInterval(() => setParts(countdownParts(targetDate)), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  if (parts.isPast) return null;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <p className="font-mono text-lg text-accent" aria-live="off">
      <span aria-hidden>
        {pad(parts.hours)} : {pad(parts.minutes)} : {pad(parts.seconds)}
      </span>
      <span className="sr-only">
        {parts.hours} hours, {parts.minutes} minutes, {parts.seconds} seconds remaining
      </span>
    </p>
  );
}
