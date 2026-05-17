import React, { useState, useEffect } from 'react'
import { BarChart3, Users, Package, Check, X, Calendar, Search, Filter, Clock, User } from 'lucide-react'
import { supabase, Student } from '../lib/supabase'

interface ManagerDashboardProps {
  onNavigate: (page: 'espace-client') => void
}

const EMPLOYEE_CREDENTIALS: { username: string; password: string; name: string }[] = []

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
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [stats, setStats] = useState({
    total: 0,
    ready: 0,
    pending: 0,
  })

  const handleBackToHome = () => {
    window.location.reload()
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
          if (showActivityLog) loadEmployeeActivities()
        }
      )
      .subscribe()

    const refreshInterval = setInterval(() => {
      loadBookLists()
    }, 180000)

    return () => {
      subscription.unsubscribe()
      clearInterval(refreshInterval)
    }
  }, [showActivityLog])

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
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.created_at ?? '').toISOString().split('T')[0]
        return itemDate === dateFilter
      })
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
          Vue d'ensemble de toutes les commandes
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