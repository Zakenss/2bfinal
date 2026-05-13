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

  const handleBackToHome = () => {
    window.location.reload()
  }

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
      loadEcoles() // Reload the list
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
      loadEcoles() // Reload the list
    } catch (error) {
      console.error('Error deleting école:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la suppression de l\'école' })
    }
  }

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    )
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
        <School className="h-12 w-12 text-gray-900 mx-auto mb-4" />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Gestion des Écoles
        </h1>
        <p className="text-sm md:text-base text-gray-800">
          Ajoutez ou supprimez des écoles de la liste
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-100 border border-green-300 text-green-900' 
            : 'bg-red-100 border border-red-300 text-red-900'
        }`}>
          {message.type === 'success' ? (
            <Check className="h-5 w-5" />
          ) : (
            <X className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Add New École Form */}
      <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 mb-8 border-2 border-gray-300">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-6">
          Ajouter une nouvelle école
        </h2>
        
        <form onSubmit={handleAddEcole} className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={newEcole}
              onChange={(e) => setNewEcole(e.target.value)}
              placeholder="Nom de l'école"
              className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isAdding || !newEcole.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-800 to-indigo-800 text-white rounded-lg font-semibold hover:from-blue-900 hover:to-indigo-900 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg text-sm md:text-base w-full sm:w-auto"
          >
            <Plus className="h-5 w-5" />
            <span>{isAdding ? 'Ajout...' : 'Ajouter'}</span>
          </button>
        </form>
      </div>

      {/* École List */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-300">
        <div className="px-4 md:px-6 py-4 border-b border-gray-300 bg-gradient-to-r from-gray-50 to-blue-50">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">
            Liste des Écoles ({ecoles.length})
          </h2>
        </div>

        {ecoles.length === 0 ? (
          <div className="p-6 md:p-8 text-center">
            <School className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-base md:text-lg text-gray-800">Aucune école trouvée</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {ecoles.map((ecole) => (
              <div key={ecole} className="px-4 md:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <span className="text-gray-900 font-medium text-sm md:text-base pr-4">{ecole}</span>
                <button
                  onClick={() => handleDeleteEcole(ecole)}
                  className="p-2 text-red-700 hover:bg-red-100 rounded-lg transition-colors shadow-sm flex-shrink-0"
                  title="Supprimer cette école"
                >
                  <Trash2 className="h-4 w-4" />
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