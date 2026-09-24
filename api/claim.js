// app/api/claim/route.js  (Next.js App Router example)
import { claimGrandPrize } from '@/lib/goldleaf';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { userId, userName } = await req.json();

  if (!userId || !userName) {
    return NextResponse.json({ error: 'Missing userId or userName' }, { status: 400 });
  }

  const result = await claimGrandPrize(userId, userName);
  return NextResponse.json(result, { status: result.success ? 200 : 409 });
}
