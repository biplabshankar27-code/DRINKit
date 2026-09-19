import { NextRequest, NextResponse } from 'next/server';
import { handleApi } from '@/lib/server/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ path?: string[] }> };

async function dispatch(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path } = await context.params;
  const segments = path ?? [];
  let body: Record<string, unknown> = {};
  if (['POST', 'PATCH', 'PUT'].includes(request.method)) {
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
  }
  const result = await handleApi(request.method, segments, {
    params: request.nextUrl.searchParams,
    body,
    auth: request.headers.get('authorization'),
  });
  return NextResponse.json(result.body as Record<string, unknown>, { status: result.status });
}

export async function GET(request: NextRequest, context: RouteContext) {
  return dispatch(request, context);
}
export async function POST(request: NextRequest, context: RouteContext) {
  return dispatch(request, context);
}
export async function PATCH(request: NextRequest, context: RouteContext) {
  return dispatch(request, context);
}
export async function DELETE(request: NextRequest, context: RouteContext) {
  return dispatch(request, context);
}
