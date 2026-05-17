import React, { useState, useEffect } from 'react'
import { School, Plus, Trash2, Check, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface EcoleManagementProps {
  onNavigate: (page: 'espace-client') => void
}

function EcoleManagement({ onNavigate }: EcoleManagementProps) {
  const [ecoles, setEcoles] = useState<string[]>([])
  const [newEcole, setNewEcole] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadEcoles()
  }, [])

  const loadEcoles = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('ecoles')
        .select('nom_ecole')
        .order('nom_ecole', { ascending: true })

      if (error) throw error

      const ecoleNames = data?.map(item => item.nom_ecole).filter(Boolean) || []
      setEcoles(ecoleNames)
    } catch (error) {
      console.error('Error loading écoles:', error)
      setMessage({ type: 'error', text: 'Erreur lors du chargement des écoles' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddEcole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEcole.trim()) return

    setIsAdding(true)
    try {
      const { error } = await supabase
        .from('ecoles')
        .insert([{ nom_ecole: newEcole.trim() }])

      if (error) throw error

      setMessage({ type: 'success', text: 'École ajoutée avec succès!' })
      setNewEcole('')
      loadEcoles()
    } catch (error) {
      console.error('Error adding école:', error)
      setMessage({ type: 'error', text: 'Erreur lors de l\'ajout de l\'école' })
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteEcole = async (ecoleName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${ecoleName}" ?`)) return

    try {
      const { error } = await supabase
        .from('ecoles')
        .delete()
        .eq('nom_ecole', ecoleName)

      if (error) throw error

      setMessage({ type: 'success', text: 'École supprimée avec succès!' })
      loadEcoles()
    } catch (error) {
      console.error('Error deleting école:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la suppression de l\'école' })
    }
  }

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(null), 3000)
    return () => clearTimeout(timer)
  }, [message])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-espresso-900"></div>
      </div>
    )
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
          <School className="h-8 w-8 text-parchment-100" />
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-espresso-900 mb-4">
          Gestion des Écoles
        </h1>
        <p className="text-lg text-espresso-600 font-medium">
          Ajoutez ou supprimez des écoles de la base de données.
        </p>
      </div>

      {message && (
        <div className={`mb-8 p-4 rounded-xl flex items-center justify-center space-x-3 text-sm font-bold uppercase tracking-widest border shadow-sm ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-terracotta-50 border-terracotta-200 text-terracotta-700'
        }`}>
          {message.type === 'success' ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-book border border-parchment-300 p-8 mb-10">
        <h2 className="text-sm font-bold uppercase tracking-widest text-espresso-500 mb-6">
          Ajouter une école
        </h2>
        
        <form onSubmit={handleAddEcole} className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={newEcole}
              onChange={(e) => setNewEcole(e.target.value)}
              placeholder="Nom de la nouvelle école"
              className="w-full px-4 py-3.5 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 transition-colors bg-parchment-50 text-espresso-900 font-medium"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isAdding || !newEcole.trim()}
            className="px-8 py-3.5 bg-amber-600 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md text-sm sm:w-auto"
          >
            <Plus className="h-5 w-5" />
            <span>{isAdding ? 'Ajout...' : 'Ajouter'}</span>
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-book border border-parchment-300 overflow-hidden">
        <div className="bg-parchment-100 border-b border-parchment-200 px-8 py-5">
          <h2 className="text-lg font-heading font-bold text-espresso-900">
            Liste des Écoles ({ecoles.length})
          </h2>
        </div>

        {ecoles.length === 0 ? (
          <div className="p-12 text-center">
            <School className="h-12 w-12 text-parchment-400 mx-auto mb-4" />
            <p className="text-espresso-600 font-medium text-lg">Aucune école trouvée</p>
          </div>
        ) : (
          <div className="divide-y divide-parchment-100">
            {ecoles.map((ecole) => (
              <div key={ecole} className="px-8 py-5 flex items-center justify-between hover:bg-parchment-50 transition-colors">
                <span className="text-espresso-900 font-bold text-lg">{ecole}</span>
                <button
                  onClick={() => handleDeleteEcole(ecole)}
                  className="p-2.5 text-terracotta-500 hover:text-white hover:bg-terracotta-500 rounded-lg transition-colors border border-transparent hover:border-terracotta-600"
                  title="Supprimer cette école"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default EcoleManagement