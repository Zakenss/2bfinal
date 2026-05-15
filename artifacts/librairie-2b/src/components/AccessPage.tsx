import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Trash2, Shield, RefreshCw } from 'lucide-react'

interface PortalUser {
  id: string
  space: 'espace_client' | 'espace_adjoint'
  username: string
  email?: string
  role?: string
  active: boolean
  created_at: string
}

interface AccessPageProps {
  onNavigate: (page: 'espace-client') => void
}

const EMPTY_FORM = {
  space: 'espace_client' as 'espace_client' | 'espace_adjoint',
  username: '',
  email: '',
  password: '',
  role: 'gerant' as 'gerant' | 'utilisateur',
  active: true,
}

const SPACE_LABELS: Record<string, string> = {
  espace_client: 'Espace Client',
  espace_adjoint: 'Espace Collaborateur',
}

function AccessPage({ onNavigate }: AccessPageProps) {
  const [users, setUsers] = useState<PortalUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [spaceFilter, setSpaceFilter] = useState<'all' | 'espace_client' | 'espace_adjoint'>('all')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  useEffect(() => { loadUsers() }, [])

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
    } catch {
      setError('Erreur lors du chargement des utilisateurs.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSpaceChange = (s: 'espace_client' | 'espace_adjoint') => {
    setForm({ ...EMPTY_FORM, space: s })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const isClient = form.space === 'espace_client'
    if (isClient && (!form.email.trim() || !form.password.trim())) return
    if (!isClient && !form.username.trim()) return
    setIsSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload: Record<string, unknown> = {
        space: form.space,
        active: form.active,
      }
      if (isClient) {
        payload.email = form.email.trim().toLowerCase()
        payload.username = form.email.trim().toLowerCase()
        payload.password = form.password
        payload.role = form.role
      } else {
        payload.username = form.username.trim()
        payload.email = form.username.trim()
        payload.password = ''
        payload.role = 'collaborateur'
      }
      const { error } = await supabase.from('users').insert([payload])
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
        .update({ active: !user.active })
        .eq('id', user.id)
      if (error) throw error
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: !u.active } : u))
    } catch {
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
    } catch {
      setError('Erreur lors de la suppression.')
    }
  }

  const filtered = spaceFilter === 'all' ? users : users.filter(u => u.space === spaceFilter)
  const isClientForm = form.space === 'espace_client'

  const roleLabel = (r?: string) => {
    if (r === 'utilisateur') return 'Utilisateur'
    if (r === 'gerant') return 'Gérant'
    if (r === 'collaborateur') return 'Collaborateur'
    return r || '—'
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12">
      <div className="mb-8">
        <button
          onClick={() => onNavigate('espace-client')}
          className="px-5 py-2 bg-white border border-parchment-300 text-espresso-800 rounded-full font-semibold hover:bg-parchment-200 transition-all shadow-sm text-sm uppercase tracking-wide"
        >
          ← Retour à l'Espace Client
        </button>
      </div>

      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-4 bg-espresso-900 rounded-full mb-6 shadow-md">
          <Shield className="h-8 w-8 text-parchment-100" />
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-espresso-900 mb-4">
          Gestion des Accès
        </h1>
        <p className="text-lg text-espresso-600 font-medium">
          Administration des identifiants et permissions.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-terracotta-50 border border-terracotta-200 text-terracotta-700 p-4 rounded-xl font-bold">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl font-bold">
          {success}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex bg-white rounded-xl shadow-sm border border-parchment-300 overflow-hidden">
          {(['all', 'espace_client', 'espace_adjoint'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSpaceFilter(s)}
              className={`px-6 py-3 text-sm font-bold uppercase tracking-widest transition-colors ${
                spaceFilter === s ? 'bg-espresso-900 text-white' : 'text-espresso-600 hover:bg-parchment-100'
              }`}
            >
              {s === 'all' ? 'Tous' : SPACE_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="flex gap-4">
          <button
            onClick={loadUsers}
            className="p-3 bg-white border border-parchment-300 rounded-xl shadow-sm hover:bg-parchment-100 text-espresso-900"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => { setShowForm(true); setSuccess('') }}
            className="flex items-center px-6 py-3 bg-amber-600 text-white font-bold uppercase tracking-widest rounded-xl shadow-md hover:bg-amber-700"
          >
            <Plus className="w-5 h-5 mr-2" /> Ajouter
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-3xl shadow-book border border-parchment-300 p-8 mb-10">
          <h2 className="text-xl font-heading font-bold text-espresso-900 mb-6">Nouvel Utilisateur</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-espresso-500 uppercase tracking-widest mb-3">
                Espace
              </label>
              <div className="flex gap-4">
                {(['espace_client', 'espace_adjoint'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSpaceChange(s)}
                    className={`flex-1 py-4 border-2 rounded-xl font-bold uppercase tracking-widest text-sm transition-all ${
                      form.space === s
                        ? 'border-amber-600 bg-amber-50 text-amber-800'
                        : 'border-parchment-300 bg-white text-espresso-600'
                    }`}
                  >
                    {SPACE_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {isClientForm ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-espresso-500 uppercase tracking-widest mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="ex: utilisateur@exemple.com"
                    className="w-full px-4 py-3 border-2 border-parchment-300 rounded-xl bg-parchment-50 font-medium text-espresso-900 focus:border-amber-500 focus:ring-0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-espresso-500 uppercase tracking-widest mb-2">
                    Mot de passe
                  </label>
                  <input
                    type="text"
                    required
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Mot de passe"
                    className="w-full px-4 py-3 border-2 border-parchment-300 rounded-xl bg-parchment-50 font-medium text-espresso-900 focus:border-amber-500 focus:ring-0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-espresso-500 uppercase tracking-widest mb-3">
                    Rôle
                  </label>
                  <div className="flex gap-4">
                    {(['utilisateur', 'gerant'] as const).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setForm({ ...form, role: r })}
                        className={`flex-1 py-4 border-2 rounded-xl font-bold uppercase tracking-widest text-sm transition-all ${
                          form.role === r
                            ? 'border-espresso-800 bg-espresso-50 text-espresso-900'
                            : 'border-parchment-300 bg-white text-espresso-500'
                        }`}
                      >
                        {r === 'utilisateur' ? 'Utilisateur' : 'Gérant'}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-espresso-400 font-medium">
                    Utilisateur : accès standard · Gérant : accès complet (Gestionnaire + Accès)
                  </p>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-bold text-espresso-500 uppercase tracking-widest mb-2">
                  Identifiant
                </label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder="Ex: marie.dupont"
                  className="w-full px-4 py-3 border-2 border-parchment-300 rounded-xl bg-parchment-50 font-medium text-espresso-900 focus:border-amber-500 focus:ring-0"
                />
              </div>
            )}

            <div className="flex justify-end gap-4 pt-4 border-t border-parchment-200">
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
                className="px-6 py-3 text-sm font-bold uppercase tracking-widest text-espresso-600 bg-parchment-200 rounded-xl hover:bg-parchment-300"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3 text-sm font-bold uppercase tracking-widest text-white bg-espresso-900 rounded-xl hover:bg-espresso-800 disabled:opacity-50 shadow-md"
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-book border border-parchment-300 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-espresso-900" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-espresso-600 font-medium">
            Aucun utilisateur trouvé.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-parchment-100 border-b border-parchment-200">
                <tr>
                  <th className="px-6 py-5 text-xs font-bold text-espresso-500 uppercase tracking-widest">Identifiant</th>
                  <th className="px-6 py-5 text-xs font-bold text-espresso-500 uppercase tracking-widest">Espace</th>
                  <th className="px-6 py-5 text-xs font-bold text-espresso-500 uppercase tracking-widest">Rôle</th>
                  <th className="px-6 py-5 text-xs font-bold text-espresso-500 uppercase tracking-widest text-center">Statut</th>
                  <th className="px-6 py-5 text-xs font-bold text-espresso-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment-100">
                {filtered.map(user => (
                  <tr key={user.id} className="hover:bg-parchment-50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-bold text-espresso-900">{user.email || user.username || '—'}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full border border-parchment-300 bg-parchment-100 text-espresso-700">
                        {SPACE_LABELS[user.space] ?? user.space}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full ${
                        user.role === 'gerant'
                          ? 'bg-espresso-900 text-parchment-100'
                          : user.role === 'utilisateur'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-parchment-100 text-espresso-500 border border-parchment-300'
                      }`}>
                        {roleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${user.active ? 'bg-green-500' : 'bg-parchment-300'}`}
                        aria-label={user.active ? 'Désactiver' : 'Activer'}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${user.active ? 'left-7' : 'left-1'}`} />
                      </button>
                    </td>
                    <td className="px-6 py-5 text-right">
                      {deleteConfirmId === user.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="px-3 py-1 bg-terracotta-600 text-white text-xs font-bold uppercase tracking-widest rounded"
                          >
                            Oui
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-3 py-1 bg-parchment-200 text-espresso-800 text-xs font-bold uppercase tracking-widest rounded"
                          >
                            Non
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(user.id)}
                          className="p-2 text-espresso-400 hover:text-terracotta-600 hover:bg-terracotta-50 rounded-lg transition-colors"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
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

export default AccessPage
