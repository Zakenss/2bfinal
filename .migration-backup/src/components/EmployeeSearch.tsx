import React, { useState } from 'react'
import { Search, Package, Check, X, LogIn } from 'lucide-react'
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
        // Refresh the data
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

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Search className="h-12 w-12 text-blue-900 mx-auto mb-4" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Espace Adjoint
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Connectez-vous pour accéder à la recherche de commandes
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-900 mb-2">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  id="username"
                  required
                  value={authForm.username}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="votre.nom"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                  Mot de passe
                </label>
                <input
                  type="password"
                  id="password"
                  required
                  value={authForm.password}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>

              {authError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-900 text-sm">{authError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-blue-800 text-white py-3 md:py-4 px-6 rounded-lg font-semibold hover:bg-blue-900 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm md:text-base"
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
            
            <div className="mt-6 text-center">
              <button
                onClick={handleBackToHome}
                className="text-blue-800 hover:text-blue-900 font-medium text-sm underline"
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
    <div className="max-w-4xl mx-auto px-4">
      {/* Header with employee info and logout */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-800">
          Connecté en tant que: <span className="font-semibold text-blue-800">{currentEmployee}</span>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-200 text-red-900 rounded-lg font-medium hover:bg-red-300 transition-colors text-sm"
        >
          Se déconnecter
        </button>
      </div>

      <div className="text-center mb-8">
        <Search className="h-12 w-12 text-gray-900 mx-auto mb-4" />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Recherche Adjoint
        </h1>
        <p className="text-sm md:text-base text-gray-800">
          Entrez le code à 4 caractères pour vérifier le statut d'une commande
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchCode}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
                setSearchCode(value)
              }}
              placeholder="Code format: AB12"
              className="w-full px-4 py-3 text-2xl text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all tracking-wider font-mono uppercase"
              maxLength={4}
            />
          </div>
          <button
            type="submit"
            disabled={searchCode.length !== 4 || isSearching}
            className="px-6 py-3 bg-blue-800 text-white rounded-lg font-semibold hover:bg-blue-900 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base w-full sm:w-auto"
          >
            {isSearching ? 'Recherche...' : 'Rechercher'}
          </button>
        </form>
      </div>

      {/* Not Found Message */}
      {notFound && (
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 text-center">
          <Search className="h-12 w-12 text-gray-900 mx-auto mb-4" />
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
            Code non trouvé
          </h3>
          <p className="text-sm md:text-base text-gray-800">
            Aucune commande trouvée avec ce code. Vérifiez le code et réessayez.
          </p>
        </div>
      )}

      {/* Book List Details */}
      {bookList && (
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Package className="h-8 w-8 text-gray-900" />
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Commande #{bookList.code}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div>
                <span className="text-sm font-semibold text-gray-700">Nom:</span>
                <p className="text-lg text-gray-900">{bookList.nom}</p>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-700">École:</span>
                <p className="text-lg text-gray-900">{bookList.ecole}</p>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-700">Niveau:</span>
                <p className="text-lg text-gray-900">{bookList.niveau}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-sm font-semibold text-gray-700">Email:</span>
                <p className="text-lg text-gray-900">{bookList.email}</p>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-700">Téléphone:</span>
                <p className="text-lg text-gray-900">{bookList.telephone}</p>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-700">Date de commande:</span>
                <p className="text-lg text-gray-900">
                  {new Date(bookList.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </div>

          {/* Status Update Form */}
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-6">
              Mettre à jour le statut
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-4">
                  Liste prête:
                </label>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={() => setUpdateForm(prev => ({ ...prev, liste_prete: true }))}
                    className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                      updateForm.liste_prete
                        ? 'bg-green-700 text-white shadow-md'
                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    }`}
                  >
                    <Check className="h-5 w-5" />
                    <span>Oui</span>
                  </button>
                  <button
                    onClick={() => setUpdateForm(prev => ({ ...prev, liste_prete: false }))}
                    className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                      !updateForm.liste_prete
                        ? 'bg-red-700 text-white shadow-md'
                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    }`}
                  >
                    <X className="h-5 w-5" />
                    <span>Non</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="rangee" className="block text-sm font-semibold text-gray-900 mb-2">
                    Rangée:
                  </label>
                  <select
                    id="rangee"
                    value={updateForm.rangee}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, rangee: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Sélectionner</option>
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(letter => (
                      <option key={letter} value={letter}>{letter}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="niveau_rangement" className="block text-sm font-semibold text-gray-900 mb-2">
                    Niveau:
                  </label>
                  <select
                    id="niveau_rangement"
                    value={updateForm.niveau_rangement}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, niveau_rangement: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="w-full bg-blue-800 text-white py-3 md:py-4 px-6 rounded-lg font-semibold hover:bg-blue-900 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
              >
                {isUpdating ? 'Mise à jour...' : 'Mettre à jour'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeeSearch