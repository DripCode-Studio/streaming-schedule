import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { siteConfig, twitchChannelUrl } from '@/lib/config';

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: `${siteConfig.siteName} — ${siteConfig.streamerName}`,
    template: `%s — ${siteConfig.siteName}`,
  },
  description: siteConfig.siteDescription,
  openGraph: {
    title: `${siteConfig.siteName} — ${siteConfig.streamerName}`,
    description: siteConfig.siteDescription,
    url: siteConfig.siteUrl,
    siteName: siteConfig.siteName,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.siteName} — ${siteConfig.streamerName}`,
    description: siteConfig.siteDescription,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body className="flex min-h-screen flex-col bg-bg font-sans text-ink antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-accent focus:px-3 focus:py-2 focus:text-bg"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-content items-center justify-between px-6 py-5">
        <a href="/" className="text-sm font-medium tracking-tight text-ink hover:text-accent">
          {siteConfig.streamerName}
        </a>
        <a
          href={twitchChannelUrl}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-xs text-muted hover:text-accent"
        >
          twitch.tv/{siteConfig.twitchUsername}
        </a>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-content flex-col gap-3 px-6 py-8 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
        <p>Built by {siteConfig.streamerName}</p>
        <nav className="flex gap-4">
          <a href={twitchChannelUrl} target="_blank" rel="noreferrer" className="hover:text-accent">
            Twitch
          </a>
          {siteConfig.githubUrl && (
            <a href={siteConfig.githubUrl} target="_blank" rel="noreferrer" className="hover:text-accent">
              GitHub
            </a>
          )}
          {siteConfig.youtubeUrl && (
            <a href={siteConfig.youtubeUrl} target="_blank" rel="noreferrer" className="hover:text-accent">
              YouTube
            </a>
          )}
        </nav>
        <p>&copy; {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
