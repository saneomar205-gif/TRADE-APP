'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Activity, Volume2, VolumeX,
  Filter, RefreshCw, Clock, Star, Zap, BarChart3,
  Globe, Bitcoin, DollarSign, Landmark, Gem,
  CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight,
  Wifi, WifiOff, Menu
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Toggle } from '@/components/ui/toggle'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

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

interface Stats {
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

// Asset type config
const assetConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  crypto: { label: 'Crypto', icon: <Bitcoin className="w-4 h-4" />, color: 'text-[var(--crypto)]' },
  forex: { label: 'Forex', icon: <DollarSign className="w-4 h-4" />, color: 'text-[var(--forex)]' },
  stocks: { label: 'Actions', icon: <Landmark className="w-4 h-4" />, color: 'text-[var(--stocks)]' },
  commodities: { label: 'Mat. Prem.', icon: <Gem className="w-4 h-4" />, color: 'text-[var(--commodities)]' },
}

// Sound effect generator
function playAlertSound() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  } catch {}
}

// Time ago formatter
function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return `Il y a ${diff}s`
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)}m`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`
  return `Il y a ${Math.floor(diff / 86400)}j`
}

// ===== SIGNAL CARD =====
function SignalCard({ signal, isNew }: { signal: TradeSignal; isNew: boolean }) {
  const isLong = signal.direction === 'LONG'
  const isProfit = signal.status === 'hit_target'
  const isLoss = signal.status === 'hit_stop'
  const asset = assetConfig[signal.assetType]

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: -20, scale: 0.97 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`rounded-xl border transition-all ${
        isProfit ? 'border-profit/30 profit-glow' : 
        isLoss ? 'border-loss/30 loss-glow' : 
        'border-border hover:border-primary/30'
      } bg-card/80 backdrop-blur-sm`}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${
              isLong ? 'bg-profit/15 text-profit' : 'bg-loss/15 text-loss'
            }`}>
              {signal.expertAvatar}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-foreground">{signal.expertName}</span>
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs text-muted-foreground">{signal.expertRating}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-xs ${asset.color} flex items-center gap-1`}>
                  {asset.icon}
                  {asset.label}
                </span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{timeAgo(signal.timestamp)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {signal.status !== 'active' && (
              <Badge variant="outline" className={`text-xs ${
                isProfit ? 'border-profit/40 text-profit' : 'border-loss/40 text-loss'
              }`}>
                {isProfit ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                {isProfit ? 'Cible atteinte' : 'Stop touché'}
              </Badge>
            )}
            <Badge className={`text-xs font-bold ${
              isLong ? 'bg-profit/15 text-profit border-profit/30 hover:bg-profit/20' : 'bg-loss/15 text-loss border-loss/30 hover:bg-loss/20'
            }`}>
              {isLong ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              {signal.direction}
            </Badge>
          </div>
        </div>

        {/* Symbol and price */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-lg font-bold text-foreground">{signal.symbol}</span>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Entrée</div>
            <div className="text-sm font-mono font-semibold text-foreground">{signal.entryPrice.toLocaleString()}</div>
          </div>
        </div>

        {/* Target and Stop */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className={`rounded-lg p-2 ${isLong ? 'bg-profit/5' : 'bg-loss/5'}`}>
            <div className="text-xs text-muted-foreground mb-0.5">Objectif</div>
            <div className={`text-sm font-mono font-semibold ${isLong ? 'text-profit' : 'text-loss'}`}>
              {signal.targetPrice.toLocaleString()}
            </div>
          </div>
          <div className={`rounded-lg p-2 ${isLong ? 'bg-loss/5' : 'bg-profit/5'}`}>
            <div className="text-xs text-muted-foreground mb-0.5">Stop Loss</div>
            <div className={`text-sm font-mono font-semibold ${isLong ? 'text-loss' : 'text-profit'}`}>
              {signal.stopLoss.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Analysis */}
        <div className="text-xs text-muted-foreground mb-3 leading-relaxed">
          {signal.analysis}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-primary" />
              <span className="text-xs text-muted-foreground">Confiance</span>
              <span className="text-xs font-semibold text-foreground">{signal.confidence}%</span>
            </div>
          </div>
          {signal.pnl !== undefined && (
            <div className={`text-sm font-bold ${signal.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
              {signal.pnl >= 0 ? '+' : ''}{signal.pnl}%
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ===== STATS BAR =====
function StatsBar({ stats }: { stats: Stats | null }) {
  if (!stats) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card className="bg-card/60 backdrop-blur-sm border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Signaux Actifs</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.activeSignals}</div>
          <div className="text-xs text-muted-foreground mt-1">{stats.totalSignals} total</div>
        </CardContent>
      </Card>
      <Card className="bg-card/60 backdrop-blur-sm border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-profit" />
            <span className="text-xs text-muted-foreground">Taux de Réussite</span>
          </div>
          <div className="text-2xl font-bold text-profit">{stats.winRate}%</div>
          <Progress value={stats.winRate} className="mt-1 h-1.5 bg-muted" />
        </CardContent>
      </Card>
      <Card className="bg-card/60 backdrop-blur-sm border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">PnL Total</span>
          </div>
          <div className={`text-2xl font-bold ${stats.totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
            {stats.totalPnl >= 0 ? '+' : ''}{stats.totalPnl}%
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card/60 backdrop-blur-sm border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-muted-foreground">Confiance Moy.</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.avgConfidence}%</div>
          <Progress value={stats.avgConfidence} className="mt-1 h-1.5 bg-muted" />
        </CardContent>
      </Card>
    </div>
  )
}

// ===== FILTER PANEL =====
function FilterPanel({ 
  filters, 
  setFilters,
  experts 
}: { 
  filters: { assetType: string; direction: string; expert: string; status: string }
  setFilters: (f: { assetType: string; direction: string; expert: string; status: string }) => void
  experts: Expert[]
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          Filtres
        </h3>
      </div>

      {/* Asset Type */}
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Type d&apos;Actif</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(assetConfig).map(([key, config]) => (
            <Button
              key={key}
              variant={filters.assetType === key ? 'default' : 'outline'}
              size="sm"
              className={`text-xs justify-start ${
                filters.assetType === key ? 'bg-primary text-primary-foreground' : ''
              }`}
              onClick={() => setFilters({ ...filters, assetType: filters.assetType === key ? '' : key })}
            >
              {config.icon}
              <span className="ml-1.5">{config.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Direction */}
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Direction</label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={filters.direction === 'LONG' ? 'default' : 'outline'}
            size="sm"
            className={`text-xs ${filters.direction === 'LONG' ? 'bg-profit/20 text-profit border-profit/30' : ''}`}
            onClick={() => setFilters({ ...filters, direction: filters.direction === 'LONG' ? '' : 'LONG' })}
          >
            <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
            Long
          </Button>
          <Button
            variant={filters.direction === 'SHORT' ? 'default' : 'outline'}
            size="sm"
            className={`text-xs ${filters.direction === 'SHORT' ? 'bg-loss/20 text-loss border-loss/30' : ''}`}
            onClick={() => setFilters({ ...filters, direction: filters.direction === 'SHORT' ? '' : 'SHORT' })}
          >
            <TrendingDown className="w-3.5 h-3.5 mr-1.5" />
            Short
          </Button>
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Statut</label>
        <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="hit_target">Cible atteinte</SelectItem>
            <SelectItem value="hit_stop">Stop touché</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Expert */}
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Expert</label>
        <Select value={filters.expert} onValueChange={(v) => setFilters({ ...filters, expert: v })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Tous les experts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            {experts.map((e) => (
              <SelectItem key={e.name} value={e.name}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold">{e.avatar}</span>
                  <span>{e.name}</span>
                  <span className="text-xs text-muted-foreground">{e.winRate}%</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reset */}
      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={() => setFilters({ assetType: '', direction: '', expert: '', status: 'all' })}
      >
        <RefreshCw className="w-3 h-3 mr-1.5" />
        Réinitialiser les filtres
      </Button>
    </div>
  )
}

// ===== EXPERT RANKING =====
function ExpertRanking({ experts }: { experts: Expert[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Star className="w-4 h-4 text-yellow-500" />
        Top Experts
      </h3>
      <div className="space-y-2">
        {experts.sort((a, b) => b.winRate - a.winRate).map((expert, idx) => (
          <div key={expert.name} className="flex items-center gap-3 p-2 rounded-lg bg-card/40 hover:bg-card/70 transition-colors">
            <div className="text-xs font-bold text-muted-foreground w-4">#{idx + 1}</div>
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
              {expert.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">{expert.name}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-profit">{expert.winRate}%</span>
                <span>·</span>
                <span>{expert.totalTrades} trades</span>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-xs text-foreground">{expert.rating}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===== ASSET BREAKDOWN =====
function AssetBreakdown({ stats }: { stats: Stats | null }) {
  if (!stats) return null
  const total = stats.byAsset.crypto + stats.byAsset.forex + stats.byAsset.stocks + stats.byAsset.commodities
  if (total === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Globe className="w-4 h-4 text-primary" />
        Répartition par Actif
      </h3>
      <div className="space-y-3">
        {Object.entries(assetConfig).map(([key, config]) => {
          const count = stats.byAsset[key as keyof typeof stats.byAsset]
          const pct = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs flex items-center gap-1.5 ${config.color}`}>
                  {config.icon}
                  {config.label}
                </span>
                <span className="text-xs text-muted-foreground">{count} ({pct.toFixed(0)}%)</span>
              </div>
              <Progress value={pct} className="h-2 bg-muted" />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ===== MAIN PAGE =====
export default function TradingDashboard() {
  const [signals, setSignals] = useState<TradeSignal[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [experts, setExperts] = useState<Expert[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [filters, setFilters] = useState({ assetType: '', direction: '', expert: '', status: 'all' })
  const [newSignalIds, setNewSignalIds] = useState<Set<string>>(new Set())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const lastFetchRef = useRef<string>('')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch signals from API
  const fetchSignals = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (lastFetchRef.current) {
        params.set('after', lastFetchRef.current)
      }
      if (filters.assetType) params.set('assetType', filters.assetType)
      if (filters.direction) params.set('direction', filters.direction)
      if (filters.expert && filters.expert !== 'all') params.set('expert', filters.expert)
      if (filters.status && filters.status !== 'all') params.set('status', filters.status)

      const res = await fetch(`/api/signals?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch')
      
      const data = await res.json()
      setIsConnected(true)

      if (data.signals && data.signals.length > 0) {
        const newIds = data.signals
          .filter((s: TradeSignal) => !signals.find(existing => existing.id === s.id))
          .map((s: TradeSignal) => s.id)

        if (newIds.length > 0 && lastFetchRef.current) {
          // Only play sound for truly new signals (not initial load)
          if (soundEnabled) playAlertSound()
          setNewSignalIds(prev => {
            const next = new Set(prev)
            newIds.forEach((id: string) => next.add(id))
            return next
          })
          setTimeout(() => {
            setNewSignalIds(prev => {
              const next = new Set(prev)
              newIds.forEach((id: string) => next.delete(id))
              return next
            })
          }, 2000)
        }

        setSignals(prev => {
          const merged = [...data.signals, ...prev]
          const unique = new Map(merged.map((s: TradeSignal) => [s.id, s]))
          return Array.from(unique.values())
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 100)
        })
      }

      lastFetchRef.current = data.timestamp || new Date().toISOString()
    } catch {
      setIsConnected(false)
    }
  }, [filters, signals, soundEnabled])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch {}
  }, [])

  // Fetch experts
  useEffect(() => {
    fetch('/api/experts')
      .then(res => res.json())
      .then(data => setExperts(data))
      .catch(() => {})
  }, [])

  // Initial load and polling
  useEffect(() => {
    fetchSignals()
    fetchStats()

    // Poll every 5 seconds
    intervalRef.current = setInterval(() => {
      fetchSignals()
      fetchStats()
    }, 5000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchSignals, fetchStats])

  // Re-fetch when filters change
  useEffect(() => {
    lastFetchRef.current = ''
    setSignals([])
    fetchSignals()
  }, [filters, fetchSignals])

  // Filter signals client-side as well
  const filteredSignals = signals.filter(s => {
    if (filters.assetType && s.assetType !== filters.assetType) return false
    if (filters.direction && s.direction !== filters.direction) return false
    if (filters.expert && filters.expert !== 'all' && s.expertName !== filters.expert) return false
    if (filters.status && filters.status !== 'all' && s.status !== filters.status) return false
    return true
  })

  // Sidebar content (shared between desktop and mobile)
  const sidebarContent = (
    <div className="space-y-6">
      <FilterPanel filters={filters} setFilters={setFilters} experts={experts} />
      <Separator />
      <ExpertRanking experts={experts} />
      <Separator />
      <AssetBreakdown stats={stats} />
    </div>
  )

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile menu toggle */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 bg-card border-border p-4 custom-scrollbar overflow-y-auto">
                  {sidebarContent}
                </SheetContent>
              </Sheet>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold gradient-text">TradeFlow Pro</h1>
                  <p className="text-xs text-muted-foreground">Signaux d&apos;Experts en Direct</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Connection status */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                isConnected 
                  ? 'bg-profit/10 text-profit' 
                  : 'bg-loss/10 text-loss'
              }`}>
                {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isConnected ? 'Connecté' : 'Déconnecté'}</span>
                {isConnected && <span className="w-1.5 h-1.5 rounded-full bg-profit live-pulse" />}
              </div>

              {/* Sound toggle */}
              <Toggle
                pressed={soundEnabled}
                onPressedChange={setSoundEnabled}
                aria-label="Toggle sound alerts"
                className="data-[state=on]:bg-primary/15 data-[state=on]:text-primary"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Toggle>

              {/* Signal count */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-xs">
                <Zap className="w-3.5 h-3.5 text-yellow-500" />
                <span className="font-semibold">{filteredSignals.length}</span>
                <span className="text-muted-foreground">signaux</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="border-b border-border bg-card/30">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <StatsBar stats={stats} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        <div className="max-w-[1600px] mx-auto w-full flex gap-0 lg:gap-6 p-4">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-72 shrink-0">
            <div className="sticky top-[140px] max-h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar pr-2 space-y-6">
              {sidebarContent}
            </div>
          </aside>

          {/* Signal Feed */}
          <main className="flex-1 min-w-0">
            {/* Feed header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Flux en Direct
                {isConnected && <span className="w-2 h-2 rounded-full bg-profit live-pulse" />}
              </h2>
              <div className="flex items-center gap-2">
                {/* Quick filter badges */}
                {Object.entries(assetConfig).map(([key, config]) => {
                  const count = signals.filter(s => s.assetType === key).length
                  return (
                    <Button
                      key={key}
                      variant={filters.assetType === key ? 'default' : 'outline'}
                      size="sm"
                      className={`text-xs h-7 ${filters.assetType === key ? 'bg-primary text-primary-foreground' : ''}`}
                      onClick={() => setFilters({ ...filters, assetType: filters.assetType === key ? '' : key })}
                    >
                      {config.icon}
                      <span className="ml-1 hidden sm:inline">{config.label}</span>
                      <span className="ml-1 text-[10px] opacity-70">{count}</span>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Signals list */}
            <ScrollArea className="h-[calc(100vh-260px)]">
              <div className="space-y-3 pr-2">
                <AnimatePresence mode="popLayout">
                  {filteredSignals.length === 0 ? (
                    <div className="text-center py-16">
                      <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground text-sm">Aucun signal trouvé</p>
                      <p className="text-muted-foreground/60 text-xs mt-1">Les signaux des experts apparaîtront ici en temps réel</p>
                    </div>
                  ) : (
                    filteredSignals.map((signal) => (
                      <SignalCard
                        key={signal.id}
                        signal={signal}
                        isNew={newSignalIds.has(signal.id)}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 py-3">
        <div className="max-w-[1600px] mx-auto px-4 flex items-center justify-between">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-primary" />
            TradeFlow Pro — Signaux d&apos;experts en temps réel
          </div>
          <div className="text-xs text-muted-foreground">
            {isConnected ? (
              <span className="flex items-center gap-1.5 text-profit">
                <span className="w-1.5 h-1.5 rounded-full bg-profit live-pulse" />
                Streaming en direct
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-loss">
                <WifiOff className="w-3 h-3" />
                Hors ligne
              </span>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
