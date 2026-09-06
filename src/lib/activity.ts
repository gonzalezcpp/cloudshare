import { headers } from 'next/headers';
import prisma from './prisma';

// Unified activity log. Server-only, single cheap insert, never throws.
// NEVER log: file contents, plaintext PINs/OTPs/passwords, session tokens.

export type ActivityEvent =
  | 'signup'
  | 'login'
  | 'login_failed'
  | 'logout'
  | 'file_upload'
  | 'file_download'
  | 'file_rename'
  | 'file_move'
  | 'file_trash'
  | 'file_restore'
  | 'file_delete'
  | 'folder_created'
  | 'folder_trash'
  | 'folder_restore'
  | 'folder_delete'
  | 'share_created'
  | 'share_opened'
  | 'share_pin_failed'
  | 'share_blocked'
  | 'share_updated'
  | 'share_disabled'
  | 'share_deleted'
  | 'password_changed'
  | 'password_reset'
  | 'plan_changed';

function headerIp(): string | null {
  try {
    const h = headers();
    const forwarded = h.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return h.get('x-real-ip')?.trim() || h.get('x-vercel-forwarded-for')?.split(',')[0].trim() || null;
  } catch {
    return null;
  }
}

function headerUa(): string | null {
  try {
    return headers().get('user-agent')?.slice(0, 500) || null;
  } catch {
    return null;
  }
}

export async function logActivity(opts: {
  userId: string | null;
  eventType: ActivityEvent | string;
  resource?: string | null;
  resourceName?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    await prisma.userActivity.create({
      data: {
        userId: opts.userId,
        eventType: opts.eventType,
        resource: opts.resource || null,
        resourceName: opts.resourceName || null,
        ip: opts.ip ?? headerIp(),
        userAgent: opts.userAgent ?? headerUa(),
        metadata: opts.metadata ? JSON.parse(JSON.stringify(opts.metadata)) : undefined,
      },
    });
  } catch (e) {
    console.error('Activity log failed (non-fatal):', e);
  }
}
