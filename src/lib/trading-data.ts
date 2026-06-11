// Shared trading signal generator for API routes
// This replaces the WebSocket mini-service for Vercel deployment

export interface TradeSignal {
  id: string
  expertName: string
  expertAvatar: string
  expertRating: number
  assetType: 'crypto' | 'forex' | 'stocks' | 'commodities'
  symbol: string
  direction: 'LONG' | 'SHORT'
  entryPrice: number
  targetPrice: number
  stopLoss: number
  confidence: number
  timestamp: string
  analysis: string
  pnl?: number
  status: 'active' | 'hit_target' | 'hit_stop' | 'closed'
}

export interface Expert {
  name: string
  avatar: string
  rating: number
  specialty: string[]
  winRate: number
  totalTrades: number
}

export interface Stats {
  totalSignals: number
  activeSignals: number
  winRate: number
  totalPnl: number
  avgConfidence: number
  byAsset: {
    crypto: number
    forex: number
    stocks: number
    commodities: number
  }
}

const experts: Expert[] = [
  { name: 'Marcus Chen', avatar: 'MC', rating: 4.9, specialty: ['crypto', 'forex'], winRate: 78.5, totalTrades: 1247 },
  { name: 'Sophie Laurent', avatar: 'SL', rating: 4.8, specialty: ['crypto', 'stocks'], winRate: 76.2, totalTrades: 892 },
  { name: 'Alex Volkov', avatar: 'AV', rating: 4.7, specialty: ['forex', 'commodities'], winRate: 74.8, totalTrades: 1563 },
  { name: 'David Park', avatar: 'DP', rating: 4.9, specialty: ['stocks', 'crypto'], winRate: 81.3, totalTrades: 678 },
  { name: 'Emma Fischer', avatar: 'EF', rating: 4.6, specialty: ['commodities', 'forex'], winRate: 72.1, totalTrades: 1105 },
  { name: 'Raj Patel', avatar: 'RP', rating: 4.8, specialty: ['crypto', 'commodities'], winRate: 79.4, totalTrades: 934 },
  { name: 'Yuki Tanaka', avatar: 'YT', rating: 4.7, specialty: ['forex', 'stocks'], winRate: 75.6, totalTrades: 1456 },
  { name: 'Carlos Rivera', avatar: 'CR', rating: 4.5, specialty: ['stocks', 'commodities'], winRate: 70.8, totalTrades: 789 },
]

const symbols: Record<string, { symbol: string; priceRange: [number, number]; decimals: number }[]> = {
  crypto: [
    { symbol: 'BTC/USDT', priceRange: [67000, 73000], decimals: 2 },
    { symbol: 'ETH/USDT', priceRange: [3400, 3900], decimals: 2 },
    { symbol: 'SOL/USDT', priceRange: [140, 180], decimals: 2 },
    { symbol: 'BNB/USDT', priceRange: [580, 640], decimals: 2 },
    { symbol: 'XRP/USDT', priceRange: [0.5, 0.65], decimals: 4 },
    { symbol: 'ADA/USDT', priceRange: [0.4, 0.55], decimals: 4 },
    { symbol: 'DOGE/USDT', priceRange: [0.12, 0.18], decimals: 5 },
    { symbol: 'AVAX/USDT', priceRange: [32, 42], decimals: 2 },
    { symbol: 'DOT/USDT', priceRange: [6.5, 8.5], decimals: 2 },
    { symbol: 'LINK/USDT', priceRange: [14, 18], decimals: 2 },
  ],
  forex: [
    { symbol: 'EUR/USD', priceRange: [1.07, 1.10], decimals: 5 },
    { symbol: 'GBP/USD', priceRange: [1.26, 1.29], decimals: 5 },
    { symbol: 'USD/JPY', priceRange: [148, 155], decimals: 3 },
    { symbol: 'AUD/USD', priceRange: [0.64, 0.67], decimals: 5 },
    { symbol: 'USD/CAD', priceRange: [1.35, 1.38], decimals: 5 },
    { symbol: 'EUR/GBP', priceRange: [0.84, 0.87], decimals: 5 },
    { symbol: 'USD/CHF', priceRange: [0.87, 0.91], decimals: 5 },
    { symbol: 'NZD/USD', priceRange: [0.59, 0.62], decimals: 5 },
  ],
  stocks: [
    { symbol: 'AAPL', priceRange: [185, 200], decimals: 2 },
    { symbol: 'TSLA', priceRange: [170, 210], decimals: 2 },
    { symbol: 'NVDA', priceRange: [800, 950], decimals: 2 },
    { symbol: 'MSFT', priceRange: [410, 440], decimals: 2 },
    { symbol: 'AMZN', priceRange: [175, 195], decimals: 2 },
    { symbol: 'META', priceRange: [480, 530], decimals: 2 },
    { symbol: 'GOOGL', priceRange: [165, 185], decimals: 2 },
    { symbol: 'JPM', priceRange: [190, 210], decimals: 2 },
  ],
  commodities: [
    { symbol: 'GOLD', priceRange: [2300, 2450], decimals: 2 },
    { symbol: 'SILVER', priceRange: [28, 32], decimals: 2 },
    { symbol: 'OIL/WTI', priceRange: [75, 85], decimals: 2 },
    { symbol: 'OIL/BRENT', priceRange: [79, 90], decimals: 2 },
    { symbol: 'NATURAL GAS', priceRange: [2.2, 2.8], decimals: 3 },
    { symbol: 'COPPER', priceRange: [4.1, 4.6], decimals: 2 },
    { symbol: 'PLATINUM', priceRange: [980, 1080], decimals: 2 },
  ],
}

