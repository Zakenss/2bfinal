import React, { useState } from 'react'
import { Search, Package, Check, X, Clock, MapPin, User, Calendar, School, List } from 'lucide-react'
import { supabase, Student } from '../lib/supabase'

interface FollowUpProps {
  onNavigate: (page: 'espace-client') => void
}

function FollowUp({ onNavigate }: FollowUpProps) {
  const [searchCode, setSearchCode] = useState('')
  const [searchMode, setSearchMode] = useState<'code' | 'school' | 'name'>('code')
  const [schoolSearch, setSchoolSearch] = useState({ ecole: '', niveau: '' })
  const [nameSearch, setNameSearch] = useState('')
  const [allOrders, setAllOrders] = useState<Student[]>([])
  const [filteredNames, setFilteredNames] = useState<string[]>([])
  const [showNameDropdown, setShowNameDropdown] = useState(false)
  const [isLoadingAllOrders, setIsLoadingAllOrders] = useState(false)
  const [bookList, setBookList] = useState<Student | null>(null)
  const [schoolResults, setSchoolResults] = useState<Student[]>([])
  const [nameResults, setNameResults] = useState<Student[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [ecoles, setEcoles] = useState<string[]>([])
  const [isLoadingEcoles, setIsLoadingEcoles] = useState(false)
  const [showEcoleDropdown, setShowEcoleDropdown] = useState(false)
  const [filteredEcoles, setFilteredEcoles] = useState<string[]>([])

  const handleBackToHome = () => {
    window.location.reload()
  }

  const loadEcoles = async () => {
    setIsLoadingEcoles(true)
    try {
      const { data, error } = await supabase
        .from('ecoles')
        .select('nom_ecole')
        .order('nom_ecole', { ascending: true })

      if (error) throw error

      const ecoleNames = data?.map(item => item.nom_ecole).filter(Boolean) || []
      setEcoles(ecoleNames)
      setFilteredEcoles(ecoleNames)
    } catch (error) {
      console.error('Error loading écoles:', error)
    } finally {
      setIsLoadingEcoles(false)
    }
  }

  const loadAllOrders = async () => {
    setIsLoadingAllOrders(true)
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('nom', { ascending: true })

      if (error) throw error

      setAllOrders(data || [])
      
      // Get unique names for dropdown
      const uniqueNames = Array.from(new Set(data?.map(order => order.nom.trim()).filter(Boolean) || []))
        .sort()
      setFilteredNames(uniqueNames)
    } catch (error) {
      console.error('Error loading all orders:', error)
    } finally {
      setIsLoadingAllOrders(false)
    }
  }

  const handleSearchModeChange = (mode: 'code' | 'school' | 'name') => {
    setSearchMode(mode)
    setBookList(null)
    setSchoolResults([])
    setNameResults([])
    setNotFound(false)
    setSearchCode('')
    setSchoolSearch({ ecole: '', niveau: '' })
    setNameSearch('')
    setShowEcoleDropdown(false)
    setShowNameDropdown(false)
    setFilteredEcoles(ecoles)
    setFilteredNames(Array.from(new Set(allOrders.map(order => order.nom.trim()).filter(Boolean))).sort())
    
    if (mode === 'school' && ecoles.length === 0) {
      loadEcoles()
    }
    
    if (mode === 'name' && allOrders.length === 0) {
      loadAllOrders()
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (searchMode === 'code') {
      if (searchCode.length !== 4) return
      await searchByCode()
    } else if (searchMode === 'school') {
      if (!schoolSearch.ecole || !schoolSearch.niveau) return
      await searchBySchool()
    } else if (searchMode === 'name') {
      if (!nameSearch.trim()) return
      await searchByName()
    }
  }

  const searchByCode = async () => {
    setIsSearching(true)
    setNotFound(false)
    setBookList(null)
    setSchoolResults([])

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('code', searchCode)
        .single()

      if (error || !data) {
        setNotFound(true)
      } else {
        setBookList(data)
      }
    } catch (error) {
      console.error('Error searching:', error)
      setNotFound(true)
    } finally {
      setIsSearching(false)
    }
  }

  const searchBySchool = async () => {
    setIsSearching(true)
    setNotFound(false)
    setBookList(null)
    setSchoolResults([])

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('ecole', schoolSearch.ecole)
        .eq('niveau', schoolSearch.niveau)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (!data || data.length === 0) {
        setNotFound(true)
      } else {
        setSchoolResults(data)
      }
    } catch (error) {
      console.error('Error searching:', error)
      setNotFound(true)
    } finally {
      setIsSearching(false)
    }
  }

  const searchByName = async () => {
    setIsSearching(true)
    setNotFound(false)
    setBookList(null)
    setSchoolResults([])
    setNameResults([])

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('nom', nameSearch.trim())
        .order('created_at', { ascending: false })

      if (error) throw error

      if (!data || data.length === 0) {
        setNotFound(true)
      } else {
        setNameResults(data)
      }
    } catch (error) {
      console.error('Error searching by name:', error)
      setNotFound(true)
    } finally {
      setIsSearching(false)
    }
  }

  const handleEcoleInputChange = (value: string) => {
    setSchoolSearch(prev => ({ ...prev, ecole: value }))
    
    // Filter écoles based on input
    const filtered = ecoles.filter(ecole => 
      ecole.toLowerCase().includes(value.toLowerCase())
    )
    setFilteredEcoles(filtered)
    setShowEcoleDropdown(value.length > 0 && filtered.length > 0)
  }

  const handleEcoleSelect = (ecoleName: string) => {
    setSchoolSearch(prev => ({ ...prev, ecole: ecoleName }))
    setShowEcoleDropdown(false)
    setFilteredEcoles(ecoles)
  }

  const handleNameInputChange = (value: string) => {
    setNameSearch(value)
    
    // Filter names based on input
    const uniqueNames = Array.from(new Set(allOrders.map(order => order.nom.trim()).filter(Boolean)))
    const filtered = uniqueNames.filter(name => 
      name.toLowerCase().includes(value.toLowerCase())
    ).sort()
    setFilteredNames(filtered)
    setShowNameDropdown(value.length > 0 && filtered.length > 0)
  }

  const handleNameSelect = (selectedName: string) => {
    setNameSearch(selectedName)
    setShowNameDropdown(false)
  }

  const getStatusDisplay = (listePrete: boolean) => {
    if (listePrete) {
      return {
        icon: <Check className="h-8 w-8 text-green-800" />,
        text: 'Votre commande est prête !',
        bgColor: 'bg-green-100',
        textColor: 'text-green-900',
        borderColor: 'border-green-300'
      }
    }
    return {
      icon: <Clock className="h-8 w-8 text-yellow-800" />,
      text: 'Votre commande est en cours de préparation',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-900',
      borderColor: 'border-yellow-300'
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="mb-6">
        <button
          onClick={() => onNavigate('espace-client')}
          className="px-4 py-2 bg-blue-200 text-blue-900 rounded-lg font-medium hover:bg-blue-300 transition-colors"
        >
          Retour à l'Espace Client
        </button>
      </div>

      <div className="text-center mb-8">
        {searchMode === 'code' ? (
          <Search className="h-12 w-12 text-gray-900 mx-auto mb-4" />
        ) : searchMode === 'school' ? (
          <School className="h-12 w-12 text-gray-900 mx-auto mb-4" />
        ) : (
          <User className="h-12 w-12 text-gray-900 mx-auto mb-4" />
        )}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Suivi de Commande
        </h1>
        <p className="text-sm md:text-base text-gray-800">
          {searchMode === 'code' 
            ? 'Entrez votre code de commande pour vérifier le statut'
            : searchMode === 'school'
            ? 'Recherchez par école et niveau pour voir toutes les commandes correspondantes'
            : 'Recherchez par nom pour voir toutes les commandes correspondantes'
          }
        </p>
      </div>

      {/* Search Mode Toggle */}
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          <button
            onClick={() => handleSearchModeChange('code')}
            className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              searchMode === 'code'
                ? 'bg-blue-800 text-white shadow-md'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            <Search className="h-5 w-5" />
            <span>Recherche par Code</span>
          </button>
          <button
            onClick={() => handleSearchModeChange('school')}
            className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              searchMode === 'school'
                ? 'bg-blue-800 text-white shadow-md'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            <School className="h-5 w-5" />
            <span>Recherche par École</span>
          </button>
          <button
            onClick={() => handleSearchModeChange('name')}
            className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              searchMode === 'name'
                ? 'bg-blue-800 text-white shadow-md'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            <User className="h-5 w-5" />
            <span>Recherche par Nom</span>
          </button>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8">
        {searchMode === 'code' ? (
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <label htmlFor="code" className="block text-sm font-semibold text-gray-900 mb-2">
                Code de commande
              </label>
              <input
                type="text"
                id="code"
                value={searchCode}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
                  setSearchCode(value)
                }}
                placeholder="Ex: AB12"
                className="w-full px-4 py-3 text-2xl text-center border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all tracking-wider font-mono uppercase"
                maxLength={4}
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={searchCode.length !== 4 || isSearching}
                className="px-6 py-3 bg-blue-800 text-white rounded-lg font-semibold hover:bg-blue-900 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base w-full sm:w-auto"
              >
                {isSearching ? 'Recherche...' : 'Rechercher'}
              </button>
            </div>
          </form>
        ) : searchMode === 'school' ? (
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ecole" className="block text-sm font-semibold text-gray-900 mb-2">
                  École
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="ecole"
                    value={schoolSearch.ecole}
                    onChange={(e) => handleEcoleInputChange(e.target.value)}
                    onFocus={() => {
                      if (filteredEcoles.length > 0) {
                        setShowEcoleDropdown(true)
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding dropdown to allow clicks
                      setTimeout(() => setShowEcoleDropdown(false), 200)
                    }}
                    className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder={isLoadingEcoles ? "Chargement..." : "Tapez pour rechercher une école"}
                    disabled={isLoadingEcoles}
                  />
                  {showEcoleDropdown && filteredEcoles.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-400 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredEcoles.map((ecole) => (
                        <button
                          key={ecole}
                          type="button"
                          onClick={() => handleEcoleSelect(ecole)}
                          className="w-full px-4 py-2 text-left hover:bg-blue-100 focus:bg-blue-100 focus:outline-none transition-colors border-b border-gray-200 last:border-b-0 text-sm"
                        >
                          {ecole}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="niveau" className="block text-sm font-semibold text-gray-900 mb-2">
                  Niveau
                </label>
                <select
                  id="niveau"
                  value={schoolSearch.niveau}
                  onChange={(e) => setSchoolSearch(prev => ({ ...prev, niveau: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Sélectionnez un niveau</option>
                  <option value="PS">PS</option>
                  <option value="MS">MS</option>
                  <option value="GS">GS</option>
                  <option value="CP">CP</option>
                  <option value="CE1">CE1</option>
                  <option value="CE2">CE2</option>
                  <option value="CM1">CM1</option>
                  <option value="CM2">CM2</option>
                  <option value="CE6">CE6</option>
                  <option value="CE7">CE7</option>
                  <option value="CE8">CE8</option>
                  <option value="CE9">CE9</option>
                  <option value="TC">TC</option>
                  <option value="1BAC">1BAC</option>
                  <option value="2BAC">2BAC</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={!schoolSearch.ecole || !schoolSearch.niveau || isSearching}
              className="w-full px-6 py-3 bg-blue-800 text-white rounded-lg font-semibold hover:bg-blue-900 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              {isSearching ? 'Recherche...' : 'Rechercher'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="nom" className="block text-sm font-semibold text-gray-900 mb-2">
                Nom
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="nom"
                  value={nameSearch}
                  onChange={(e) => handleNameInputChange(e.target.value)}
                  onFocus={() => {
                    if (filteredNames.length > 0) {
                      setShowNameDropdown(true)
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding dropdown to allow clicks
                    setTimeout(() => setShowNameDropdown(false), 200)
                  }}
                  className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder={isLoadingAllOrders ? "Chargement des noms..." : "Tapez pour rechercher un nom"}
                  disabled={isLoadingAllOrders}
                />
                {isLoadingAllOrders && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
                {showNameDropdown && filteredNames.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-400 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredNames.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleNameSelect(name)}
                        className="w-full px-4 py-2 text-left hover:bg-blue-100 focus:bg-blue-100 focus:outline-none transition-colors border-b border-gray-200 last:border-b-0 text-sm"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={!nameSearch.trim() || isSearching}
              className="w-full px-6 py-3 bg-blue-800 text-white rounded-lg font-semibold hover:bg-blue-900 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              {isSearching ? 'Recherche...' : 'Rechercher'}
            </button>
          </form>
        )}
      </div>

      {/* Not Found Message */}
      {notFound && (
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 text-center">
          <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
            {searchMode === 'code' ? 'Code non trouvé' : searchMode === 'school' ? 'Aucune commande trouvée' : 'Nom non trouvé'}
          </h3>
          <p className="text-sm md:text-base text-gray-800">
            {searchMode === 'code' 
              ? 'Aucune commande trouvée avec ce code. Vérifiez votre code et réessayez.'
              : searchMode === 'school'
              ? 'Aucune commande trouvée pour cette école et ce niveau.'
              : 'Aucune commande trouvée avec ce nom. Vérifiez le nom et réessayez.'
            }
          </p>
        </div>
      )}

      {/* Name Search Results */}
      {nameResults.length > 0 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <User className="h-8 w-8 text-blue-800" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-2">
                Commandes trouvées pour {nameSearch}
              </h2>
              <p className="text-lg font-semibold text-gray-900">
                {nameResults.length} commande{nameResults.length > 1 ? 's' : ''} trouvée{nameResults.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="space-y-4">
              {nameResults.map((order) => (
                <div key={order.id} className={`rounded-xl p-4 md:p-6 border-2 ${
                  order.liste_prete 
                    ? 'bg-green-100 border-green-300' 
                    : 'bg-yellow-100 border-yellow-300'
                }`}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-lg font-mono font-bold text-blue-900">
                          #{order.code}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          order.liste_prete
                            ? 'bg-green-200 text-green-800' 
                            : 'bg-yellow-200 text-yellow-800'
                        }`}>
                          {order.liste_prete ? 'Prête' : 'En attente'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <School className="h-4 w-4 text-gray-600" />
                            <span className="font-medium text-gray-900">{order.ecole}</span>
                          </div>
                          <div className="text-gray-800 ml-6">
                            Niveau: {order.niveau}
                          </div>
                          {order.genre && (
                            <div className="text-gray-800 ml-6">
                              Genre: {order.genre === 'fille' ? 'Fille' : 'Garçon'}
                            </div>
                          )}
                          {order.avance && (
                            <div className="text-green-800 font-medium ml-6">
                              Avance: {order.avance} DHS
                            </div>
                          )}
                          {order.couverture_demandee && (
                            <div className="text-purple-800 font-medium ml-6">
                              Couverture: Demandée
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-600" />
                            <span className="text-gray-800">
                              {new Date(order.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {order.liste_prete && order.rangee && order.niveau_rangement && (
                      <div className="bg-white/70 rounded-lg p-3 md:ml-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <MapPin className="h-4 w-4 text-blue-800" />
                          <span className="text-sm font-medium text-blue-900">Emplacement:</span>
                        </div>
                        <p className="text-sm font-semibold text-blue-900">
                          Rangée {order.rangee}, Niveau {order.niveau_rangement}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* School Search Results */}
      {schoolResults.length > 0 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <List className="h-8 w-8 text-blue-800" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-2">
                Commandes trouvées pour {schoolSearch.ecole} - {schoolSearch.niveau}
              </h2>
              <p className="text-lg font-semibold text-gray-900">
                {schoolResults.length} commande{schoolResults.length > 1 ? 's' : ''} trouvée{schoolResults.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="space-y-4">
              {schoolResults.map((order) => (
                <div key={order.id} className={`rounded-xl p-4 md:p-6 border-2 ${
                  order.liste_prete 
                    ? 'bg-green-100 border-green-300' 
                    : 'bg-yellow-100 border-yellow-300'
                }`}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-lg font-mono font-bold text-blue-900">
                          #{order.code}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          order.liste_prete
                            ? 'bg-green-200 text-green-800' 
                            : 'bg-yellow-200 text-yellow-800'
                        }`}>
                          {order.liste_prete ? 'Prête' : 'En attente'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-600" />
                            <span className="font-medium text-gray-900">{order.nom}</span>
                          </div>
                          {order.genre && (
                            <div className="text-gray-800 ml-6">
                              Genre: {order.genre === 'fille' ? 'Fille' : 'Garçon'}
                            </div>
                          )}
                          {order.avance && (
                            <div className="text-green-800 font-medium ml-6">
                              Avance: {order.avance} DHS
                            </div>
                          )}
                          {order.couverture_demandee && (
                            <div className="text-purple-800 font-medium ml-6">
                              Couverture: Demandée
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-600" />
                            <span className="text-gray-800">
                              {new Date(order.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Package className="h-5 w-5 text-gray-700" />
                      <div>
                        <span className="text-sm text-gray-700">Avance:</span>
                        <p className="font-medium text-green-800">{order.avance || 0} DHS</p>
                      </div>
                    </div>
                    {order.liste_prete && order.rangee && order.niveau_rangement && (
                      <div className="bg-white/70 rounded-lg p-3 md:ml-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <MapPin className="h-4 w-4 text-blue-800" />
                          <span className="text-sm font-medium text-blue-900">Emplacement:</span>
                        </div>
                        <p className="text-sm font-semibold text-blue-900">
                          Rangée {order.rangee}, Niveau {order.niveau_rangement}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Order Status Display */}
      {bookList && (
        <div className="space-y-6">
          {/* Status Card */}
          <div className={`rounded-2xl shadow-xl p-6 md:p-8 border-2 ${getStatusDisplay(bookList.liste_prete).bgColor} ${getStatusDisplay(bookList.liste_prete).borderColor}`}>
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                {getStatusDisplay(bookList.liste_prete).icon}
              </div>
              <h2 className={`text-xl md:text-2xl font-bold mb-2 ${getStatusDisplay(bookList.liste_prete).textColor}`}>
                {getStatusDisplay(bookList.liste_prete).text}
              </h2>
              <p className="text-lg font-mono font-bold text-gray-900">
                Commande #{bookList.code}
              </p>
            </div>

            {/* Order Details */}
            <div className="bg-white/70 rounded-xl p-4 md:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails de votre commande</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-700" />
                    <div>
                      <span className="text-sm text-gray-700">Nom:</span>
                      <p className="font-medium text-gray-900">{bookList.nom}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Package className="h-5 w-5 text-gray-700" />
                    <div>
                      <span className="text-sm text-gray-700">École:</span>
                      <p className="font-medium text-gray-900">{bookList.ecole}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-700" />
                    <div>
                      <span className="text-sm text-gray-700">Niveau:</span>
                      <p className="font-medium text-gray-900">{bookList.niveau}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-700" />
                    <div>
                      <span className="text-sm text-gray-700">Date de commande:</span>
                      <p className="font-medium text-gray-900">
                        {new Date(bookList.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  {bookList.couverture_demandee && (
                    <div className="flex items-center space-x-3">
                      <Package className="h-5 w-5 text-gray-700" />
                      <div>
                        <span className="text-sm text-gray-700">Couverture:</span>
                        <p className="font-medium text-purple-800">Demandée</p>
                      </div>
                    </div>
                  )}
                  {bookList.avance && (
                    <div className="flex items-center space-x-3">
                      <Package className="h-5 w-5 text-gray-700" />
                      <div>
                        <span className="text-sm text-gray-700">Avance:</span>
                        <p className="font-medium text-green-800">{bookList.avance} DHS</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Processing Details (if ready) */}
          {bookList.liste_prete && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                <MapPin className="h-6 w-6 text-blue-800" />
                <span>Informations de traitement</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bookList.modified_by && (
                  <div className="bg-blue-100 rounded-lg p-4">
                    <span className="text-sm font-medium text-blue-900">Traité par:</span>
                    <p className="text-lg font-semibold text-blue-900">{bookList.modified_by}</p>
                  </div>
                )}
                
                {bookList.rangee && bookList.niveau_rangement && (
                  <div className="bg-green-100 rounded-lg p-4">
                    <span className="text-sm font-medium text-green-900">Emplacement:</span>
                    <p className="text-lg font-semibold text-green-900">
                      Rangée {bookList.rangee}, Niveau {bookList.niveau_rangement}
                    </p>
                  </div>
                )}
                
                {bookList.modified_at && (
                  <div className="bg-indigo-100 rounded-lg p-4 md:col-span-2">
                    <span className="text-sm font-medium text-indigo-900">Date de traitement:</span>
                    <p className="text-lg font-semibold text-indigo-900">
                      {new Date(bookList.modified_at).toLocaleDateString('fr-FR')} à {new Date(bookList.modified_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 p-4 bg-green-100 rounded-lg border border-green-200">
                <p className="text-green-900 font-medium text-center">
                  🎉 Votre commande est prête ! Vous pouvez venir la récupérer.
                </p>
              </div>
            </div>
          )}

          {/* Pending Status Info */}
          {!bookList.liste_prete && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <div className="text-center">
                <Clock className="h-12 w-12 text-yellow-700 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Commande en cours de préparation
                </h3>
                <p className="text-gray-800">
                  Votre commande est actuellement en cours de traitement. Vous recevrez une notification dès qu'elle sera prête.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FollowUp