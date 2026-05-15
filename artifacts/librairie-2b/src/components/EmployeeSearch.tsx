import React, { useState } from 'react'
import { Search, Package, Check, X, LogIn, Clock } from 'lucide-react'
import { supabase, Student } from '../lib/supabase'

interface EmployeeCredentials {
  username: string
  password: string
  name: string
}

const EMPLOYEE_CREDENTIALS: EmployeeCredentials[] = []

function EmployeeSearch() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authForm, setAuthForm] = useState({ username: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [currentEmployee, setCurrentEmployee] = useState<string>('')
  const [searchCode, setSearchCode] = useState('')
  const [bookList, setBookList] = useState<Student | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateForm, setUpdateForm] = useState({
    liste_prete: false,
    rangee: '',
    niveau_rangement: '1',
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)
    setAuthError('')

    const employee = EMPLOYEE_CREDENTIALS.find(
      emp => emp.username === authForm.username && emp.password === authForm.password
    )

    if (employee) {
      setIsAuthenticated(true)
      setCurrentEmployee(employee.name)
    } else {
      setAuthError('Nom d\'utilisateur ou mot de passe incorrect')
    }
    
    setIsLoggingIn(false)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentEmployee('')
    setAuthForm({ username: '', password: '' })
    setSearchCode('')
    setBookList(null)
    setNotFound(false)
  }

  const handleBackToHome = () => {
    window.location.reload()
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (searchCode.length !== 4) return

    setIsSearching(true)
    setNotFound(false)
    setBookList(null)

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
        setUpdateForm({
          liste_prete: data.liste_prete ?? false,
          rangee: data.rangee || '',
          niveau_rangement: data.niveau_rangement || '1',
        })
      }
    } catch (error) {
      console.error('Error searching:', error)
      setNotFound(true)
    } finally {
      setIsSearching(false)
    }
  }

  const handleUpdate = async () => {
    if (!bookList) return

    setIsUpdating(true)

    try {
      const { error } = await supabase
        .from('students')
        .update({
          liste_prete: updateForm.liste_prete,
          rangee: updateForm.rangee,
          niveau_rangement: updateForm.niveau_rangement,
          modified_by: currentEmployee,
          modified_at: new Date().toISOString(),
        })
        .eq('id', bookList.id)

      if (!error) {
        const { data } = await supabase
          .from('students')
          .select('*')
          .eq('id', bookList.id)
          .single()

        if (data) {
          setBookList(data)
        }
      }
    } catch (error) {
      console.error('Error updating:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-parchment-100 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
        <div className="absolute inset-0 bg-gradient-to-b from-parchment-100/30 to-parchment-200/90 pointer-events-none" />
        <div className="max-w-md w-full relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-espresso-900 rounded-full mb-6 shadow-lg border-4 border-parchment-100">
              <Search className="h-10 w-10 text-parchment-100" />
            </div>
            <h1 className="text-4xl font-heading font-bold text-espresso-900 mb-3">
              Espace Collaborateur
            </h1>
            <p className="text-base text-espresso-600 font-medium">
              Connectez-vous pour gérer les commandes
            </p>
          </div>

          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-book p-8 md:p-10 border border-parchment-300">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-bold tracking-wide text-espresso-800 uppercase mb-2">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  id="username"
                  required
                  value={authForm.username}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-3.5 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 transition-colors bg-parchment-50 text-espresso-900 placeholder-espresso-300 font-medium"
                  placeholder="votre.nom"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-bold tracking-wide text-espresso-800 uppercase mb-2">
                  Mot de passe
                </label>
                <input
                  type="password"
                  id="password"
                  required
                  value={authForm.password}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3.5 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 transition-colors bg-parchment-50 text-espresso-900 placeholder-espresso-300 font-medium"
                  placeholder="••••••••"
                />
              </div>

              {authError && (
                <div className="bg-terracotta-500/10 border border-terracotta-500/20 rounded-xl p-4">
                  <p className="text-terracotta-700 text-sm font-medium">{authError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-espresso-900 text-white py-4 px-6 rounded-xl font-bold tracking-wide hover:bg-espresso-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-md mt-2 uppercase text-sm"
              >
                {isLoggingIn ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    <span>Se connecter</span>
                  </>
                )}
              </button>
            </form>
            
            <div className="mt-8 text-center pt-6 border-t border-parchment-200">
              <button
                onClick={handleBackToHome}
                className="text-espresso-500 hover:text-amber-700 font-semibold text-sm transition-colors"
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white rounded-xl shadow-sm border border-parchment-300 p-4 mb-8">
        <div className="text-sm text-espresso-700 font-medium mb-4 sm:mb-0">
          Connecté: <span className="font-bold text-espresso-900 ml-1">{currentEmployee}</span>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-parchment-200 text-espresso-800 rounded-lg font-bold tracking-wide hover:bg-parchment-300 transition-colors text-xs uppercase"
        >
          Se déconnecter
        </button>
      </div>

      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-4 bg-espresso-900 rounded-full mb-6 shadow-md">
          <Search className="h-8 w-8 text-parchment-100" />
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-espresso-900 mb-4">
          Recherche Collaborateur
        </h1>
        <p className="text-lg text-espresso-600 font-medium">
          Entrez le code à 4 caractères pour mettre à jour une commande.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-book border border-parchment-300 p-8 md:p-10 mb-8">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchCode}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
                setSearchCode(value)
              }}
              placeholder="Ex: AB12"
              className="w-full px-4 py-4 text-3xl text-center border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 transition-colors tracking-[0.2em] font-mono uppercase bg-parchment-50 text-espresso-900 font-bold placeholder-parchment-300"
              maxLength={4}
            />
          </div>
          <button
            type="submit"
            disabled={searchCode.length !== 4 || isSearching}
            className="px-8 py-4 bg-amber-600 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base w-full sm:w-auto shadow-md"
          >
            {isSearching ? 'Recherche...' : 'Rechercher'}
          </button>
        </form>
      </div>

      {notFound && (
        <div className="bg-white rounded-3xl shadow-book border border-parchment-300 p-10 text-center">
          <Search className="h-12 w-12 text-terracotta-500 mx-auto mb-4 opacity-50" />
          <h3 className="text-2xl font-heading font-bold text-espresso-900 mb-2">
            Code introuvable
          </h3>
          <p className="text-espresso-600">
            Aucune commande ne correspond à ce code. Vérifiez la saisie.
          </p>
        </div>
      )}

      {bookList && (
        <div className="bg-white rounded-3xl shadow-book border border-parchment-300 overflow-hidden">
          <div className="bg-parchment-200 border-b border-parchment-300 px-8 py-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="h-6 w-6 text-amber-700" />
              <h2 className="text-2xl font-heading font-bold text-espresso-900">
                Commande <span className="font-mono tracking-wider ml-1">#{bookList.code}</span>
              </h2>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest border ${
              bookList.liste_prete ? 'bg-green-100 text-green-800 border-green-200' : 'bg-amber-100 text-amber-800 border-amber-200'
            }`}>
              {bookList.liste_prete ? 'Prête' : 'En attente'}
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-10">
              <div>
                <span className="block text-xs font-bold text-espresso-500 uppercase tracking-widest mb-1">Client</span>
                <p className="text-lg font-bold text-espresso-900">{bookList.nom}</p>
              </div>
              <div>
                <span className="block text-xs font-bold text-espresso-500 uppercase tracking-widest mb-1">Date</span>
                <p className="text-lg font-medium text-espresso-900">
                  {new Date(bookList.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <span className="block text-xs font-bold text-espresso-500 uppercase tracking-widest mb-1">École</span>
                <p className="text-lg font-medium text-espresso-900">{bookList.ecole}</p>
              </div>
              <div>
                <span className="block text-xs font-bold text-espresso-500 uppercase tracking-widest mb-1">Niveau</span>
                <p className="text-lg font-medium text-espresso-900">{bookList.niveau}</p>
              </div>
              {(bookList.email || bookList.telephone) && (
                <div className="md:col-span-2 border-t border-parchment-200 pt-4 mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bookList.email && (
                      <div>
                        <span className="block text-xs font-bold text-espresso-500 uppercase tracking-widest mb-1">Email</span>
                        <p className="text-base text-espresso-800">{bookList.email}</p>
                      </div>
                    )}
                    {bookList.telephone && (
                      <div>
                        <span className="block text-xs font-bold text-espresso-500 uppercase tracking-widest mb-1">Téléphone</span>
                        <p className="text-base text-espresso-800">{bookList.telephone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-parchment-50 rounded-2xl p-6 border border-parchment-200">
              <h3 className="text-sm font-bold uppercase tracking-widest text-espresso-800 mb-6 flex items-center border-b border-parchment-200 pb-3">
                <Check className="h-4 w-4 mr-2 text-amber-600" />
                Mise à jour du statut
              </h3>

              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-espresso-800 mb-3">
                    La liste est-elle prête ?
                  </label>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setUpdateForm(prev => ({ ...prev, liste_prete: true }))}
                      className={`flex-1 flex items-center justify-center space-x-2 py-4 rounded-xl font-bold uppercase tracking-wide transition-all border-2 ${
                        updateForm.liste_prete
                          ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                          : 'bg-white text-espresso-600 border-parchment-300 hover:border-amber-400'
                      }`}
                    >
                      <Check className="h-5 w-5" />
                      <span>Oui, prête</span>
                    </button>
                    <button
                      onClick={() => setUpdateForm(prev => ({ ...prev, liste_prete: false }))}
                      className={`flex-1 flex items-center justify-center space-x-2 py-4 rounded-xl font-bold uppercase tracking-wide transition-all border-2 ${
                        !updateForm.liste_prete
                          ? 'bg-espresso-800 text-white border-espresso-800 shadow-md'
                          : 'bg-white text-espresso-600 border-parchment-300 hover:border-espresso-400'
                      }`}
                    >
                      <Clock className="h-5 w-5" />
                      <span>En attente</span>
                    </button>
                  </div>
                </div>

                {updateForm.liste_prete && (
                  <div className="grid grid-cols-2 gap-6 p-5 bg-white rounded-xl border border-parchment-200 shadow-sm">
                    <div>
                      <label htmlFor="rangee" className="block text-xs font-bold text-espresso-500 uppercase tracking-widest mb-2">
                        Rangée
                      </label>
                      <select
                        id="rangee"
                        value={updateForm.rangee}
                        onChange={(e) => setUpdateForm(prev => ({ ...prev, rangee: e.target.value }))}
                        className="w-full px-4 py-3 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 transition-colors bg-parchment-50 text-espresso-900 font-bold"
                      >
                        <option value="">-</option>
                        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(letter => (
                          <option key={letter} value={letter}>{letter}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="niveau_rangement" className="block text-xs font-bold text-espresso-500 uppercase tracking-widest mb-2">
                        Étagère
                      </label>
                      <select
                        id="niveau_rangement"
                        value={updateForm.niveau_rangement}
                        onChange={(e) => setUpdateForm(prev => ({ ...prev, niveau_rangement: e.target.value }))}
                        className="w-full px-4 py-3 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 transition-colors bg-parchment-50 text-espresso-900 font-bold"
                      >
                        {[1, 2, 3, 4, 5, 6].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="w-full bg-espresso-900 text-white py-4 px-6 rounded-xl font-bold uppercase tracking-wider hover:bg-espresso-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center space-x-2"
                >
                  {isUpdating ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <span>Mettre à jour le statut</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeeSearch