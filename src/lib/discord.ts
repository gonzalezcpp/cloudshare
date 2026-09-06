// Posts admin alerts to a Discord channel webhook.
// Server-only, fire-and-forget, never throws. No-op when not configured.

interface DiscordField {
  name: string;
  value: string;
  inline?: boolean;
}

export async function sendDiscordAlert(opts: {
  title: string;
  color: number;
  fields: DiscordField[];
}): Promise<void> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'CloudShare',
        embeds: [
          {
            title: opts.title,
            color: opts.color,
            fields: opts.fields.map((f) => ({
              name: f.name,
              value: f.value.slice(0, 1024) || '—',
              inline: f.inline ?? true,
            })),
            timestamp: new Date().toISOString(),
          },
        ],
      }),
      signal: AbortSignal.timeout(5000),
    }).catch(() => {});
  } catch {
    // silent — alerts must never break the app
  }
}

export function locLine(info: {
  city?: string | null;
  region?: string | null;
  country?: string | null;
}): string {
  return (
    [info.city, info.region, info.country].filter(Boolean).join(', ') || 'Unknown'
  );
}
