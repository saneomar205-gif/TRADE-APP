import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Types
interface TradeSignal {
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

interface Expert {
  name: string
  avatar: string
  rating: number
  specialty: string[]
  winRate: number
  totalTrades: number
}

// Expert pool
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

// Symbol pools
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
    'Breakout au-dessus de la resistance clé avec volume croissant. RSI a 65, momentum haussier fort.',
    'Pattern double bottom confirme sur le timeframe 4H. Objectif basé sur la projection du pattern.',
    'Divergence haussiere RSI sur le journalier. Retest du support mobile 50 MA reussi.',
    'Volume anormalement eleve sur les achats institutionnels. Breakout imminent.',
    'Retracment Fibonacci 0.618 atteint. Signal de retournement avec chandelier doji.',
    'Formation triangle symetrique en cloture. Breakout attendu dans les prochaines heures.',
  ],
  forex: [
    'Politique monetaire BCE/Differee - donnees macro favorables a la paire. Support dynamique tenu.',
    'NFP superieur aux attentes, dollar se renforce. Configuration de vente sur rebond.',
    'Divergence de taux entre les banques centrales. Tendance de fond confirmee par les moyennes mobiles.',
    'Zone de support historique touchee. Pattern en V sur le timeframe H1.',
    'Crossover MACD sur le journalier avec volume confirmando. Flux institutionnel detecte.',
  ],
  stocks: [
    'Resultats trimestriels au-dessus des attentes. Guidance revise a la hausse. Breakout technique.',
    'Formation Cup and Handle sur le graphique hebdomadaire. Objectif mesure confirme.',
    'Rotation sectorielle en faveur du segment. Accumulation institutionnelle detectee.',
    'Gap up sur volume eleve apres annonce strategique. Support formee au gap.',
    'RSI en survente extreme avec divergence haussiere. Rebond technique attendu.',
  ],
  commodities: [
    'Tensions geopolitiques soutiennent la demande. Rupture de canal baissier confirmee.',
    'Stocks en baisse selon le rapport hebdomadaire. Configuration haussiere sur le journalier.',
    'Dollar en recul, matieres premieres beneficient. Support majeur tenu avec volume.',
    'Saison historiquement favorable. Pattern de fond en formation sur le graphique mensuel.',
    'Demande physique en hausse, premiums au comptant eleves. Signal dachat technique et fondamental.',
  ],
}

const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36)

function generateSignal(): TradeSignal {
  const assetTypes = ['crypto', 'forex', 'stocks', 'commodities'] as const
  const assetType = assetTypes[Math.floor(Math.random() * assetTypes.length)]
  const symbolPool = symbols[assetType]
  const symbolData = symbolPool[Math.floor(Math.random() * symbolPool.length)]
  
  // Pick expert that specializes in this asset type
  const relevantExperts = experts.filter(e => e.specialty.includes(assetType))
  const expert = relevantExperts[Math.floor(Math.random() * relevantExperts.length)]
  
  const direction: 'LONG' | 'SHORT' = Math.random() > 0.45 ? 'LONG' : 'SHORT'
  
  const [minPrice, maxPrice] = symbolData.priceRange
  const entryPrice = minPrice + Math.random() * (maxPrice - minPrice)
  const multiplier = direction === 'LONG' ? 1 : -1
  
  // Target: 1-5% move
  const targetPercent = 0.01 + Math.random() * 0.04
  const targetPrice = entryPrice * (1 + multiplier * targetPercent)
  
  // Stop loss: 0.5-2% against
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

// Store recent signals
const recentSignals: TradeSignal[] = []
const MAX_SIGNALS = 200

// Generate initial batch
for (let i = 0; i < 15; i++) {
  const signal = generateSignal()
  signal.timestamp = new Date(Date.now() - Math.random() * 3600000).toISOString()
  // Randomly close some old signals
  if (Math.random() > 0.4) {
    const outcomes: ('hit_target' | 'hit_stop')[] = ['hit_target', 'hit_stop']
    signal.status = outcomes[Math.floor(Math.random() * outcomes.length)]
    if (signal.status === 'hit_target') {
      signal.pnl = parseFloat((Math.random() * 5 + 1).toFixed(2))
    } else {
      signal.pnl = parseFloat((-Math.random() * 3 - 0.5).toFixed(2))
    }
  }
  recentSignals.push(signal)
}

// Sort by timestamp
recentSignals.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

// Stats
function getStats() {
  const closed = recentSignals.filter(s => s.status !== 'active')
  const wins = closed.filter(s => s.status === 'hit_target')
  const totalPnl = closed.reduce((acc, s) => acc + (s.pnl || 0), 0)
  
  return {
    totalSignals: recentSignals.length,
    activeSignals: recentSignals.filter(s => s.status === 'active').length,
    winRate: closed.length > 0 ? parseFloat((wins.length / closed.length * 100).toFixed(1)) : 0,
    totalPnl: parseFloat(totalPnl.toFixed(2)),
    avgConfidence: recentSignals.length > 0 
      ? parseFloat((recentSignals.reduce((acc, s) => acc + s.confidence, 0) / recentSignals.length).toFixed(1))
      : 0,
    byAsset: {
      crypto: recentSignals.filter(s => s.assetType === 'crypto').length,
      forex: recentSignals.filter(s => s.assetType === 'forex').length,
      stocks: recentSignals.filter(s => s.assetType === 'stocks').length,
      commodities: recentSignals.filter(s => s.assetType === 'commodities').length,
    }
  }
}

// Periodically update old active signals
setInterval(() => {
  const activeSignals = recentSignals.filter(s => s.status === 'active')
  if (activeSignals.length > 5) {
    // Randomly close some
    const toClose = activeSignals[Math.floor(Math.random() * activeSignals.length)]
    const isWin = Math.random() > 0.35
    toClose.status = isWin ? 'hit_target' : 'hit_stop'
    toClose.pnl = isWin 
      ? parseFloat((Math.random() * 5 + 1).toFixed(2))
      : parseFloat((-Math.random() * 3 - 0.5).toFixed(2))
    io.emit('signal-updated', toClose)
  }
}, 15000)

// Generate new signals periodically
setInterval(() => {
  const signal = generateSignal()
  recentSignals.unshift(signal)
  if (recentSignals.length > MAX_SIGNALS) {
    recentSignals.pop()
  }
  io.emit('new-signal', signal)
  io.emit('stats', getStats())
}, 5000 + Math.random() * 5000)

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)
  
  // Send initial data
  socket.emit('signals-history', recentSignals.slice(0, 50))
  socket.emit('stats', getStats())
  socket.emit('experts', experts)
  
  socket.on('request-signals', (filters: { 
    assetType?: string; 
    direction?: string; 
    expert?: string;
  }) => {
    let filtered = [...recentSignals]
    if (filters.assetType) {
      filtered = filtered.filter(s => s.assetType === filters.assetType)
    }
    if (filters.direction) {
      filtered = filtered.filter(s => s.direction === filters.direction)
    }
    if (filters.expert) {
      filtered = filtered.filter(s => s.expertName === filters.expert)
    }
    socket.emit('filtered-signals', filtered.slice(0, 50))
  })
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
  })
})

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`Trading Signals WebSocket server running on port ${PORT}`)
})

process.on('SIGTERM', () => {
  httpServer.close(() => process.exit(0))
})

process.on('SIGINT', () => {
  httpServer.close(() => process.exit(0))
})
