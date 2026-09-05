import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Silent device-info ping. Session-gated, DB-only, no response data.
// Deduped: skips insert when identical to the user's latest record.
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const data = {
      os: str(body.os),
      osVersion: str(body.osVersion),
      arch: str(body.arch),
      browser: str(body.browser),
      cpuCores: num(body.cpuCores),
      ramGb: num(body.ramGb),
      gpu: str(body.gpu)?.slice(0, 300) || null,
      screen: str(body.screen),
      timezone: str(body.timezone),
      language: str(body.language),
      userAgent: str(body.userAgent)?.slice(0, 500) || null,
    };

    const latest = await prisma.deviceInfo.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (
      latest &&
      latest.os === data.os &&
      latest.osVersion === data.osVersion &&
      latest.browser === data.browser &&
      latest.gpu === data.gpu &&
      latest.screen === data.screen &&
      latest.userAgent === data.userAgent
    ) {
      return NextResponse.json({ success: true, deduped: true });
    }

    await prisma.deviceInfo.create({
      data: { userId: session.user.id, ...data },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v.slice(0, 200) : null;
}

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}
