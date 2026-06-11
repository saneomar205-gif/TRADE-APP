import { NextResponse } from 'next/server'
import { generateBatch } from '@/lib/trading-data'

// Cache signals for 5 seconds to avoid generating new ones on every request
let cachedSignals: any[] | null = null
let cacheTime = 0
const CACHE_TTL = 5000 // 5 seconds

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const after = searchParams.get('after') // ISO timestamp to get signals after
  const assetType = searchParams.get('assetType')
  const direction = searchParams.get('direction')
  const expert = searchParams.get('expert')
  const status = searchParams.get('status')

  const now = Date.now()
  
  // Generate new batch or use cache
  if (!cachedSignals || now - cacheTime > CACHE_TTL) {
    // Add 1-3 new signals to existing cache to simulate real-time
    const newCount = cachedSignals ? Math.floor(Math.random() * 3) + 1 : 25
    const newSignals = generateBatch(newCount)
    
    if (cachedSignals) {
      cachedSignals = [...newSignals, ...cachedSignals].slice(0, 100)
    } else {
      cachedSignals = newSignals
    }
    cacheTime = now
  }

  let filtered = [...cachedSignals]

  // If 'after' parameter, only return signals newer than that timestamp
  if (after) {
    const afterTime = new Date(after).getTime()
    filtered = filtered.filter(s => new Date(s.timestamp).getTime() > afterTime)
  }

  // Apply filters
  if (assetType) filtered = filtered.filter(s => s.assetType === assetType)
  if (direction) filtered = filtered.filter(s => s.direction === direction)
  if (expert) filtered = filtered.filter(s => s.expertName === expert)
  if (status) filtered = filtered.filter(s => s.status === status)

  return NextResponse.json({
    signals: filtered.slice(0, 50),
    timestamp: new Date().toISOString(),
    count: filtered.length,
  })
}
