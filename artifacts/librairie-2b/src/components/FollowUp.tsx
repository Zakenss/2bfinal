import React, { useState } from 'react'
import { Search, Package, Check, X, Clock, User, School } from 'lucide-react'
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

  const loadEcoles = async () => {
    setIsLoadingEcoles(true)
    try {
      const { data, error } = await supabase.from('ecoles').select('nom_ecole').order('nom_ecole', { ascending: true })
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
      const { data, error } = await supabase.from('students').select('*').order('nom', { ascending: true })
      if (error) throw error
      setAllOrders(data || [])
      const uniqueNames = Array.from(new Set(data?.map(order => order.nom.trim()).filter(Boolean) || [])).sort()
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
    
    if (mode === 'school' && ecoles.length === 0) loadEcoles()
    if (mode === 'name' && allOrders.length === 0) loadAllOrders()
  }

  const searchByCode = async () => {
    setIsSearching(true)
    setNotFound(false)
    setBookList(null)
    setSchoolResults([])
    try {
      const { data, error } = await supabase.from('students').select('*').eq('code', searchCode).single()
      if (error || !data) setNotFound(true)
      else setBookList(data)
    } catch {
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
      const { data, error } = await supabase.from('students').select('*').eq('ecole', schoolSearch.ecole).eq('niveau', schoolSearch.niveau).order('created_at', { ascending: false })
      if (error) throw error
      if (!data || data.length === 0) setNotFound(true)
      else setSchoolResults(data)
    } catch {
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
      const { data, error } = await supabase.from('students').select('*').eq('nom', nameSearch.trim()).order('created_at', { ascending: false })
      if (error) throw error
      if (!data || data.length === 0) setNotFound(true)
      else setNameResults(data)
    } catch {
      setNotFound(true)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (searchMode === 'code') { if (searchCode.length === 4) await searchByCode() }
    else if (searchMode === 'school') { if (schoolSearch.ecole && schoolSearch.niveau) await searchBySchool() }
    else if (searchMode === 'name') { if (nameSearch.trim()) await searchByName() }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pb-12">
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
          {searchMode === 'code' ? <Search className="h-8 w-8 text-parchment-100" /> : searchMode === 'school' ? <School className="h-8 w-8 text-parchment-100" /> : <User className="h-8 w-8 text-parchment-100" />}
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-espresso-900 mb-4">
          Suivi de Commande
        </h1>
        <p className="text-lg text-espresso-600 font-medium">
          Vérifiez l'état de préparation de vos listes scolaires.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-book border border-parchment-300 p-6 md:p-8 mb-10">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4 mb-8">
          <button
            onClick={() => handleSearchModeChange('code')}
            className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl font-bold uppercase tracking-wide transition-all border-2 ${
              searchMode === 'code' ? 'bg-amber-600 text-white border-amber-600 shadow-md' : 'bg-parchment-50 text-espresso-600 border-parchment-200 hover:border-amber-400'
            }`}
          >
            <Search className="h-5 w-5" /><span>Par Code</span>
          </button>
          <button
            onClick={() => handleSearchModeChange('school')}
            className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl font-bold uppercase tracking-wide transition-all border-2 ${
              searchMode === 'school' ? 'bg-amber-600 text-white border-amber-600 shadow-md' : 'bg-parchment-50 text-espresso-600 border-parchment-200 hover:border-amber-400'
            }`}
          >
            <School className="h-5 w-5" /><span>Par École</span>
          </button>
          <button
            onClick={() => handleSearchModeChange('name')}
            className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl font-bold uppercase tracking-wide transition-all border-2 ${
              searchMode === 'name' ? 'bg-amber-600 text-white border-amber-600 shadow-md' : 'bg-parchment-50 text-espresso-600 border-parchment-200 hover:border-amber-400'
            }`}
          >
            <User className="h-5 w-5" /><span>Par Nom</span>
          </button>
        </div>

        {searchMode === 'code' ? (
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
                placeholder="Ex: AB12"
                className="w-full px-4 py-4 text-3xl text-center border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 transition-colors tracking-[0.2em] font-mono uppercase bg-parchment-50 text-espresso-900 font-bold placeholder-parchment-300"
                maxLength={4}
              />
            </div>
            <button type="submit" disabled={searchCode.length !== 4 || isSearching} className="px-8 py-4 bg-espresso-900 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-espresso-800 transition-colors disabled:opacity-50 shadow-md sm:w-auto">
              {isSearching ? '...' : 'Rechercher'}
            </button>
          </form>
        ) : searchMode === 'school' ? (
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <input
                  type="text"
                  value={schoolSearch.ecole}
                  onChange={(e) => {
                    setSchoolSearch(p => ({ ...p, ecole: e.target.value }))
                    setFilteredEcoles(ecoles.filter(ec => ec.toLowerCase().includes(e.target.value.toLowerCase())))
                    setShowEcoleDropdown(true)
                  }}
                  onFocus={() => setShowEcoleDropdown(true)}
                  onBlur={() => setTimeout(() => setShowEcoleDropdown(false), 200)}
                  placeholder="Nom de l'école"
                  className="w-full px-4 py-3.5 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 bg-parchment-50 text-espresso-900 font-medium"
                />
                {showEcoleDropdown && filteredEcoles.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-parchment-300 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredEcoles.map(e => (
                      <button key={e} type="button" onClick={() => { setSchoolSearch(p => ({ ...p, ecole: e })); setShowEcoleDropdown(false); }} className="w-full px-4 py-3 text-left hover:bg-parchment-100 border-b border-parchment-100 font-medium">{e}</button>
                    ))}
                  </div>
                )}
              </div>
              <select
                value={schoolSearch.niveau}
                onChange={(e) => setSchoolSearch(prev => ({ ...prev, niveau: e.target.value }))}
                className="w-full px-4 py-3.5 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 bg-parchment-50 text-espresso-900 font-medium"
              >
                <option value="">Sélectionnez un niveau</option>
                {['PS','MS','GS','CP','CE1','CE2','CM1','CM2','CE6','CE7','CE8','CE9','TC','1BAC','2BAC'].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <button type="submit" disabled={!schoolSearch.ecole || !schoolSearch.niveau || isSearching} className="w-full px-6 py-4 bg-espresso-900 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-espresso-800 transition-colors disabled:opacity-50 shadow-md">
              {isSearching ? '...' : 'Rechercher'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={nameSearch}
                onChange={(e) => {
                  setNameSearch(e.target.value)
                  setFilteredNames(Array.from(new Set(allOrders.map(o => o.nom.trim()))).filter(n => n.toLowerCase().includes(e.target.value.toLowerCase())).sort())
                  setShowNameDropdown(true)
                }}
                onFocus={() => setShowNameDropdown(true)}
                onBlur={() => setTimeout(() => setShowNameDropdown(false), 200)}
                placeholder="Nom du client"
                className="w-full px-4 py-3.5 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 bg-parchment-50 text-espresso-900 font-medium"
              />
              {showNameDropdown && filteredNames.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-parchment-300 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredNames.map(n => (
                    <button key={n} type="button" onClick={() => { setNameSearch(n); setShowNameDropdown(false); }} className="w-full px-4 py-3 text-left hover:bg-parchment-100 border-b border-parchment-100 font-medium">{n}</button>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" disabled={!nameSearch.trim() || isSearching} className="w-full px-6 py-4 bg-espresso-900 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-espresso-800 transition-colors disabled:opacity-50 shadow-md">
              {isSearching ? '...' : 'Rechercher'}
            </button>
          </form>
        )}
      </div>

      {notFound && (
        <div className="bg-white rounded-3xl shadow-book border border-parchment-300 p-10 text-center">
          <X className="h-12 w-12 text-terracotta-500 mx-auto mb-4 opacity-50" />
          <h3 className="text-2xl font-heading font-bold text-espresso-900 mb-2">Aucun résultat</h3>
          <p className="text-espresso-600">Vérifiez vos critères de recherche.</p>
        </div>
      )}

      {(bookList || schoolResults.length > 0 || nameResults.length > 0) && (
        <div className="space-y-6">
          {(bookList ? [bookList] : nameResults.length > 0 ? nameResults : schoolResults).map((order) => (
            <div key={order.id} className="bg-white rounded-3xl shadow-book border border-parchment-300 overflow-hidden">
              <div className={`px-8 py-6 border-b border-parchment-300 ${order.liste_prete ? 'bg-green-50' : 'bg-amber-50'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-espresso-500 block mb-1">Code Commande</span>
                    <span className="text-3xl font-mono font-bold text-espresso-900 tracking-wider">#{order.code}</span>
                  </div>
                  <div className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-widest border ${
                    order.liste_prete ? 'bg-green-100 text-green-800 border-green-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}>
                    {order.liste_prete ? <Check className="w-4 h-4 mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
                    {order.liste_prete ? 'Prête' : 'En attente'}
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-widest text-espresso-500 mb-1">Client</span>
                    <span className="text-lg font-bold text-espresso-900">{order.nom}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-widest text-espresso-500 mb-1">Date</span>
                    <span className="text-lg font-medium text-espresso-900">{new Date(order.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-widest text-espresso-500 mb-1">École</span>
                    <span className="text-lg font-medium text-espresso-900">{order.ecole}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-widest text-espresso-500 mb-1">Niveau</span>
                    <span className="text-lg font-medium text-espresso-900">{order.niveau}</span>
                  </div>
                  {order.avance != null && (
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-widest text-espresso-500 mb-1">Avance versée</span>
                      <span className="text-lg font-bold text-green-700">{order.avance} DHS</span>
                    </div>
                  )}
                </div>

                {order.liste_prete && (order.rangee || order.niveau_rangement) && (
                  <div className="mt-6 p-5 bg-espresso-50 border border-espresso-200 rounded-2xl flex flex-col sm:flex-row gap-6">
                    <div className="flex-1">
                      <span className="block text-xs font-bold uppercase tracking-widest text-espresso-500 mb-1">Rangée</span>
                      <span className="text-2xl font-bold text-espresso-900">{order.rangee || '—'}</span>
                    </div>
                    <div className="flex-1">
                      <span className="block text-xs font-bold uppercase tracking-widest text-espresso-500 mb-1">Niveau de rangement</span>
                      <span className="text-2xl font-bold text-espresso-900">{order.niveau_rangement || '—'}</span>
                    </div>
                  </div>
                )}

                {order.liste_prete && (
                  <div className="mt-6 pt-6 border-t border-parchment-200 text-center">
                    <p className="text-lg font-bold text-green-700 bg-green-50 p-4 rounded-xl border border-green-200">
                      🎉 Votre liste est prête ! Vous pouvez passer la récupérer.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FollowUp