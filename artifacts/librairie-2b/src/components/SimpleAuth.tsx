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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-parchment-100 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
      <div className="absolute inset-0 bg-gradient-to-b from-parchment-100/30 to-parchment-200/90 pointer-events-none" />
      
      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-espresso-900 rounded-full mb-6 shadow-lg border-4 border-parchment-100">
            <BookOpen className="h-10 w-10 text-parchment-100" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-espresso-900 mb-3">
            {title}
          </h1>
          <p className="text-base text-espresso-600 font-medium">
            {description}
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-book p-8 md:p-10 border border-parchment-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-bold tracking-wide text-espresso-800 uppercase mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 transition-colors bg-parchment-50 text-espresso-900 placeholder-espresso-300 font-medium"
                placeholder="votre.email@exemple.com"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 transition-colors bg-parchment-50 text-espresso-900 placeholder-espresso-300 font-medium"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-terracotta-500/10 border border-terracotta-500/20 rounded-xl p-4 flex items-start space-x-3">
                <p className="text-terracotta-700 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-600 text-white py-4 px-6 rounded-xl font-bold tracking-wide hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-md hover:shadow-lg mt-2"
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
          
          <div className="mt-8 text-center pt-6 border-t border-parchment-200">
            <button
              onClick={() => window.location.reload()}
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

export default SimpleAuth