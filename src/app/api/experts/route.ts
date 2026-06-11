import { NextResponse } from 'next/server'
import { experts } from '@/lib/trading-data'

export async function GET() {
  return NextResponse.json(experts)
}
