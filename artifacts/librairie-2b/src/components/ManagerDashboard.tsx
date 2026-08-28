import React, { useState, useEffect, useMemo, useRef } from 'react'
import { BarChart3, Users, Package, Check, X, Calendar, Search, Clock, User, ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react'
import { supabase, Student } from '../lib/supabase'
import { formatAvanceDisplay, hasAvanceValue, parseAvanceInput } from '../lib/avance'

interface ManagerDashboardProps {
  onNavigate: (page: 'espace-client') => void
}

const EMPLOYEE_CREDENTIALS: { username: string; password: string; name: string }[] = []

function toLocalDateKey(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function todayLocalDateKey(): string {
  return toLocalDateKey(new Date().toISOString())
}

function shiftDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function localDayRange(dateKey: string): { start: string; end: string } {
  const [y, m, d] = dateKey.split('-').map(Number)
  const start = new Date(y, m - 1, d, 0, 0, 0, 0)
  const end = new Date(y, m - 1, d + 1, 0, 0, 0, 0)
  return { start: start.toISOString(), end: end.toISOString() }
}

function formatFrenchLongDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  if (!y || !m || !d) return ''
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function relativeDayLabel(dateKey: string): string | null {
  const today = todayLocalDateKey()
  if (dateKey === today) return "Aujourd'hui"
  if (dateKey === shiftDateKey(today, -1)) return 'Hier'
  if (dateKey === shiftDateKey(today, 1)) return 'Demain'
  return null
}

function orderBatchKey(order: Pick<Student, 'nom' | 'created_at'>): string {
  return `${order.nom ?? ''}|${order.created_at ?? ''}`
}

function summarizeDailyOrders(rows: Student[]) {
  const groups = new Map<string, Student[]>()
  for (const row of rows) {
    const key = orderBatchKey(row)
    const existing = groups.get(key)
    if (existing) existing.push(row)
    else groups.set(key, [row])
  }

  let ready = 0
  let pending = 0
  for (const children of groups.values()) {
    if (children.every(child => child.liste_prete)) ready += 1
    else pending += 1
  }

  return {
    commandes: groups.size,
    listes: rows.length,
    ready,
    pending,
  }
}

function ManagerDashboard({ onNavigate }: ManagerDashboardProps) {
  const [bookLists, setBookLists] = useState<Student[]>([])
  const [filteredBookLists, setFilteredBookLists] = useState<Student[]>([])
  const [employeeActivities, setEmployeeActivities] = useState<Student[]>([])
  const [filteredEmployeeActivities, setFilteredEmployeeActivities] = useState<Student[]>([])
  const [showActivityLog, setShowActivityLog] = useState(false)
  const [activityFilters, setActivityFilters] = useState({
    date: '',
    employeeName: ''
  })
  const [searchCode, setSearchCode] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'pending'>('all')
  const [dateFilter, setDateFilter] = useState('')
  const [selectedDay, setSelectedDay] = useState(todayLocalDateKey)
  const [dailyOrderStats, setDailyOrderStats] = useState({
    commandes: 0,
    listes: 0,
    ready: 0,
    pending: 0,
  })
  const [isLoadingDailyOrders, setIsLoadingDailyOrders] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [stats, setStats] = useState({
    total: 0,
    ready: 0,
    pending: 0,
  })

  const dailyAvances = useMemo(() => {
    if (!selectedDay) return []
    const seenOrders = new Set<string>()
    const rows: Array<{
      id: string
      nom: string
      code: string
      avance: Student['avance']
      amount: number
    }> = []

    for (const order of bookLists) {
      if (!hasAvanceValue(order.avance)) continue
      if (toLocalDateKey(order.created_at) !== selectedDay) continue

      // One avance per client order (same created_at batch) — never count sibling kids twice
      const orderKey = orderBatchKey(order)
      if (seenOrders.has(orderKey)) continue
      seenOrders.add(orderKey)

      rows.push({
        id: order.id,
        nom: order.nom ?? '—',
        code: order.code ?? '',
        avance: order.avance,
        amount: parseAvanceInput(order.avance) ?? 0,
      })
    }

    return rows.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
  }, [bookLists, selectedDay])

  const dailyAvanceTotal = useMemo(
    () => dailyAvances.reduce((sum, row) => sum + row.amount, 0),
    [dailyAvances]
  )

  const selectedDayRef = useRef(selectedDay)
  selectedDayRef.current = selectedDay

  const handleBackToHome = () => {
    window.location.reload()
  }

  const loadDailyOrderStats = async (dateKey = selectedDayRef.current) => {
    if (!dateKey) {
      setDailyOrderStats({ commandes: 0, listes: 0, ready: 0, pending: 0 })
      return
    }

    setIsLoadingDailyOrders(true)
    try {
      const { start, end } = localDayRange(dateKey)
      const pageSize = 1000
      let from = 0
      const rows: Student[] = []

      while (true) {
        const { data, error } = await supabase
          .from('students')
          .select('id, nom, created_at, liste_prete')
          .gte('created_at', start)
          .lt('created_at', end)
          .order('created_at', { ascending: true })
          .range(from, from + pageSize - 1)

        if (error) throw error
        rows.push(...((data || []) as Student[]))
        if (!data || data.length < pageSize) break
        from += pageSize
      }

      if (selectedDayRef.current !== dateKey) return
      setDailyOrderStats(summarizeDailyOrders(rows))
    } catch (error) {
      console.error('Error loading daily order count:', error)
      if (selectedDayRef.current !== dateKey) return
      setDailyOrderStats({ commandes: 0, listes: 0, ready: 0, pending: 0 })
    } finally {
      if (selectedDayRef.current === dateKey) {
        setIsLoadingDailyOrders(false)
      }
    }
  }

  useEffect(() => {
    loadBookLists()
    if (showActivityLog) {
      loadEmployeeActivities()
    }
    
    const subscription = supabase
      .channel('students_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'students' }, 
        () => {
          loadBookLists()
          loadDailyOrderStats()
          if (showActivityLog) loadEmployeeActivities()
        }
      )
      .subscribe()

    const refreshInterval = setInterval(() => {
      loadBookLists()
      loadDailyOrderStats()
    }, 180000)

    return () => {
      subscription.unsubscribe()
      clearInterval(refreshInterval)
    }
  }, [showActivityLog])

  useEffect(() => {
    loadDailyOrderStats(selectedDay)
  }, [selectedDay])

  useEffect(() => {
    filterBookLists()
  }, [bookLists, searchCode, statusFilter, dateFilter])

  useEffect(() => {
    filterEmployeeActivities()
  }, [employeeActivities, activityFilters])

  const loadBookLists = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)

      if (error) throw error

      setBookLists(data || [])
      setLastRefresh(new Date())
      
      const total = data?.length || 0
      const ready = data?.filter(item => item.liste_prete).length || 0
      const pending = total - ready

      setStats({ total, ready, pending })
    } catch (error) {
      console.error('Error loading book lists:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadEmployeeActivities = async () => {
    setIsLoadingActivities(true)
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .not('modified_by', 'is', null)
        .not('modified_at', 'is', null)
        .order('modified_at', { ascending: false })
        .limit(200)

      if (error) throw error

      setEmployeeActivities(data || [])
    } catch (error) {
      console.error('Error loading employee activities:', error)
    } finally {
      setIsLoadingActivities(false)
    }
  }

  const filterBookLists = () => {
    let filtered = [...bookLists]

    if (searchCode.trim()) {
      filtered = filtered.filter(item => 
        (item.code ?? '').toLowerCase().includes(searchCode.toLowerCase())
      )
    }

    if (dateFilter) {
      filtered = filtered.filter(item => toLocalDateKey(item.created_at) === dateFilter)
    }

    if (statusFilter === 'ready') {
      filtered = filtered.filter(item => item.liste_prete)
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(item => !item.liste_prete)
    }

    setFilteredBookLists(filtered)
  }

  const filterEmployeeActivities = () => {
    let filtered = [...employeeActivities]

    if (activityFilters.date) {
      filtered = filtered.filter(activity => {
        if (!activity.modified_at) return false
        const activityDate = new Date(activity.modified_at).toISOString().split('T')[0]
        return activityDate === activityFilters.date
      })
    }

    if (activityFilters.employeeName.trim()) {
      filtered = filtered.filter(activity => 
        activity.modified_by === activityFilters.employeeName
      )
    }

    setFilteredEmployeeActivities(filtered)
  }

  const handleManualRefresh = () => {
    loadBookLists()
    loadDailyOrderStats()
    if (showActivityLog) loadEmployeeActivities()
  }

  const getStatusBadge = (listePrete: boolean) => {
    if (listePrete) {
      return (
        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-green-100 text-green-800 border border-green-200">
          <Check className="h-3 w-3" />
          <span>Prête</span>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
        <X className="h-3 w-3" />
        <span>En attente</span>
      </span>
    )
  }

  const toggleActivityLog = () => {
    setShowActivityLog(!showActivityLog)
    if (!showActivityLog) {
      loadEmployeeActivities()
    } else {
      setActivityFilters({ date: '', employeeName: '' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-espresso-900"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pb-12">
      <div className="mb-8">
        <button
          onClick={() => onNavigate('espace-client')}
          className="px-5 py-2 bg-white border border-parchment-300 text-espresso-800 rounded-full font-semibold hover:bg-parchment-200 hover:text-espresso-900 transition-all shadow-sm text-sm uppercase tracking-wide"
        >
          ← Retour à l'Espace Client
        </button>
      </div>

      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-4 bg-espresso-900 rounded-full mb-6 shadow-md">
          <BarChart3 className="h-8 w-8 text-parchment-100" />
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-espresso-900 mb-4">
          Tableau de Bord
        </h1>
        <p className="text-lg text-espresso-600 font-medium">
          Vue d'ensemble et total des commandes par jour
        </p>
        <div className="mt-4 flex items-center justify-center space-x-4">
          <p className="text-sm text-espresso-500 font-medium">
            Dernière mise à jour: <span className="font-bold text-espresso-800">{lastRefresh.toLocaleTimeString('fr-FR')}</span>
          </p>
          <button
            onClick={handleManualRefresh}
            className="text-sm font-bold text-amber-600 hover:text-amber-800 transition-colors uppercase tracking-wide"
          >
            Actualiser
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <div 
          className={`bg-white rounded-3xl shadow-sm border p-8 cursor-pointer transition-all duration-300 ${
            statusFilter === 'all' 
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md bg-amber-50/30' 
              : 'border-parchment-300 hover:shadow-book hover:border-parchment-400'
          }`}
          onClick={() => setStatusFilter('all')}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-espresso-100 rounded-xl border border-espresso-200">
                <Users className="h-8 w-8 text-espresso-800" />
              </div>
              <p className="text-sm font-bold text-espresso-500 uppercase tracking-widest">Total</p>
            </div>
            <p className="text-5xl font-heading font-bold text-espresso-900 mt-auto">{stats.total}</p>
          </div>
        </div>

        <div 
          className={`bg-white rounded-3xl shadow-sm border p-8 cursor-pointer transition-all duration-300 ${
            statusFilter === 'ready' 
              ? 'border-green-500 ring-2 ring-green-500/20 shadow-md bg-green-50/50' 
              : 'border-parchment-300 hover:shadow-book hover:border-parchment-400'
          }`}
          onClick={() => setStatusFilter('ready')}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-green-100 rounded-xl border border-green-200">
                <Check className="h-8 w-8 text-green-700" />
              </div>
              <p className="text-sm font-bold text-green-700 uppercase tracking-widest">Prêtes</p>
            </div>
            <p className="text-5xl font-heading font-bold text-espresso-900 mt-auto">{stats.ready}</p>
          </div>
        </div>

        <div 
          className={`bg-white rounded-3xl shadow-sm border p-8 cursor-pointer transition-all duration-300 ${
            statusFilter === 'pending' 
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md bg-amber-50/50' 
              : 'border-parchment-300 hover:shadow-book hover:border-parchment-400'
          }`}
          onClick={() => setStatusFilter('pending')}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-amber-100 rounded-xl border border-amber-200">
                <Package className="h-8 w-8 text-amber-700" />
              </div>
              <p className="text-sm font-bold text-amber-700 uppercase tracking-widest">En Attente</p>
            </div>
            <p className="text-5xl font-heading font-bold text-espresso-900 mt-auto">{stats.pending}</p>
          </div>
        </div>
      </div>

      {/* Commandes du jour — total count for a selected date, not an order list */}
      <div className="relative overflow-hidden rounded-3xl shadow-book border border-espresso-800 mb-8 bg-espresso-900 text-parchment-100">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-amber-500/10 pointer-events-none" />
        <div className="absolute -left-10 -bottom-20 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col xl:flex-row xl:items-center gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="h-5 w-5 text-amber-400" />
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
                  Commandes du jour
                </p>
              </div>
              <h2 className="text-2xl md:text-3xl font-heading font-bold capitalize">
                {formatFrenchLongDate(selectedDay)}
              </h2>
              {relativeDayLabel(selectedDay) && (
                <p className="mt-1 text-sm font-semibold text-amber-200">
                  {relativeDayLabel(selectedDay)}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDay(prev => shiftDateKey(prev, -1))}
                  className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
                  aria-label="Jour précédent"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <input
                  type="date"
                  value={selectedDay}
                  onChange={(e) => {
                    if (e.target.value) setSelectedDay(e.target.value)
                  }}
                  className="px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-parchment-100 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 [color-scheme:dark]"
                />
                <button
                  type="button"
                  onClick={() => setSelectedDay(prev => shiftDateKey(prev, 1))}
                  className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
                  aria-label="Jour suivant"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDay(todayLocalDateKey())}
                  className={`px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
                    selectedDay === todayLocalDateKey()
                      ? 'bg-amber-500 text-espresso-950'
                      : 'bg-white/10 hover:bg-white/20 text-parchment-100'
                  }`}
                >
                  Aujourd'hui
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDay(shiftDateKey(todayLocalDateKey(), -1))}
                  className={`px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
                    selectedDay === shiftDateKey(todayLocalDateKey(), -1)
                      ? 'bg-amber-500 text-espresso-950'
                      : 'bg-white/10 hover:bg-white/20 text-parchment-100'
                  }`}
                >
                  Hier
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 rounded-2xl bg-white/10 border border-white/10 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-200 mb-2">
                Total commandes
              </p>
              {isLoadingDailyOrders ? (
                <div className="h-16 flex items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-300" />
                </div>
              ) : (
                <p className="text-6xl md:text-7xl font-heading font-bold tabular-nums leading-none">
                  {dailyOrderStats.commandes}
                </p>
              )}
              <p className="mt-3 text-sm text-parchment-200 font-medium">
                {dailyOrderStats.commandes === 1 ? 'commande client' : 'commandes clients'}
                {dailyOrderStats.commandes === 0 ? ' ce jour-là' : ' ce jour'}
              </p>
            </div>

            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/10 border border-white/10 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-green-200 mb-2">Prêtes</p>
                <p className="text-4xl font-heading font-bold tabular-nums">
                  {isLoadingDailyOrders ? '—' : dailyOrderStats.ready}
                </p>
                <p className="mt-2 text-xs text-parchment-300 font-medium">Listes entièrement prêtes</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/10 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-200 mb-2">En attente</p>
                <p className="text-4xl font-heading font-bold tabular-nums">
                  {isLoadingDailyOrders ? '—' : dailyOrderStats.pending}
                </p>
                <p className="mt-2 text-xs text-parchment-300 font-medium">Encore à préparer</p>
              </div>
              <div className="col-span-2 rounded-2xl bg-white/5 border border-white/10 px-5 py-4 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-parchment-200">
                  {dailyOrderStats.listes} liste{dailyOrderStats.listes === 1 ? '' : 's'} (enfants)
                </span>
                <span className="text-sm font-medium text-parchment-200">
                  {formatAvanceDisplay(dailyAvanceTotal) || '0'} DHS d'avances
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Avances par jour */}
      <div className="bg-white rounded-3xl shadow-book border border-parchment-300 p-6 md:p-8 mb-10">
        <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6 mb-6">
          <div className="flex-1">
            <h2 className="text-xl font-heading font-bold text-espresso-900 mb-1 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-700" />
              Avances du jour
            </h2>
            <p className="text-sm text-espresso-600 font-medium">
              Total des avances pour {relativeDayLabel(selectedDay)?.toLowerCase() ?? formatFrenchLongDate(selectedDay)}.
            </p>
          </div>
        </div>

        {!selectedDay ? (
          <p className="text-espresso-500 font-medium text-sm">Choisissez une date pour afficher les avances.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4 pb-4 border-b border-parchment-200">
              <span className="text-sm font-bold uppercase tracking-widest text-espresso-500">Total</span>
              <span className="text-3xl font-heading font-bold text-green-700">
                {formatAvanceDisplay(dailyAvanceTotal) || '0'} DHS
              </span>
              <span className="text-sm text-espresso-500 font-medium">
                ({dailyAvances.length} avance{dailyAvances.length === 1 ? '' : 's'})
              </span>
            </div>

            {dailyAvances.length === 0 ? (
              <p className="text-espresso-500 font-medium text-sm">Aucune avance enregistrée pour cette date.</p>
            ) : (
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                {dailyAvances.map(row => (
                  <span key={row.id} className="inline-flex items-baseline gap-1.5 bg-parchment-50 border border-parchment-200 rounded-lg px-3 py-1.5">
                    <span className="font-medium text-espresso-900">{row.nom}</span>
                    <span className="text-espresso-400">—</span>
                    <span className="font-bold text-green-700">{formatAvanceDisplay(row.avance)} DHS</span>
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Employee Activity Log Toggle */}
      <div className="mb-8 flex justify-center">
        <button
          onClick={toggleActivityLog}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold uppercase tracking-wider transition-all text-sm shadow-md border ${
            showActivityLog
              ? 'bg-espresso-900 text-white border-espresso-800'
              : 'bg-white text-espresso-800 border-parchment-300 hover:bg-parchment-100'
          }`}
        >
          <Clock className="h-5 w-5" />
          <span>{showActivityLog ? 'Masquer le journal' : 'Afficher le journal'}</span>
        </button>
      </div>

      {/* Employee Activity Log */}
      {showActivityLog && (
        <div className="bg-white rounded-3xl shadow-book border border-parchment-300 overflow-hidden mb-10">
          <div className="px-8 py-5 border-b border-parchment-200 bg-parchment-100">
            <h2 className="text-xl font-heading font-bold text-espresso-900 flex items-center space-x-3">
              <Clock className="h-5 w-5 text-amber-700" />
              <span>Activité des Collaborateurs</span>
            </h2>
          </div>
          
          <div className="p-6 border-b border-parchment-200 bg-white">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-xs font-bold text-espresso-500 uppercase tracking-widest mb-2">Date</label>
                <input
                  type="date"
                  value={activityFilters.date}
                  onChange={(e) => setActivityFilters(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 transition-colors bg-parchment-50 text-espresso-900 font-medium"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-espresso-500 uppercase tracking-widest mb-2">Collaborateur</label>
                <select
                  value={activityFilters.employeeName}
                  onChange={(e) => setActivityFilters(prev => ({ ...prev, employeeName: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 transition-colors bg-parchment-50 text-espresso-900 font-medium"
                >
                  <option value="">Tous les collaborateurs</option>
                  {Array.from(new Set(employeeActivities.map(activity => activity.modified_by).filter(Boolean))).sort().map(name => (
                    <option key={name} value={name as string}>{name}</option>
                  ))}
                </select>
              </div>
              {(activityFilters.date || activityFilters.employeeName) && (
                <div className="flex items-end">
                  <button
                    onClick={() => setActivityFilters({ date: '', employeeName: '' })}
                    className="px-6 py-3 font-bold text-espresso-600 hover:text-terracotta-600 transition-colors uppercase tracking-widest text-sm"
                  >
                    Effacer
                  </button>
                </div>
              )}
            </div>
          </div>

          {isLoadingActivities ? (
            <div className="p-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-espresso-900"></div>
            </div>
          ) : filteredEmployeeActivities.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="h-10 w-10 text-parchment-400 mx-auto mb-4" />
              <p className="text-espresso-600 font-medium">Aucune activité ne correspond aux filtres.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-parchment-50 border-b border-parchment-200">
                  <tr>
                    <th className="px-6 py-4 font-bold text-espresso-500 uppercase tracking-widest text-xs">Code</th>
                    <th className="px-6 py-4 font-bold text-espresso-500 uppercase tracking-widest text-xs">Client</th>
                    <th className="px-6 py-4 font-bold text-espresso-500 uppercase tracking-widest text-xs hidden md:table-cell">École</th>
                    <th className="px-6 py-4 font-bold text-espresso-500 uppercase tracking-widest text-xs">Collaborateur</th>
                    <th className="px-6 py-4 font-bold text-espresso-500 uppercase tracking-widest text-xs">Statut</th>
                    <th className="px-6 py-4 font-bold text-espresso-500 uppercase tracking-widest text-xs">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-parchment-100">
                  {filteredEmployeeActivities.map(activity => (
                    <tr key={activity.id} className="hover:bg-parchment-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-mono font-bold tracking-wider text-espresso-900">{activity.code}</td>
                      <td className="px-6 py-4 font-medium text-espresso-900">{activity.nom}</td>
                      <td className="px-6 py-4 text-espresso-700 hidden md:table-cell">{activity.ecole}</td>
                      <td className="px-6 py-4 font-medium text-amber-700 flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        {activity.modified_by}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(activity.liste_prete ?? false)}</td>
                      <td className="px-6 py-4 text-espresso-700">
                        {activity.modified_at && (
                          <>
                            <div className="font-medium">{new Date(activity.modified_at).toLocaleDateString('fr-FR')}</div>
                            <div className="text-xs text-espresso-500">{new Date(activity.modified_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Main List Filters */}
      <div className="bg-white rounded-3xl shadow-book border border-parchment-300 p-8 mb-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-espresso-400" />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
                placeholder="RECHERCHER PAR CODE"
                className="w-full pl-12 pr-4 py-4 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 transition-colors text-center font-mono font-bold text-lg tracking-[0.2em] uppercase bg-parchment-50 text-espresso-900"
                maxLength={4}
              />
            </div>
          </div>
          <div className="flex-1">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-4 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 transition-colors bg-parchment-50 text-espresso-900 font-medium"
            />
          </div>
          {(searchCode || dateFilter || statusFilter !== 'all') && (
            <div className="flex items-center">
              <button
                onClick={() => {
                  setSearchCode('')
                  setStatusFilter('all')
                  setDateFilter('')
                }}
                className="w-full lg:w-auto px-6 py-4 font-bold text-espresso-600 hover:text-terracotta-600 transition-colors uppercase tracking-widest text-sm border-2 border-transparent hover:border-parchment-200 rounded-xl"
              >
                Effacer
              </button>
            </div>
          )}
        </div>
        <div className="mt-4 text-sm font-bold text-espresso-500 uppercase tracking-widest text-center lg:text-left">
          Affichage de {filteredBookLists.length} sur {stats.total} commandes
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl shadow-book border border-parchment-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-parchment-100 border-b border-parchment-200">
              <tr>
                <th className="px-6 py-5 font-bold text-espresso-600 uppercase tracking-widest text-xs">Code</th>
                <th className="px-6 py-5 font-bold text-espresso-600 uppercase tracking-widest text-xs">Client</th>
                <th className="px-6 py-5 font-bold text-espresso-600 uppercase tracking-widest text-xs hidden md:table-cell">École / Niveau</th>
                <th className="px-6 py-5 font-bold text-espresso-600 uppercase tracking-widest text-xs hidden lg:table-cell">Date</th>
                <th className="px-6 py-5 font-bold text-espresso-600 uppercase tracking-widest text-xs">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-parchment-100">
              {filteredBookLists.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-espresso-600 font-medium">
                    Aucune commande ne correspond à ces critères.
                  </td>
                </tr>
              ) : (
                filteredBookLists.map(order => (
                  <tr key={order.id} className="hover:bg-parchment-50 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap font-mono font-bold tracking-widest text-espresso-900 text-base">{order.code}</td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-espresso-900">{order.nom}</div>
                      {(order.telephone || order.email) && (
                        <div className="text-xs text-espresso-500 mt-1">{order.telephone || order.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-5 hidden md:table-cell">
                      <div className="font-medium text-espresso-800">{order.ecole}</div>
                      <div className="text-xs text-espresso-500 mt-1">{order.niveau}</div>
                    </td>
                    <td className="px-6 py-5 text-espresso-700 hidden lg:table-cell">
                      {new Date(order.created_at ?? '').toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col items-start gap-2">
                        {getStatusBadge(order.liste_prete ?? false)}
                        {order.liste_prete && order.rangee && order.niveau_rangement && (
                          <span className="text-xs font-bold text-espresso-600 bg-parchment-100 px-2 py-1 rounded">
                            {order.rangee}-{order.niveau_rangement}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ManagerDashboard