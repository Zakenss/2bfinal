import React, { useState, useEffect } from 'react'
import { Package, Search, Check, Save } from 'lucide-react'
import { supabase, Student } from '../lib/supabase'

interface CouverturePageProps {
  onNavigate: (page: 'espace-client') => void
  currentUser?: string
}

function CouverturePage({ onNavigate, currentUser }: CouverturePageProps) {
  const [bookLists, setBookLists] = useState<Student[]>([])
  const [filteredBookLists, setFilteredBookLists] = useState<Student[]>([])
  const [searchCode, setSearchCode] = useState('')
  const [searchName, setSearchName] = useState('')
  const [showOnlyNonEnvoyees, setShowOnlyNonEnvoyees] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set())

  const loadCouvertureOrders = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.from('students').select('*').eq('couverture_demandee', true).order('created_at', { ascending: false })
      if (error) throw error
      setBookLists(data || [])
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error loading couverture orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let filtered = bookLists
    if (searchCode) filtered = filtered.filter(b => (b.code ?? '').toLowerCase().includes(searchCode.toLowerCase()))
    if (searchName) filtered = filtered.filter(b => (b.nom ?? '').toLowerCase().includes(searchName.toLowerCase()))
    if (showOnlyNonEnvoyees) filtered = filtered.filter(b => !b.couverture_sent)
    setFilteredBookLists(filtered)
  }, [bookLists, searchCode, searchName, showOnlyNonEnvoyees])

  useEffect(() => {
    loadCouvertureOrders()
    const subscription = supabase.channel('couverture_orders').on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => { loadCouvertureOrders() }).subscribe()
    const interval = setInterval(loadCouvertureOrders, 180000)
    return () => { subscription.unsubscribe(); clearInterval(interval) }
  }, [])

  const handleMarkAsSent = async (bookList: Student) => {
    if (updatingOrders.has(bookList.id)) return
    setUpdatingOrders(prev => new Set(prev).add(bookList.id))
    try {
      const { error } = await supabase.from('students').update({
        couverture_sent: !bookList.couverture_sent,
        couverture_sent_at: !bookList.couverture_sent ? new Date().toISOString() : null,
        couverture_sent_by: !bookList.couverture_sent ? 'aichabenzangue@gmail.com' : null,
      }).eq('id', bookList.id)
      if (error) throw error
      loadCouvertureOrders()
    } finally {
      setUpdatingOrders(prev => { const n = new Set(prev); n.delete(bookList.id); return n })
    }
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-espresso-900"></div></div>

  return (
    <div className="max-w-7xl mx-auto px-4 pb-12">
      <div className="mb-8">
        <button onClick={() => onNavigate('espace-client')} className="px-5 py-2 bg-white border border-parchment-300 text-espresso-800 rounded-full font-semibold hover:bg-parchment-200 transition-all shadow-sm text-sm uppercase tracking-wide">
          ← Retour à l'Espace Client
        </button>
      </div>

      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-4 bg-espresso-900 rounded-full mb-6 shadow-md">
          <Package className="h-8 w-8 text-parchment-100" />
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-espresso-900 mb-4">Couverture</h1>
        <p className="text-lg text-espresso-600 font-medium">Commandes nécessitant un service de couverture.</p>
        <p className="text-sm font-bold text-espresso-400 mt-2">Dernière maj: {lastRefresh.toLocaleTimeString('fr-FR')}</p>
      </div>

      <div className="bg-white rounded-3xl shadow-book border border-parchment-300 p-8 mb-10">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-espresso-400" />
            <input type="text" value={searchCode} onChange={(e) => setSearchCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))} placeholder="CODE (EX: AB12)" className="w-full pl-12 pr-4 py-4 border-2 border-parchment-300 rounded-xl focus:border-amber-500 font-mono font-bold text-lg uppercase bg-parchment-50 text-espresso-900" maxLength={4} />
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-espresso-400" />
            <input type="text" value={searchName} onChange={(e) => setSearchName(e.target.value)} placeholder="NOM DU CLIENT" className="w-full pl-12 pr-4 py-4 border-2 border-parchment-300 rounded-xl focus:border-amber-500 font-medium text-lg bg-parchment-50 text-espresso-900" />
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-parchment-200">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input type="checkbox" checked={showOnlyNonEnvoyees} onChange={e => setShowOnlyNonEnvoyees(e.target.checked)} className="w-5 h-5 rounded border-2 border-parchment-400 text-amber-600 focus:ring-amber-500" />
            <span className="font-bold text-espresso-800 uppercase tracking-widest text-sm">Afficher uniquement les non-envoyées</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBookLists.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl shadow-book border border-parchment-300 p-12 text-center text-espresso-600 font-medium">Aucune commande trouvée.</div>
        ) : (
          filteredBookLists.map(order => (
            <div key={order.id} className="bg-white rounded-3xl shadow-sm hover:shadow-book border border-parchment-300 overflow-hidden transition-all duration-300 flex flex-col">
              <div className="px-6 py-4 bg-parchment-100 border-b border-parchment-200 flex justify-between items-center">
                <span className="text-2xl font-mono font-bold text-espresso-900 tracking-widest">#{order.code}</span>
                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full border ${order.liste_prete ? 'bg-green-100 text-green-800 border-green-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                  {order.liste_prete ? 'Prête' : 'En attente'}
                </span>
              </div>
              <div className="p-6 flex-grow flex flex-col">
                <h3 className="text-xl font-bold text-espresso-900 mb-1">{order.nom}</h3>
                <p className="text-sm text-espresso-600 mb-1">{order.ecole} — {order.niveau}</p>
                <p className="text-xs font-medium text-espresso-400 mb-6">{new Date(order.created_at ?? '').toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                <div className="mt-auto pt-6 border-t border-parchment-200">
                  <button
                    onClick={() => handleMarkAsSent(order)}
                    disabled={updatingOrders.has(order.id)}
                    className={`w-full py-3 rounded-xl font-bold uppercase tracking-wider text-sm transition-colors border-2 ${
                      order.couverture_sent ? 'bg-white text-terracotta-600 border-terracotta-200 hover:border-terracotta-400' : 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700 shadow-sm'
                    }`}
                  >
                    {updatingOrders.has(order.id) ? '...' : order.couverture_sent ? 'Annuler l\'envoi' : 'Marquer comme envoyé'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default CouverturePage