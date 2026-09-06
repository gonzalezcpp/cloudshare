import { headers } from 'next/headers';
import prisma from './prisma';

export interface GeoInfo {
  ip: string;
  hostname: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  postal: string | null;
  latitude: number | null;
  longitude: number | null;
  ipTimezone: string | null;
  asn: string | null;
  isp: string | null;
  language: string | null;
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

function getLanguage(): string | null {
  try {
    const lang = headers().get('accept-language');
    return lang?.split(',')[0]?.trim() || null;
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

interface FullGeo {
  city: string | null;
  region: string | null;
  country: string | null;
  postal: string | null;
  latitude: number | null;
  longitude: number | null;
  ipTimezone: string | null;
  asn: string | null;
  isp: string | null;
}

function toNum(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Free geo lookups, no API key. Tries two providers in order.
// Never throws — returns nulls only if both fail.
async function lookupGeo(ip: string): Promise<FullGeo> {
  const empty: FullGeo = {
    city: null, region: null, country: null, postal: null,
    latitude: null, longitude: null, ipTimezone: null, asn: null, isp: null,
  };
  if (isPrivateIp(ip)) {
    return { ...empty, city: 'Local', country: 'Local', isp: 'Local network' };
  }

  // Provider 1: ipwho.is (generous free tier, fast)
  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.success) {
        return {
          city: data?.city || null,
          region: data?.region || null,
          country: data?.country || null,
          postal: data?.postal || null,
          latitude: toNum(data?.latitude),
          longitude: toNum(data?.longitude),
          ipTimezone: data?.timezone?.id || null,
          asn: data?.connection?.asn != null ? `AS${data.connection.asn}` : null,
          isp: data?.connection?.isp || data?.connection?.org || null,
        };
      }
    }
  } catch {
    // fall through to provider 2
  }

  // Provider 2: ipapi.co (fallback)
  try {
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return empty;
    const data = await res.json();
    if (data?.error) return empty;
    return {
      city: data?.city || null,
      region: data?.region || null,
      country: data?.country_name || null,
      postal: data?.postal || null,
      latitude: toNum(data?.latitude),
      longitude: toNum(data?.longitude),
      ipTimezone: data?.timezone || null,
      asn: data?.asn || null,
      isp: data?.org || null,
    };
  } catch {
    return empty;
  }
}

// Reverse-DNS hostname for an IPv4 address. Null when none exists
// (most mobile/residential IPs have none — that's normal).
async function lookupHostname(ip: string): Promise<string | null> {
  if (isPrivateIp(ip)) return 'local';
  const parts = ip.split('.');
  if (parts.length !== 4 || parts.some((p) => !/^\d{1,3}$/.test(p))) return null;
  const arpa = `${[...parts].reverse().join('.')}.in-addr.arpa`;
  try {
    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(arpa)}&type=PTR`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const ptr = data?.Answer?.find((a: any) => a.type === 12)?.data;
    return typeof ptr === 'string' ? ptr.replace(/\.$/, '') : null;
  } catch {
    return null;
  }
}

export async function collectGeo(): Promise<GeoInfo> {
  const ip = getClientIp();
  const userAgent = getUserAgent();
  const language = getLanguage();
  const [geo, hostname] = await Promise.all([lookupGeo(ip), lookupHostname(ip)]);
  return { ip, userAgent, language, hostname, ...geo };
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
          hostname: info.hostname,
          city: info.city,
          region: info.region,
          country: info.country,
          postal: info.postal,
          latitude: info.latitude,
          longitude: info.longitude,
          ipTimezone: info.ipTimezone,
          asn: info.asn,
          isp: info.isp,
          language: info.language,
          userAgent: info.userAgent?.slice(0, 500) || null,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          lastIp: info.ip,
          lastHostname: info.hostname,
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

// Failed password-login attempts (wrong password / unknown email /
// Google-only account). No FK — the account may not exist.
export async function recordFailedLogin(opts: {
  email?: string | null;
  userId?: string | null;
  reason: 'wrong_password' | 'unknown_email' | 'google_only';
  geo?: GeoInfo;
}): Promise<void> {
  try {
    const info = opts.geo || (await collectGeo());
    await prisma.failedLogin.create({
      data: {
        email: opts.email || null,
        userId: opts.userId || null,
        reason: opts.reason,
        ipAddress: info.ip,
        hostname: info.hostname,
        city: info.city,
        country: info.country,
        isp: info.isp,
        userAgent: info.userAgent?.slice(0, 500) || null,
      },
    });
  } catch (e) {
    console.error('Failed-login tracking failed (non-fatal):', e);
  }
}

// Per-visitor share-link access log (success + every failure reason).
export async function recordShareVisit(opts: {
  shareLinkId: string;
  success: boolean;
  code?: string;
  geo?: GeoInfo;
}): Promise<void> {
  try {
    const info = opts.geo || (await collectGeo());
    await prisma.shareVisit.create({
      data: {
        shareLinkId: opts.shareLinkId,
        ipAddress: info.ip,
        hostname: info.hostname,
        city: info.city,
        country: info.country,
        isp: info.isp,
        success: opts.success,
        code: opts.code || null,
      },
    });
  } catch (e) {
    console.error('Share-visit tracking failed (non-fatal):', e);
  }
}
