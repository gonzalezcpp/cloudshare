import prisma from './prisma';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 minutes
const MAX_ATTEMPTS = parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || '5', 10);

export function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count };
}

export async function logPinAttempt(
  shareLinkId: string,
  ipAddress: string,
  success: boolean
): Promise<void> {
  await prisma.pinAttempt.create({
    data: {
      shareLinkId,
      ipAddress,
      success,
    },
  });
}

export function getRateLimitKey(shareLinkId: string, ipAddress: string): string {
  return `pin_attempt:${shareLinkId}:${ipAddress}`;
}
