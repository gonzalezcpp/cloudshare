import { NextResponse } from 'next/server';

export async function GET() {
  const checks: Record<string, string> = {};

  checks.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET ? `set (${process.env.NEXTAUTH_SECRET.length} chars)` : 'MISSING';
  checks.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'MISSING';
  checks.DATABASE_URL = process.env.DATABASE_URL ? 'set' : 'MISSING';
  checks.NODE_ENV = process.env.NODE_ENV || 'unset';

  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    checks.DATABASE = 'connected';
    await prisma.$disconnect();
  } catch (e: any) {
    checks.DATABASE = `FAILED: ${e.message}`;
  }

  return NextResponse.json(checks, {
    status: Object.values(checks).some(v => v.includes('MISSING') || v.includes('FAILED')) ? 500 : 200,
  });
}