const analysisTemplates: Record<string, string[]> = {
  crypto: [
    'Breakout au-dessus de la résistance clé avec volume croissant. RSI à 65, momentum haussier fort.',
    'Pattern double bottom confirmé sur le timeframe 4H. Objectif basé sur la projection du pattern.',
    'Divergence haussière RSI sur le journalier. Retest du support mobile 50 MA réussi.',
    'Volume anormalement élevé sur les achats institutionnels. Breakout imminent.',
    'Retracment Fibonacci 0.618 atteint. Signal de retournement avec chandelier doji.',
    'Formation triangle symétrique en clôture. Breakout attendu dans les prochaines heures.',
  ],
  forex: [
    'Politique monétaire BCE/Différée - données macro favorables à la paire. Support dynamique tenu.',
    'NFP supérieur aux attentes, dollar se renforce. Configuration de vente sur rebond.',
    'Divergence de taux entre les banques centrales. Tendance de fond confirmée par les moyennes mobiles.',
    'Zone de support historique touchée. Pattern en V sur le timeframe H1.',
    'Crossover MACD sur le journalier avec volume confirmant. Flux institutionnel détecté.',
  ],
  stocks: [
    'Résultats trimestriels au-dessus des attentes. Guidance révisé à la hausse. Breakout technique.',
    'Formation Cup and Handle sur le graphique hebdomadaire. Objectif mesuré confirmé.',
    'Rotation sectorielle en faveur du segment. Accumulation institutionnelle détectée.',
    'Gap up sur volume élevé après annonce stratégique. Support formé au gap.',
    'RSI en survente extrême avec divergence haussière. Rebond technique attendu.',
  ],
  commodities: [
    'Tensions géopolitiques soutiennent la demande. Rupture de canal baissier confirmée.',
    'Stocks en baisse selon le rapport hebdomadaire. Configuration haussière sur le journalier.',
    'Dollar en recul, matières premières bénéficient. Support majeur tenu avec volume.',
    'Saison historiquement favorable. Pattern de fond en formation sur le graphique mensuel.',
    'Demande physique en hausse, premiums au comptant élevés. Signal d\'achat technique et fondamental.',
  ],
}

const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36)

function generateSignal(): TradeSignal {
  const assetTypes = ['crypto', 'forex', 'stocks', 'commodities'] as const
  const assetType = assetTypes[Math.floor(Math.random() * assetTypes.length)]
  const symbolPool = symbols[assetType]
  const symbolData = symbolPool[Math.floor(Math.random() * symbolPool.length)]
  
  const relevantExperts = experts.filter(e => e.specialty.includes(assetType))
  const expert = relevantExperts[Math.floor(Math.random() * relevantExperts.length)]
  
  const direction: 'LONG' | 'SHORT' = Math.random() > 0.45 ? 'LONG' : 'SHORT'
  const [minPrice, maxPrice] = symbolData.priceRange
  const entryPrice = minPrice + Math.random() * (maxPrice - minPrice)
  const multiplier = direction === 'LONG' ? 1 : -1
  const targetPercent = 0.01 + Math.random() * 0.04
  const targetPrice = entryPrice * (1 + multiplier * targetPercent)
  const stopPercent = 0.005 + Math.random() * 0.015
  const stopLoss = entryPrice * (1 - multiplier * stopPercent)
  const confidence = Math.floor(65 + Math.random() * 30)
  const analysisPool = analysisTemplates[assetType]
  const analysis = analysisPool[Math.floor(Math.random() * analysisPool.length)]
  
  return {
    id: generateId(),
    expertName: expert.name,
    expertAvatar: expert.avatar,
    expertRating: expert.rating,
    assetType,
    symbol: symbolData.symbol,
    direction,
    entryPrice: parseFloat(entryPrice.toFixed(symbolData.decimals)),
    targetPrice: parseFloat(targetPrice.toFixed(symbolData.decimals)),
    stopLoss: parseFloat(stopLoss.toFixed(symbolData.decimals)),
    confidence,
    timestamp: new Date().toISOString(),
    analysis,
    status: 'active',
  }
}

// Generate a batch of signals with varied timestamps
function generateBatch(count: number): TradeSignal[] {
  const signals: TradeSignal[] = []
  for (let i = 0; i < count; i++) {
    const signal = generateSignal()
    signal.timestamp = new Date(Date.now() - Math.random() * 7200000).toISOString()
    // Randomly close some signals
    if (Math.random() > 0.4) {
      const isWin = Math.random() > 0.35
      signal.status = isWin ? 'hit_target' : 'hit_stop'
      signal.pnl = isWin 
        ? parseFloat((Math.random() * 5 + 1).toFixed(2))
        : parseFloat((-Math.random() * 3 - 0.5).toFixed(2))
    }
    signals.push(signal)
  }
  return signals.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export { experts, generateSignal, generateBatch }
