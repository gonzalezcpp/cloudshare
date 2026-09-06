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
    const { guessGpuFamily } = await import('@/lib/gpuMap');
    const gpuRaw = str(body.gpu)?.slice(0, 300) || null;
    const data = {
      os: str(body.os),
      osVersion: str(body.osVersion),
      arch: str(body.arch),
      browser: str(body.browser),
      cpuCores: num(body.cpuCores),
      ramGb: num(body.ramGb),
      gpu: gpuRaw,
      gpuFamily: gpuRaw ? guessGpuFamily(gpuRaw) : null,
      webglVendor: str(body.webglVendor),
      canvasHash: str(body.canvasHash),
      pixelRatio: num(body.pixelRatio),
      touch: bool(body.touch),
      darkMode: bool(body.darkMode),
      netType: str(body.netType),
      saveData: bool(body.saveData),
      screen: str(body.screen),
      timezone: str(body.timezone),
      language: str(body.language),
      userAgent: str(body.userAgent)?.slice(0, 500) || null,
    };

    const latest = await prisma.deviceInfo.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    const isKnownDevice =
      !!latest &&
      latest.os === data.os &&
      latest.osVersion === data.osVersion &&
      latest.browser === data.browser &&
      latest.gpu === data.gpu &&
      latest.screen === data.screen &&
      latest.canvasHash === data.canvasHash &&
      latest.darkMode === data.darkMode &&
      latest.userAgent === data.userAgent;

    if (!isKnownDevice) {
      await prisma.deviceInfo.create({
        data: { userId: session.user.id, ...data },
      });
    }

    const { sendDiscordAlert } = await import('@/lib/discord');
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { username: true, email: true },
    }).catch(() => null);
    const fmt = (v: string | number | boolean | null | undefined) =>
      v === null || v === undefined || v === '' ? '—' : String(v);
    await sendDiscordAlert({
      title: isKnownDevice ? '💻 Device info' : '💻 New device',
      color: 0x0ea5e9,
      fields: [
        { name: 'User', value: user ? `${user.username}\n${user.email}` : session.user.id },
        { name: 'OS', value: [data.os, data.osVersion].filter(Boolean).join(' ') || '—' },
        { name: 'Browser', value: fmt(data.browser) },
        { name: 'CPU', value: data.cpuCores ? `${data.cpuCores} cores${data.arch ? ` (${data.arch})` : ''}` : '—' },
        { name: 'RAM', value: data.ramGb ? `~${data.ramGb} GB` : '—' },
        { name: 'GPU', value: fmt(data.gpuFamily || data.gpu) },
        { name: 'Screen', value: fmt(data.screen) },
        { name: 'Network', value: [data.netType, data.saveData ? 'saver on' : null].filter(Boolean).join(', ') || '—' },
        { name: 'Device TZ', value: fmt(data.timezone) },
      ],
    });

    return NextResponse.json({ success: true, deduped: isKnownDevice });
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

function bool(v: unknown): boolean | null {
  return typeof v === 'boolean' ? v : null;
}
