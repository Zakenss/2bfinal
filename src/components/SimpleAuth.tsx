import React, { useState } from 'react'
import { BookOpen, LogIn } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface SimpleAuthProps {
  onAuthSuccess: () => void
  title: string
  description: string
  onUserIdentified?: (email: string) => void
}

function SimpleAuth({ onAuthSuccess, title, description, onUserIdentified }: SimpleAuthProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { data, error: dbError } = await supabase
        .from('users')
        .select('email, password, active')
        .eq('email', email.trim().toLowerCase())
        .eq('space', 'espace_client')
        .maybeSingle()

      if (dbError) throw dbError

      if (data && data.active && data.password === password) {
        if (onUserIdentified) onUserIdentified(data.email)
        onAuthSuccess()
      } else {
        setError('Email ou mot de passe incorrect')
      }
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.')
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <BookOpen className="h-12 w-12 text-gray-900 mx-auto mb-4" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {title}
          </h1>
          <p className="text-sm md:text-base text-gray-800">
            {description}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 border-2 border-gray-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50"
                placeholder="votre.email@exemple.com"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-900 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-800 to-indigo-800 text-white py-3 md:py-4 px-6 rounded-lg font-semibold hover:from-blue-900 hover:to-indigo-900 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg text-sm md:text-base"
            >
              {isLoading ? (
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
              onClick={() => window.location.reload()}
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

export default SimpleAuth