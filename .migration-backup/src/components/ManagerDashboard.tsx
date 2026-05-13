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
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('students_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students'
        }, 
        () => {
          // Reload data when changes occur
          loadBookLists()
          if (showActivityLog) {
            loadEmployeeActivities()
          }
        }
      )
      .subscribe()

    // Set up periodic refresh every 30 seconds
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
      // Force fresh data by adding timestamp to prevent caching
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)

      if (error) throw error

      setBookLists(data || [])
      setLastRefresh(new Date())
      
      // Calculate stats
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

    // Filter by search code
    if (searchCode.trim()) {
      filtered = filtered.filter(item => 
        item.code.toLowerCase().includes(searchCode.toLowerCase())
      )
    }

    // Filter by submission date (created_at)
    if (dateFilter) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.created_at).toISOString().split('T')[0]
        return itemDate === dateFilter
      })
    }

    // Filter by status
    if (statusFilter === 'ready') {
      filtered = filtered.filter(item => item.liste_prete)
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(item => !item.liste_prete)
    }

    setFilteredBookLists(filtered)
  }

  const filterEmployeeActivities = () => {
    let filtered = [...employeeActivities]

    // Filter by date
    if (activityFilters.date) {
      filtered = filtered.filter(activity => {
        if (!activity.modified_at) return false
        const activityDate = new Date(activity.modified_at).toISOString().split('T')[0]
        return activityDate === activityFilters.date
      })
    }

    // Filter by employee name
    if (activityFilters.employeeName.trim()) {
      filtered = filtered.filter(activity => 
        activity.modified_by === activityFilters.employeeName
      )
    }

    setFilteredEmployeeActivities(filtered)
  }

  const handleManualRefresh = () => {
    loadBookLists()
    if (showActivityLog) {
      loadEmployeeActivities()
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
    setSearchCode(value)
  }

  const getStatusBadge = (listePrete: boolean) => {
    if (listePrete) {
      return (
        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <Check className="h-4 w-4" />
          <span>Prête</span>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
        <X className="h-4 w-4" />
        <span>En attente</span>
      </span>
    )
  }

  const toggleActivityLog = () => {
    setShowActivityLog(!showActivityLog)
    if (!showActivityLog) {
      loadEmployeeActivities()
    } else {
      // Reset filters when hiding activity log
      setActivityFilters({ date: '', employeeName: '' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="mb-6">
        <button
          onClick={() => onNavigate('espace-client')}
          className="px-4 py-2 bg-blue-200 text-blue-900 rounded-lg font-medium hover:bg-blue-300 transition-colors"
        >
          Retour à l'Espace Client
        </button>
      </div>

      <div className="text-center mb-8">
        <BarChart3 className="h-12 w-12 text-gray-900 mx-auto mb-4" />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Tableau de Bord Gestionnaire
        </h1>
        <p className="text-sm md:text-base text-gray-800">
          Vue d'ensemble de toutes les commandes de livres
        </p>
        <div className="mt-2 flex items-center justify-center space-x-4">
          <p className="text-xs text-gray-600">
            Dernière mise à jour: {lastRefresh.toLocaleTimeString('fr-FR')}
          </p>
          <button
            onClick={handleManualRefresh}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Actualiser
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div 
          className={`bg-white rounded-2xl shadow-xl p-6 cursor-pointer transition-all ${
            statusFilter === 'all' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-2xl'
          }`}
          onClick={() => setStatusFilter('all')}
        >
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="p-3 bg-blue-200 rounded-lg">
              <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-800" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Total Commandes</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div 
          className={`bg-white rounded-2xl shadow-xl p-6 cursor-pointer transition-all ${
            statusFilter === 'ready' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:shadow-2xl'
          }`}
          onClick={() => setStatusFilter('ready')}
        >
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="p-3 bg-green-200 rounded-lg">
              <Check className="h-6 w-6 md:h-8 md:w-8 text-green-800" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Listes Prêtes</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats.ready}</p>
            </div>
          </div>
        </div>

        <div 
          className={`bg-white rounded-2xl shadow-xl p-6 cursor-pointer transition-all ${
            statusFilter === 'pending' ? 'ring-2 ring-yellow-500 bg-yellow-50' : 'hover:shadow-2xl'
          }`}
          onClick={() => setStatusFilter('pending')}
        >
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="p-3 bg-yellow-200 rounded-lg">
              <Package className="h-6 w-6 md:h-8 md:w-8 text-yellow-800" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">En Attente</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Activity Log Toggle */}
      <div className="mb-6">
        <button
          onClick={toggleActivityLog}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
            showActivityLog
              ? 'bg-indigo-700 text-white shadow-md'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          <Clock className="h-5 w-5" />
          <span>{showActivityLog ? 'Masquer' : 'Afficher'} Journal d'Activité</span>
        </button>
      </div>

      {/* Employee Activity Log */}
      {showActivityLog && (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          {/* Activity Filters */}
          <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
              <div className="flex-1">
                <label htmlFor="activity-date" className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrer par date:
                </label>
                <input
                  type="date"
                  id="activity-date"
                  value={activityFilters.date}
                  onChange={(e) => setActivityFilters(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div className="flex-1">
                <label htmlFor="activity-employee" className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrer par adjoint:
                </label>
                <select
                  id="activity-employee"
                  value={activityFilters.employeeName}
                  onChange={(e) => setActivityFilters(prev => ({ ...prev, employeeName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="">Tous les adjoints</option>
                  {EMPLOYEE_CREDENTIALS.map((employee) => (
                    <option key={employee.name} value={employee.name}>{employee.name}</option>
                  ))}
                  {/* Also include any additional names from actual activities that might not be in credentials */}
                  {Array.from(new Set(employeeActivities.map(activity => activity.modified_by).filter(name => 
                    name && !EMPLOYEE_CREDENTIALS.some(emp => emp.name === name)
                  ))).sort().map((employeeName) => (
                    <option key={employeeName} value={employeeName}>{employeeName}</option>
                  ))}
                </select>
              </div>
              
              {(activityFilters.date || activityFilters.employeeName) && (
                <div className="flex items-end">
                  <button
                    onClick={() => setActivityFilters({ date: '', employeeName: '' })}
                    className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 underline whitespace-nowrap"
                  >
                    Effacer filtres
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="px-4 md:px-6 py-4 border-b border-gray-300 bg-indigo-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <Clock className="h-6 w-6 text-indigo-600" />
                <span>Journal d'Activité des Adjoints</span>
              </h2>
              {isLoadingActivities && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
              )}
            </div>
          </div>

          {filteredEmployeeActivities.length === 0 ? (
            <div className="p-6 md:p-8 text-center">
              <Clock className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-base md:text-lg text-gray-800">
                {employeeActivities.length === 0 ? 'Aucune activité d\'adjoint trouvée' : 'Aucune activité ne correspond aux filtres'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      École - Niveau
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Adjoint
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Emplacement
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date/Heure
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployeeActivities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm md:text-base font-mono font-bold text-blue-900">
                          {activity.code}
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {activity.nom}
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="text-sm text-gray-900">
                          {activity.ecole} - {activity.niveau}
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-indigo-600" />
                          <span className="text-sm font-medium text-indigo-800">
                            {activity.modified_by}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(activity.liste_prete)}
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                        {activity.rangee && activity.niveau_rangement ? (
                          <div className="text-sm text-gray-900">
                            Rangée {activity.rangee}, Niveau {activity.niveau_rangement}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-600">Non défini</span>
                        )}
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {activity.modified_at && (
                            <>
                              <div>{new Date(activity.modified_at).toLocaleDateString('fr-FR')}</div>
                              <div className="text-xs text-gray-600">
                                {new Date(activity.modified_at).toLocaleTimeString('fr-FR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
                  setSearchCode(value)
                }}
                placeholder="Code format: AB12"
                className="w-full pl-10 pr-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center font-mono text-base md:text-lg tracking-wider uppercase"
                maxLength={4}
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <Filter className="h-5 w-5 text-gray-700" />
            <span className="text-sm font-medium text-gray-800">Filtrer:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  statusFilter === 'all'
                    ? 'bg-blue-700 text-white shadow-md'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => setStatusFilter('ready')}
                className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  statusFilter === 'ready'
                    ? 'bg-green-700 text-white shadow-md'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Prêtes
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  statusFilter === 'pending'
                    ? 'bg-yellow-700 text-white shadow-md'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                En attente
              </button>
            </div>
          </div>
          
          {(searchCode || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchCode('')
                setStatusFilter('all')
                setDateFilter('')
              }}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 underline whitespace-nowrap"
            >
              Effacer filtres
            </button>
          )}
        </div>
        
        {(searchCode || statusFilter !== 'all' || dateFilter) && (
          <div className="mt-4 text-sm text-gray-800">
            Affichage de {filteredBookLists.length} sur {stats.total} commandes
          </div>
        )}
      </div>
      {/* Book Lists Table */}
      {/* Date Filter */}
      <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filtrer par date de soumission:
            </label>
            <input
              type="date"
              id="date-filter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          
          {dateFilter && (
            <div className="flex items-end">
              <button
                onClick={() => setDateFilter('')}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 underline whitespace-nowrap"
              >
                Effacer date
              </button>
            </div>
          )}
        </div>
        
        {dateFilter && (
          <div className="mt-4 text-sm text-gray-800">
            Commandes soumises le: {new Date(dateFilter).toLocaleDateString('fr-FR')}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-gray-300">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">
            Toutes les Commandes ({filteredBookLists.length})
          </h2>
        </div>

        {filteredBookLists.length === 0 ? (
          <div className="p-6 md:p-8 text-center">
            <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-base md:text-lg text-gray-800">
              {bookLists.length === 0 ? 'Aucune commande trouvée' : 'Aucune commande ne correspond aux filtres'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    École
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Niveau
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Contact
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Adjoint
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                    Emplacement
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Date / Modification
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookLists.map((bookList) => (
                  <tr key={bookList.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                      <span className="text-sm md:text-lg font-mono font-bold text-blue-900">
                        {bookList.code}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {bookList.nom}
                      </div>
                      <div className="text-xs text-gray-700 md:hidden">
                        {bookList.ecole} - {bookList.niveau}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-900">{bookList.ecole}</div>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-gray-900">{bookList.niveau}</div>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-gray-900">{bookList.email}</div>
                      <div className="text-sm text-gray-700">{bookList.telephone}</div>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(bookList.liste_prete)}
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      {bookList.modified_by ? (
                        <div className="text-sm text-blue-800 font-medium">
                          {bookList.modified_by.split(' ')[0]}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-600">-</span>
                      )}
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap hidden xl:table-cell">
                      {bookList.rangee && bookList.niveau_rangement ? (
                        <div className="text-sm text-gray-900">
                          Rangée {bookList.rangee}, Niveau {bookList.niveau_rangement}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-600">Non défini</span>
                      )}
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="flex items-center space-x-1 text-sm text-gray-700">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(bookList.created_at).toLocaleDateString('fr-FR')} {new Date(bookList.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManagerDashboard