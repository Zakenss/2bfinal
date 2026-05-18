import React, { useState } from 'react'
import { Search, Package, Check, Clock, LogIn, AlertCircle, MapPin, Layers, User, Phone, Mail, Calendar, School } from 'lucide-react'
import { supabase, Student } from '../lib/supabase'

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
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [updateForm, setUpdateForm] = useState({
    liste_prete: false,
    rangee: '',
    niveau_rangement: '',
  })

  const canSubmit =
    updateForm.liste_prete === true &&
    updateForm.rangee !== '' &&
    updateForm.niveau_rangement !== ''

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)
    setAuthError('')
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username, password, active')
        .eq('username', authForm.username.trim())
        .eq('space', 'espace_adjoint')
        .maybeSingle()
      if (error) throw error
      if (data && data.active && data.password === authForm.password) {
        setIsAuthenticated(true)
        setCurrentEmployee(data.username)
      } else {
        setAuthError("Nom d'utilisateur ou mot de passe incorrect")
      }
    } catch {
      setAuthError('Erreur de connexion. Veuillez réessayer.')
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
    setUpdateSuccess(false)
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (searchCode.length !== 4) return
    setIsSearching(true)
    setNotFound(false)
    setBookList(null)
    setUpdateSuccess(false)
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
          niveau_rangement: data.niveau_rangement || '',
        })
      }
    } catch {
      setNotFound(true)
    } finally {
      setIsSearching(false)
    }
  }

  const handleUpdate = async () => {
    if (!bookList || !canSubmit) return
    setIsUpdating(true)
    setUpdateSuccess(false)
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
        if (data) setBookList(data)
        setUpdateSuccess(true)
      }
    } catch (err) {
      console.error('Error updating:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-parchment-100">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-espresso-900 rounded-2xl mb-5 shadow-lg">
              <Search className="h-8 w-8 text-parchment-100" />
            </div>
            <h1 className="text-3xl font-heading font-bold text-espresso-900 mb-2">Espace Collaborateur</h1>
            <p className="text-espresso-600 text-sm font-medium">Connectez-vous pour gérer les commandes</p>
          </div>

          <div className="bg-white rounded-2xl shadow-book p-8 border border-parchment-200">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold tracking-widest text-espresso-500 uppercase mb-2">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  required
                  value={authForm.username}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 transition-colors bg-parchment-50 text-espresso-900 font-medium"
                  placeholder="votre.nom"
                />
              </div>
              <div>
                <label className="block text-xs font-bold tracking-widest text-espresso-500 uppercase mb-2">
                  Mot de passe
                </label>
                <input
                  type="password"
                  required
                  value={authForm.password}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 transition-colors bg-parchment-50 text-espresso-900 font-medium"
                  placeholder="••••••••"
                />
              </div>

              {authError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-red-700 text-sm">{authError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-espresso-900 text-white py-3.5 rounded-xl font-bold uppercase tracking-wider hover:bg-espresso-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md text-sm mt-2"
              >
                {isLoggingIn
                  ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  : <><LogIn className="h-4 w-4" /> Se connecter</>}
              </button>
            </form>
            <div className="mt-6 text-center border-t border-parchment-200 pt-5">
              <button onClick={() => window.location.reload()} className="text-espresso-500 hover:text-amber-700 text-sm font-semibold transition-colors">
                ← Retour à l'accueil
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-16">

      {/* Top bar */}
      <div className="flex items-center justify-between py-4 mb-8 border-b border-parchment-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-espresso-900 rounded-lg flex items-center justify-center">
            <User className="h-4 w-4 text-parchment-100" />
          </div>
          <div>
            <p className="text-xs text-espresso-500 font-medium uppercase tracking-widest">Connecté</p>
            <p className="text-sm font-bold text-espresso-900">{currentEmployee}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-parchment-200 text-espresso-700 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-parchment-300 transition-colors"
        >
          Se déconnecter
        </button>
      </div>

      {/* Page title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-espresso-900 rounded-2xl mb-4 shadow-md">
          <Search className="h-7 w-7 text-parchment-100" />
        </div>
        <h1 className="text-3xl font-heading font-bold text-espresso-900 mb-1">Recherche Commande</h1>
        <p className="text-espresso-500 text-sm font-medium">Entrez le code à 4 caractères</p>
      </div>

      {/* Search box */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <input
          type="text"
          value={searchCode}
          onChange={(e) => {
            setSearchCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))
            setNotFound(false)
          }}
          placeholder="EX: AB12"
          maxLength={4}
          className="flex-1 px-5 py-4 text-2xl text-center border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 transition-colors tracking-[0.3em] font-mono font-bold uppercase bg-white text-espresso-900 placeholder-parchment-300 shadow-sm"
        />
        <button
          type="submit"
          disabled={searchCode.length !== 4 || isSearching}
          className="px-6 py-4 bg-amber-600 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm shadow-md whitespace-nowrap"
        >
          {isSearching ? 'Recherche…' : 'Rechercher'}
        </button>
      </form>

      {/* Not found */}
      {notFound && (
        <div className="bg-white rounded-2xl border border-parchment-200 shadow-sm p-10 text-center">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-7 w-7 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-espresso-900 mb-1">Code introuvable</h3>
          <p className="text-espresso-500 text-sm">Aucune commande ne correspond à <span className="font-mono font-bold">{searchCode}</span>. Vérifiez la saisie.</p>
        </div>
      )}

      {/* Order card */}
      {bookList && (
        <div className="space-y-4">

          {/* Order header */}
          <div className={`rounded-2xl border-2 overflow-hidden shadow-sm ${bookList.liste_prete ? 'border-green-200' : 'border-amber-200'}`}>
            <div className={`flex items-center justify-between px-6 py-4 ${bookList.liste_prete ? 'bg-green-50' : 'bg-amber-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bookList.liste_prete ? 'bg-green-600' : 'bg-amber-500'}`}>
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-espresso-500">Commande</p>
                  <p className="text-lg font-mono font-black text-espresso-900 tracking-widest">#{bookList.code}</p>
                </div>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                bookList.liste_prete
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {bookList.liste_prete ? '✓ Prête' : '⏳ En attente'}
              </span>
            </div>

            {/* Order details */}
            <div className="bg-white px-6 py-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-espresso-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-espresso-400 uppercase tracking-widest mb-0.5">Client</p>
                    <p className="text-sm font-bold text-espresso-900">{bookList.nom}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-espresso-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-espresso-400 uppercase tracking-widest mb-0.5">Date</p>
                    <p className="text-sm font-medium text-espresso-900">
                      {new Date(bookList.created_at ?? '').toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <School className="h-4 w-4 text-espresso-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-espresso-400 uppercase tracking-widest mb-0.5">École</p>
                    <p className="text-sm font-medium text-espresso-900">{bookList.ecole}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Layers className="h-4 w-4 text-espresso-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-espresso-400 uppercase tracking-widest mb-0.5">Niveau</p>
                    <p className="text-sm font-medium text-espresso-900">{bookList.niveau}</p>
                  </div>
                </div>
                {bookList.telephone && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 text-espresso-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-espresso-400 uppercase tracking-widest mb-0.5">Téléphone</p>
                      <p className="text-sm font-medium text-espresso-900">{bookList.telephone}</p>
                    </div>
                  </div>
                )}
                {bookList.email && (
                  <div className="flex items-start gap-2 col-span-2">
                    <Mail className="h-4 w-4 text-espresso-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-espresso-400 uppercase tracking-widest mb-0.5">Email</p>
                      <p className="text-sm font-medium text-espresso-900">{bookList.email}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Location badge if already placed */}
              {bookList.liste_prete && bookList.rangee && bookList.niveau_rangement && (
                <div className="mt-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                  <MapPin className="h-4 w-4 text-green-600 shrink-0" />
                  <p className="text-sm text-green-800 font-medium">
                    Rangée <strong>{bookList.rangee}</strong> · Étagère <strong>{bookList.niveau_rangement}</strong>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Update form */}
          <div className="bg-white rounded-2xl border border-parchment-200 shadow-sm overflow-hidden">
            <div className="bg-parchment-100 border-b border-parchment-200 px-6 py-4 flex items-center gap-2">
              <Check className="h-4 w-4 text-amber-700" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-espresso-800">Mise à jour du statut</h3>
            </div>

            <div className="p-6 space-y-6">

              {/* Liste prête toggle */}
              <div>
                <label className="block text-xs font-bold text-espresso-500 uppercase tracking-widest mb-3">
                  La liste est-elle prête ? <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUpdateForm(prev => ({ ...prev, liste_prete: true }))}
                    className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wide transition-all border-2 ${
                      updateForm.liste_prete
                        ? 'bg-green-600 text-white border-green-600 shadow-md'
                        : 'bg-white text-espresso-500 border-parchment-300 hover:border-green-400 hover:text-green-700'
                    }`}
                  >
                    <Check className="h-4 w-4" />
                    Oui, prête
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpdateForm(prev => ({ ...prev, liste_prete: false, rangee: '', niveau_rangement: '' }))}
                    className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wide transition-all border-2 ${
                      !updateForm.liste_prete
                        ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                        : 'bg-white text-espresso-500 border-parchment-300 hover:border-amber-400 hover:text-amber-700'
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                    En attente
                  </button>
                </div>
              </div>

              {/* Rangée + Étagère — only shown when liste_prete = true */}
              {updateForm.liste_prete && (
                <div className="rounded-xl border-2 border-dashed border-parchment-300 bg-parchment-50 p-4 space-y-4">
                  <p className="text-xs font-bold text-espresso-500 uppercase tracking-widest flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-amber-600" />
                    Emplacement de rangement <span className="text-red-500">*</span>
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-espresso-600 mb-2">
                        Rangée <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={updateForm.rangee}
                        onChange={(e) => setUpdateForm(prev => ({ ...prev, rangee: e.target.value }))}
                        className={`w-full px-3 py-3 border-2 rounded-xl focus:ring-0 focus:border-amber-500 transition-colors bg-white text-espresso-900 font-bold text-sm ${
                          updateForm.rangee === '' ? 'border-red-300 bg-red-50' : 'border-parchment-300'
                        }`}
                      >
                        <option value="">— Choisir —</option>
                        {['A','B','C','D','E','F','G','H'].map(l => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                      {updateForm.rangee === '' && (
                        <p className="text-red-500 text-xs mt-1 font-medium">Requis</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-espresso-600 mb-2">
                        Étagère <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={updateForm.niveau_rangement}
                        onChange={(e) => setUpdateForm(prev => ({ ...prev, niveau_rangement: e.target.value }))}
                        className={`w-full px-3 py-3 border-2 rounded-xl focus:ring-0 focus:border-amber-500 transition-colors bg-white text-espresso-900 font-bold text-sm ${
                          updateForm.niveau_rangement === '' ? 'border-red-300 bg-red-50' : 'border-parchment-300'
                        }`}
                      >
                        <option value="">— Choisir —</option>
                        {[1,2,3,4,5,6].map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                      {updateForm.niveau_rangement === '' && (
                        <p className="text-red-500 text-xs mt-1 font-medium">Requis</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Validation hint */}
              {!canSubmit && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800 font-medium leading-snug">
                    {!updateForm.liste_prete
                      ? 'Sélectionnez "Oui, prête" pour activer la mise à jour — puis choisissez la rangée et l\'étagère.'
                      : 'Choisissez la rangée et l\'étagère avant de confirmer.'}
                  </p>
                </div>
              )}

              {/* Success banner */}
              {updateSuccess && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                  <p className="text-sm text-green-800 font-semibold">Statut mis à jour avec succès !</p>
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleUpdate}
                disabled={isUpdating || !canSubmit}
                className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                  canSubmit
                    ? 'bg-espresso-900 text-white hover:bg-espresso-800 cursor-pointer'
                    : 'bg-parchment-300 text-espresso-400 cursor-not-allowed shadow-none'
                }`}
              >
                {isUpdating
                  ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  : <><Check className="h-4 w-4" /> Confirmer la mise à jour</>}
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

export default EmployeeSearch
