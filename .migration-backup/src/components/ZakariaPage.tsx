import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Trash2, Eye, EyeOff, Users, Shield, RefreshCw, AlertCircle } from 'lucide-react'

interface PortalUser {
  id: string
  space: 'espace_client' | 'espace_adjoint'
  username: string
  email: string
  password: string
  role: 'admin' | 'user' | 'couverture'
  active: boolean
  created_at: string
}

interface ZakariaPageProps {
  onNavigate: (page: 'espace-client') => void
}

const EMPTY_FORM = {
  space: 'espace_client' as 'espace_client' | 'espace_adjoint',
  username: '',
  email: '',
  password: '',
  role: 'user' as 'admin' | 'user' | 'couverture',
  active: true,
}

function ZakariaPage({ onNavigate }: ZakariaPageProps) {
  const [users, setUsers] = useState<PortalUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())
  const [spaceFilter, setSpaceFilter] = useState<'all' | 'espace_client' | 'espace_adjoint'>('all')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setIsLoading(true)
    setError('')
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (err: any) {
      setError('Erreur lors du chargement des utilisateurs.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase.from('users').insert([
        {
          space: form.space,
          username: form.username.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          role: form.role,
          active: form.active,
        },
      ])

      if (error) throw error

      setSuccess('Utilisateur ajouté avec succès.')
      setForm(EMPTY_FORM)
      setShowForm(false)
      await loadUsers()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'ajout.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (user: PortalUser) => {
    setError('')
    try {
      const { error } = await supabase
        .from('users')
        .update({ active: !user.active, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) throw error
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: !u.active } : u))
    } catch (err: any) {
      setError('Erreur lors de la mise à jour.')
    }
  }

  const handleDelete = async (id: string) => {
    setError('')
    try {
      const { error } = await supabase.from('users').delete().eq('id', id)
      if (error) throw error
      setUsers(prev => prev.filter(u => u.id !== id))
      setDeleteConfirmId(null)
      setSuccess('Utilisateur supprimé.')
    } catch (err: any) {
      setError('Erreur lors de la suppression.')
    }
  }

  const toggleReveal = (id: string) => {
    setRevealedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filtered = spaceFilter === 'all' ? users : users.filter(u => u.space === spaceFilter)

  const spaceLabel = (space: string) =>
    space === 'espace_client' ? 'Espace Client' : 'Espace Adjoint'

  const spaceColor = (space: string) =>
    space === 'espace_client'
      ? 'bg-blue-100 text-blue-800 border border-blue-200'
      : 'bg-teal-100 text-teal-800 border border-teal-200'

  const roleColor = (role: string) => {
    if (role === 'admin') return 'bg-amber-100 text-amber-800'
    if (role === 'couverture') return 'bg-orange-100 text-orange-800'
    return 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-2">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={() => onNavigate('espace-client')}
          className="px-4 py-2 bg-blue-200 text-blue-900 rounded-lg font-medium hover:bg-blue-300 transition-colors"
        >
          Retour a l'Espace Client
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-900 rounded-2xl mb-4 shadow-lg">
          <Shield className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
          Gestion des Acces
        </h1>
        <p className="text-gray-600 text-sm md:text-base">
          Ajoutez et gerez les identifiants de connexion pour chaque espace
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 flex items-start space-x-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        {/* Space filter tabs */}
        <div className="flex rounded-xl overflow-hidden border border-gray-300 bg-white shadow-sm">
          {(['all', 'espace_client', 'espace_adjoint'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSpaceFilter(s)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                spaceFilter === s
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {s === 'all' ? 'Tous' : spaceLabel(s)}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadUsers}
            className="p-2 rounded-lg bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors shadow-sm"
            title="Actualiser"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setShowForm(true); setSuccess('') }}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter</span>
          </button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center space-x-2">
            <Plus className="h-5 w-5 text-gray-600" />
            <span>Nouvel utilisateur</span>
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Space */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Espace destine
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['espace_client', 'espace_adjoint'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, space: s }))}
                    className={`py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all ${
                      form.space === s
                        ? s === 'espace_client'
                          ? 'border-blue-500 bg-blue-50 text-blue-800'
                          : 'border-teal-500 bg-teal-50 text-teal-800'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <Users className="h-4 w-4 inline mr-2" />
                    {spaceLabel(s)}
                  </button>
                ))}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nom d'affichage
              </label>
              <input
                type="text"
                required
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="Ex: Jean Dupont"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email (identifiant)
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="jean.dupont@exemple.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                type="text"
                required
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Mot de passe"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 font-mono"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Role
              </label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value as typeof form.role }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50"
              >
                <option value="user">Utilisateur</option>
                <option value="admin">Admin</option>
                <option value="couverture">Couverture</option>
              </select>
            </div>

            {/* Active toggle */}
            <div className="sm:col-span-2 flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  form.active ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
                    form.active ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-gray-700">
                Compte {form.active ? 'actif' : 'desactive'}
              </span>
            </div>

            {/* Actions */}
            <div className="sm:col-span-2 flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Enregistrer</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users table */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-500" />
            <span>Utilisateurs ({filtered.length})</span>
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun utilisateur trouve</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Espace
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Mot de passe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{user.username || '—'}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${spaceColor(user.space)}`}>
                        {spaceLabel(user.space)}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-gray-800 text-xs">
                          {revealedIds.has(user.id) ? user.password : '••••••••'}
                        </span>
                        <button
                          onClick={() => toggleReveal(user.id)}
                          className="text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          {revealedIds.has(user.id)
                            ? <EyeOff className="h-4 w-4" />
                            : <Eye className="h-4 w-4" />
                          }
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${roleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                          user.active ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow ${
                            user.active ? 'translate-x-4.5' : 'translate-x-1'
                          }`}
                          style={{ transform: user.active ? 'translateX(18px)' : 'translateX(2px)' }}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {deleteConfirmId === user.id ? (
                        <div className="flex items-center justify-end space-x-2">
                          <span className="text-xs text-gray-600">Confirmer ?</span>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="px-2.5 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Oui
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2.5 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            Non
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(user.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
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

export default ZakariaPage
