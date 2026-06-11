import { NextResponse } from 'next/server'
import { generateBatch } from '@/lib/trading-data'

// Use same cache as signals endpoint
let cachedSignals: any[] | null = null
let cacheTime = 0
const CACHE_TTL = 5000

export async function GET() {
  const now = Date.now()
  
  if (!cachedSignals || now - cacheTime > CACHE_TTL) {
    cachedSignals = generateBatch(25)
    cacheTime = now
  }

  const closed = cachedSignals.filter(s => s.status !== 'active')
  const wins = closed.filter(s => s.status === 'hit_target')
  const totalPnl = closed.reduce((acc, s) => acc + (s.pnl || 0), 0)

  const stats = {
    totalSignals: cachedSignals.length,
    activeSignals: cachedSignals.filter(s => s.status === 'active').length,
    winRate: closed.length > 0 ? parseFloat((wins.length / closed.length * 100).toFixed(1)) : 0,
    totalPnl: parseFloat(totalPnl.toFixed(2)),
    avgConfidence: cachedSignals.length > 0
      ? parseFloat((cachedSignals.reduce((acc, s) => acc + s.confidence, 0) / cachedSignals.length).toFixed(1))
      : 0,
    byAsset: {
      crypto: cachedSignals.filter(s => s.assetType === 'crypto').length,
      forex: cachedSignals.filter(s => s.assetType === 'forex').length,
      stocks: cachedSignals.filter(s => s.assetType === 'stocks').length,
      commodities: cachedSignals.filter(s => s.assetType === 'commodities').length,
    }
  }

  return NextResponse.json(stats)
}
