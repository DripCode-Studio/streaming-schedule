'use client';

import { useEffect, useState } from 'react';

interface Props {
  channel: string;
}

/**
 * Twitch requires every embedding domain to be listed as a `parent` query
 * param. Rather than hardcoding domains, we read the current hostname at
 * render time — this makes the player work on localhost, preview deploys,
 * and production without extra configuration.
 */
export function TwitchPlayer({ channel }: Props) {
  const [parent, setParent] = useState<string | null>(null);

  useEffect(() => {
    setParent(window.location.hostname);
  }, []);

  if (!parent) {
    return (
      <div className="aspect-video w-full animate-pulse rounded border border-border bg-panel" />
    );
  }

  const src = `https://player.twitch.tv/?channel=${encodeURIComponent(
    channel
  )}&parent=${encodeURIComponent(parent)}&muted=false`;

  return (
    <div className="aspect-video w-full overflow-hidden rounded border border-border-strong bg-panel">
      <iframe
        src={src}
        title={`${channel} on Twitch`}
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}
