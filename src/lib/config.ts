export const siteConfig = {
  streamerName: process.env.STREAMER_NAME || 'Your Name',
  twitchUsername: process.env.TWITCH_USERNAME || 'yourchannel',
  siteName: process.env.SITE_NAME || 'Schedule',
  siteDescription:
    process.env.SITE_DESCRIPTION || 'A developer streaming log — past, current, and upcoming streams.',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  githubUrl: process.env.GITHUB_URL || '',
  youtubeUrl: process.env.YOUTUBE_URL || '',
  // Optional second timezone shown alongside the streamer's home timezone (e.g. for an international audience).
  secondaryTimezone: process.env.SECONDARY_TIMEZONE || 'Europe/Paris',
} as const;

export const twitchChannelUrl = `https://twitch.tv/${siteConfig.twitchUsername}`;
