// Low-level Twitch Helix API client.
// Never import this from client components — it uses TWITCH_CLIENT_SECRET.

interface AppToken {
  accessToken: string;
  expiresAt: number; // epoch ms
}

let cachedToken: AppToken | null = null;

async function getAppAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET environment variables.'
    );
  }

  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Twitch app token: ${res.status}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.accessToken;
}

async function helixFetch<T>(path: string): Promise<T> {
  const clientId = process.env.TWITCH_CLIENT_ID!;
  const token = await getAppAccessToken();

  const res = await fetch(`https://api.twitch.tv/helix${path}`, {
    headers: {
      'Client-Id': clientId,
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Twitch Helix request failed (${path}): ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export interface HelixStream {
  id: string;
  user_login: string;
  user_name: string;
  game_name: string;
  type: string; // "live" | ""
  title: string;
  viewer_count: number;
  started_at: string;
  thumbnail_url: string;
}

export interface HelixUser {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
}

export const twitchClient = {
  async getStreamByLogin(login: string): Promise<HelixStream | null> {
    const data = await helixFetch<{ data: HelixStream[] }>(
      `/streams?user_login=${encodeURIComponent(login)}`
    );
    return data.data[0] ?? null;
  },

  async getUserByLogin(login: string): Promise<HelixUser | null> {
    const data = await helixFetch<{ data: HelixUser[] }>(
      `/users?login=${encodeURIComponent(login)}`
    );
    return data.data[0] ?? null;
  },
};
