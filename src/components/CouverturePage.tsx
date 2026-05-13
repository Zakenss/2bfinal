import React, { useState, useEffect } from 'react'
import { Package, Calendar, User, School, Search, Filter, Check, Send } from 'lucide-react'
import { supabase, Student } from '../lib/supabase'

interface CouverturePageProps {
  onNavigate: (page: 'espace-client') => void
  currentUser?: string
}

function CouverturePage({ onNavigate, currentUser }: CouverturePageProps) {
  const [bookLists, setBookLists] = useState<Student[]>([])
  const [filteredBookLists, setFilteredBookLists] = useState<Student[]>([])
  const [searchCode, setSearchCode] = useState('')
  const [searchName, setSearchName] = useState('')
  const [showOnlyNonEnvoyees, setShowOnlyNonEnvoyees] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set())

  const loadCouvertureOrders = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('couverture_demandee', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      setBookLists(data || [])
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error loading couverture orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterBookLists = () => {
    let filtered = bookLists
    
    // Filter by search code
    if (searchCode) {
      filtered = filtered.filter(bookList =>
        bookList.code.toLowerCase().includes(searchCode.toLowerCase())
      )
    }
    
    // Filter by search name
    if (searchName) {
      filtered = filtered.filter(bookList =>
        bookList.nom.toLowerCase().includes(searchName.toLowerCase())
      )
    }
    
    // Filter by non-envoyées if enabled
    if (showOnlyNonEnvoyees) {
      filtered = filtered.filter(bookList => !bookList.couverture_sent)
    }
    
    setFilteredBookLists(filtered)
  }

  useEffect(() => {
    // Set up real-time subscription
    const subscription = supabase
      .channel('couverture_orders')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'students'
        }, 
        () => {
          loadCouvertureOrders()
        }
      )
      .subscribe()

    // Set up periodic refresh every 3 minutes
    const refreshInterval = setInterval(() => {
      loadCouvertureOrders()
    }, 180000)

    return () => {
      subscription.unsubscribe()
      clearInterval(refreshInterval)
    }
  }, [])

  useEffect(() => {
    loadCouvertureOrders()
  }, [])

  useEffect(() => {
    filterBookLists()
  }, [bookLists, searchCode, searchName, showOnlyNonEnvoyees])

  const handleManualRefresh = () => {
    loadCouvertureOrders()
  }

  const handleMarkAsSent = async (bookList: Student) => {
    if (updatingOrders.has(bookList.id)) return

    setUpdatingOrders(prev => new Set(prev).add(bookList.id))

    try {
      const { error } = await supabase
        .from('students')
        .update({
          couverture_sent: !bookList.couverture_sent,
          couverture_sent_at: !bookList.couverture_sent ? new Date().toISOString() : null,
          couverture_sent_by: !bookList.couverture_sent ? 'aichabenzangue@gmail.com' : null,
        })
        .eq('id', bookList.id)

      if (error) throw error

      // Refresh the data
      loadCouvertureOrders()
    } catch (error) {
      console.error('Error updating couverture status:', error)
    } finally {
      setUpdatingOrders(prev => {
        const newSet = new Set(prev)
        newSet.delete(bookList.id)
        return newSet
      })
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
        <Package className="h-12 w-12 text-gray-900 mx-auto mb-4" />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Commandes avec Couverture
        </h1>
        <p className="text-sm md:text-base text-gray-800">
          Toutes les commandes qui ont demandé une couverture
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

      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recherche par code:
            </label>
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
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recherche par nom:
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Nom du client"
                className="w-full pl-10 pr-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base md:text-lg"
              />
            </div>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          {searchCode && (
            <button
              onClick={() => setSearchCode('')}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 underline whitespace-nowrap"
            >
              Effacer code
            </button>
          )}
          
          {searchName && (
            <button
              onClick={() => setSearchName('')}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 underline whitespace-nowrap"
            >
              Effacer nom
            </button>
          )}
        </div>
        
        {(searchCode || searchName) && (
          <div className="mt-4 text-sm text-gray-800">
            Affichage de {filteredBookLists.length} sur {bookLists.length} commandes
          </div>
        )}
      </div>

      {/* Couverture Orders Table */}
      {/* Couverture Orders Cards */}
      <div className="space-y-4">
        {filteredBookLists.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 text-center">
            <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-base md:text-lg text-gray-800">
              {bookLists.length === 0 ? 'Aucune commande avec couverture trouvée' : 'Aucune commande ne correspond à la recherche'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookLists.map((bookList) => (
              <div key={bookList.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {/* Order Code and Status */}
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-lg font-bold text-blue-900">
                        #{bookList.code}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        bookList.liste_prete
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {bookList.liste_prete ? '✓ Prête' : 'En attente'}
                      </span>
                      {bookList.liste_prete && bookList.rangee && bookList.niveau_rangement && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          📍 {bookList.rangee} N{bookList.niveau_rangement}
                        </span>
                      )}
                    </div>

                    {/* Customer Name */}
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">{bookList.nom}</span>
                    </div>

                    {/* School and Level */}
                    <div className="flex items-center space-x-2 mb-3">
                      <School className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-800">{bookList.ecole} - {bookList.niveau}</span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(bookList.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                      
                      {/* Action Button */}
                      <button
                        type="button"
                        onClick={() => handleMarkAsSent(bookList)}
                        disabled={updatingOrders.has(bookList.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all text-xs ${
                          bookList.couverture_sent
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {updatingOrders.has(bookList.id) ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>...</span>
                          </div>
                        ) : bookList.couverture_sent ? (
                          'Annuler'
                        ) : (
                          'Envoyer'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CouverturePage