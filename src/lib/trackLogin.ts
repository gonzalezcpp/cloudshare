import { headers } from 'next/headers';
import prisma from './prisma';

export interface GeoInfo {
  ip: string;
  city: string | null;
  country: string | null;
  isp: string | null;
  userAgent: string | null;
}

// Server-only: reads the real client IP behind Vercel/proxies.
export function getClientIp(): string {
  try {
    const h = headers();
    const forwarded = h.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return h.get('x-real-ip')?.trim() || 'unknown';
  } catch {
    return 'unknown';
  }
}

export function getUserAgent(): string | null {
  try {
    return headers().get('user-agent');
  } catch {
    return null;
  }
}

function isPrivateIp(ip: string): boolean {
  return (
    ip === 'unknown' ||
    ip === '::1' ||
    ip.startsWith('127.') ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    ip.startsWith('fc') ||
    ip.startsWith('fd')
  );
}

// Free geo lookup, no API key. Never throws — returns nulls on failure.
async function lookupGeo(ip: string): Promise<{ city: string | null; country: string | null; isp: string | null }> {
  const empty = { city: null, country: null, isp: null };
  if (isPrivateIp(ip)) {
    return { city: 'Local', country: 'Local', isp: 'Local network' };
  }
  try {
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return empty;
    const data = await res.json();
    if (data?.error) return empty;
    return {
      city: data?.city || null,
      country: data?.country_name || null,
      isp: data?.org || null,
    };
  } catch {
    return empty;
  }
}

export async function collectGeo(): Promise<GeoInfo> {
  const ip = getClientIp();
  const userAgent = getUserAgent();
  const geo = await lookupGeo(ip);
  return { ip, userAgent, ...geo };
}

// Records a login/signup event + updates the user's last-known location.
// Silently ignored on failure so auth NEVER breaks because of tracking.
export async function recordLogin(
  userId: string,
  event: 'signup' | 'login' = 'login',
  geo?: GeoInfo
): Promise<void> {
  try {
    const info = geo || (await collectGeo());
    await prisma.$transaction([
      prisma.loginHistory.create({
        data: {
          userId,
          event,
          ipAddress: info.ip,
          city: info.city,
          country: info.country,
          isp: info.isp,
          userAgent: info.userAgent?.slice(0, 500) || null,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          lastIp: info.ip,
          lastCity: info.city,
          lastCountry: info.country,
          lastIsp: info.isp,
          lastLoginAt: new Date(),
        },
      }),
    ]);
  } catch (e) {
    console.error('Login tracking failed (non-fatal):', e);
  }
}
