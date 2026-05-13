import React, { useState, useEffect } from 'react'
import { CreditCard as Edit, Search, Check, Clock, Save, X, Plus, Trash2, Printer } from 'lucide-react'
import { supabase, Student } from '../lib/supabase'

interface CorrectionProps {
  onNavigate: (page: 'espace-client') => void
}

interface GroupedOrder {
  nom: string
  email: string
  telephone: string
  avance: number | null
  note: string
  couverture_demandee: boolean
  created_at: string
  children: Student[]
}

interface EditFormData {
  nom: string
  children: Array<{
    id: string
    ecole: string
    niveau: string
    genre: 'fille' | 'garcon' | ''
  }>
  email: string
  telephone: string
  avance: string
  note: string
  couverture_demandee: boolean
}

function Correction({ onNavigate }: CorrectionProps) {
  const [bookLists, setBookLists] = useState<Student[]>([])
  const [groupedOrders, setGroupedOrders] = useState<GroupedOrder[]>([])
  const [filteredGroupedOrders, setFilteredGroupedOrders] = useState<GroupedOrder[]>([])
  const [searchCode, setSearchCode] = useState('')
  const [searchName, setSearchName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [editingOrder, setEditingOrder] = useState<GroupedOrder | null>(null)
  const [editForm, setEditForm] = useState<EditFormData | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [ecoles, setEcoles] = useState<string[]>([])
  const [showEcoleDropdown, setShowEcoleDropdown] = useState(false)
  const [activeChildIndex, setActiveChildIndex] = useState<number | null>(null)
  const [filteredEcoles, setFilteredEcoles] = useState<string[]>([])
  const [deletingOrder, setDeletingOrder] = useState<GroupedOrder | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [printingOrder, setPrintingOrder] = useState<GroupedOrder | null>(null)

  const loadRecentOrders = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.from('students').select('*').order('created_at', { ascending: false }).limit(50)
      if (error) throw error
      setBookLists(data || [])
      groupOrdersByCustomer(data || [])
    } catch (error) {
      console.error('Error loading recent orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadEcoles = async () => {
    try {
      const { data, error } = await supabase.from('ecoles').select('nom_ecole').order('nom_ecole', { ascending: true })
      if (error) throw error
      const ecoleNames = data?.map(item => item.nom_ecole).filter(Boolean) || []
      setEcoles(ecoleNames)
      setFilteredEcoles(ecoleNames)
    } catch (error) {
      console.error('Error loading écoles:', error)
    }
  }

  const groupOrdersByCustomer = (orders: Student[]) => {
    const grouped: { [key: string]: GroupedOrder } = {}
    orders.forEach(order => {
      const key = `${order.nom}-${order.email}-${order.telephone}`
      if (!grouped[key]) {
        grouped[key] = { nom: order.nom, email: order.email, telephone: order.telephone, avance: order.avance, note: order.note, couverture_demandee: order.couverture_demandee, created_at: order.created_at, children: [] }
      }
      grouped[key].children.push(order)
      if (new Date(order.created_at) < new Date(grouped[key].created_at)) grouped[key].created_at = order.created_at
    })
    const groupedArray = Object.values(grouped).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setGroupedOrders(groupedArray)
  }

  useEffect(() => {
    let filtered = groupedOrders
    if (searchCode) filtered = filtered.filter(g => g.children.some(c => c.code.toLowerCase().includes(searchCode.toLowerCase())))
    if (searchName) filtered = filtered.filter(g => g.nom.toLowerCase().includes(searchName.toLowerCase()))
    setFilteredGroupedOrders(filtered)
  }, [groupedOrders, searchCode, searchName])

  useEffect(() => {
    loadEcoles()
    const subscription = supabase.channel('recent_orders').on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => { loadRecentOrders() }).subscribe()
    const refreshInterval = setInterval(() => { loadRecentOrders() }, 180000)
    return () => { subscription.unsubscribe(); clearInterval(refreshInterval) }
  }, [])

  useEffect(() => { loadRecentOrders() }, [])

  const handleDeleteOrder = async () => {
    if (!deletingOrder) return
    setIsDeleting(true)
    try {
      const ids = deletingOrder.children.map(c => c.id)
      await Promise.all(ids.map(id => supabase.from('students').delete().eq('id', id)))
      await loadRecentOrders()
      setDeletingOrder(null)
    } catch (error) {
      alert('Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePrintOrder = (order: GroupedOrder) => {
    setPrintingOrder(order)
    setTimeout(() => {
      window.print()
      setPrintingOrder(null)
    }, 100)
  }

  const handleEditOrder = (order: GroupedOrder) => {
    setEditingOrder(order)
    setEditForm({
      nom: order.nom,
      children: order.children.map(c => ({ id: c.id, ecole: c.ecole, niveau: c.niveau, genre: c.genre || '' })),
      email: order.email,
      telephone: order.telephone,
      avance: order.avance?.toString() || '',
      note: order.note || '',
      couverture_demandee: order.couverture_demandee
    })
  }

  const handleCancelEdit = () => {
    setEditingOrder(null)
    setEditForm(null)
    setShowEcoleDropdown(false)
    setActiveChildIndex(null)
  }

  const generateCode = (): string => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; const numbers = '0123456789'
    return letters[Math.floor(Math.random() * letters.length)] + letters[Math.floor(Math.random() * letters.length)] + numbers[Math.floor(Math.random() * numbers.length)] + numbers[Math.floor(Math.random() * numbers.length)]
  }

  const handleSaveChanges = async () => {
    if (!editForm || !editingOrder) return
    setIsUpdating(true)
    try {
      const updatePromises = editForm.children.filter(c => c.id).map(child => {
        return supabase.from('students').update({
          nom: editForm.nom.trim(), ecole: child.ecole.trim(), niveau: child.niveau.trim(), genre: child.genre || null,
          email: editForm.email.trim(), telephone: editForm.telephone.trim(), avance: editForm.avance ? parseFloat(editForm.avance) : null,
          note: editForm.note.trim(), couverture_demandee: editForm.couverture_demandee
        }).eq('id', child.id)
      })

      const newChildren = editForm.children.filter(c => !c.id)
      const insertPromises = newChildren.map(async (child) => {
        let newCode = generateCode()
        return supabase.from('students').insert([{
          code: newCode, nom: editForm.nom.trim(), ecole: child.ecole.trim(), niveau: child.niveau.trim(), genre: child.genre || null,
          email: editForm.email.trim(), telephone: editForm.telephone.trim(), avance: editForm.avance ? parseFloat(editForm.avance) : null,
          note: editForm.note.trim(), couverture_demandee: editForm.couverture_demandee
        }])
      })

      const removedChildren = editingOrder.children.filter(orig => !editForm.children.some(f => f.id === orig.id))
      const deletePromises = removedChildren.map(child => supabase.from('students').delete().eq('id', child.id))

      await Promise.all([...updatePromises, ...insertPromises, ...deletePromises])
      await loadRecentOrders()
      handleCancelEdit()
    } catch (error) {
      alert('Erreur lors de la mise à jour')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-espresso-900"></div></div>

  if (editingOrder && editForm) {
    return (
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="mb-8 flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-parchment-300">
          <button onClick={handleCancelEdit} className="px-5 py-2 bg-parchment-200 text-espresso-800 rounded-xl font-bold tracking-wide hover:bg-parchment-300 transition-colors uppercase text-xs">← Annuler</button>
          <h1 className="text-xl font-heading font-bold text-espresso-900">Modifier : {editingOrder.nom}</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-book border border-parchment-300 overflow-hidden">
          <div className="p-8 space-y-8">
            <div>
              <label className="block text-xs font-bold text-espresso-500 uppercase tracking-widest mb-2">Nom de l'élève ou parent *</label>
              <input type="text" required value={editForm.nom} onChange={e => setEditForm({ ...editForm, nom: e.target.value })} className="w-full px-4 py-3 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 font-medium text-espresso-900 bg-parchment-50" />
            </div>

            <div>
              <div className="flex items-center justify-between border-b border-parchment-200 pb-3 mb-4">
                <label className="text-sm font-bold text-espresso-800 uppercase tracking-widest">Enfant(s)</label>
                <button type="button" onClick={() => setEditForm({ ...editForm, children: [...editForm.children, { id: '', ecole: '', niveau: '', genre: '' }] })} className="text-amber-700 hover:text-amber-800 font-bold text-sm flex items-center"><Plus className="w-4 h-4 mr-1" /> Ajouter</button>
              </div>
              
              <div className="space-y-4">
                {editForm.children.map((child, index) => (
                  <div key={index} className="p-5 rounded-2xl bg-parchment-100 border border-parchment-200 relative">
                    {editForm.children.length > 1 && <button onClick={() => setEditForm({...editForm, children: editForm.children.filter((_, i) => i !== index)})} className="absolute top-4 right-4 text-terracotta-500 hover:text-terracotta-700"><Trash2 className="w-4 h-4" /></button>}
                    <h4 className="text-sm font-bold text-espresso-900 mb-4 uppercase tracking-widest">Enfant {index + 1}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-espresso-500 uppercase tracking-widest mb-2">École *</label>
                        <input type="text" value={child.ecole} onChange={e => {
                          const val = e.target.value;
                          setEditForm({...editForm, children: editForm.children.map((c, i) => i === index ? {...c, ecole: val} : c)})
                        }} className="w-full px-4 py-3 border-2 border-parchment-300 rounded-xl bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-espresso-500 uppercase tracking-widest mb-2">Niveau *</label>
                        <select value={child.niveau} onChange={e => setEditForm({...editForm, children: editForm.children.map((c, i) => i === index ? {...c, niveau: e.target.value} : c)})} className="w-full px-4 py-3 border-2 border-parchment-300 rounded-xl bg-white">
                          <option value="">Sélectionner</option>
                          {['PS','MS','GS','CP','CE1','CE2','CM1','CM2','CE6','CE7','CE8','CE9','TC','1BAC','2BAC'].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-parchment-200">
              <button onClick={handleSaveChanges} disabled={isUpdating} className="w-full bg-amber-600 text-white py-4 rounded-xl font-bold uppercase tracking-wider hover:bg-amber-700 disabled:opacity-50 shadow-md">
                {isUpdating ? '...' : 'Sauvegarder les modifications'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="max-w-5xl mx-auto px-4 pb-12">
      <div className="mb-8">
        <button onClick={() => onNavigate('espace-client')} className="px-5 py-2 bg-white border border-parchment-300 text-espresso-800 rounded-full font-semibold hover:bg-parchment-200 transition-all shadow-sm text-sm uppercase tracking-wide">
          ← Retour à l'Espace Client
        </button>
      </div>

      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-4 bg-espresso-900 rounded-full mb-6 shadow-md">
          <Edit className="h-8 w-8 text-parchment-100" />
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-espresso-900 mb-4">Correction</h1>
        <p className="text-lg text-espresso-600 font-medium">Consultez et modifiez les 50 dernières commandes.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-book border border-parchment-300 p-8 mb-10">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-espresso-400" />
            <input type="text" value={searchCode} onChange={(e) => setSearchCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))} placeholder="Code (EX: AB12)" className="w-full pl-12 pr-4 py-4 border-2 border-parchment-300 rounded-xl focus:border-amber-500 font-mono font-bold text-lg uppercase bg-parchment-50 text-espresso-900" maxLength={4} />
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-espresso-400" />
            <input type="text" value={searchName} onChange={(e) => setSearchName(e.target.value)} placeholder="Nom du client" className="w-full pl-12 pr-4 py-4 border-2 border-parchment-300 rounded-xl focus:border-amber-500 font-medium text-lg bg-parchment-50 text-espresso-900" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {filteredGroupedOrders.length === 0 ? (
           <div className="bg-white rounded-3xl shadow-book border border-parchment-300 p-12 text-center text-espresso-600 font-medium">Aucune commande trouvée.</div>
        ) : (
          filteredGroupedOrders.map(group => (
            <div key={group.created_at} className="bg-white rounded-3xl shadow-book border border-parchment-300 overflow-hidden">
              <div className="bg-parchment-100 border-b border-parchment-200 px-8 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold text-espresso-900 mb-1">{group.nom}</h3>
                  <span className="text-sm font-medium text-espresso-600">{new Date(group.created_at).toLocaleString('fr-FR')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handlePrintOrder(group)} className="px-4 py-2 bg-espresso-900 text-parchment-100 rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-espresso-950 shadow-md flex items-center gap-2"><Printer className="w-4 h-4" /> Imprimer</button>
                  <button onClick={() => handleEditOrder(group)} className="px-4 py-2 bg-amber-600 text-white rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-amber-700 shadow-md">Modifier</button>
                  <button onClick={() => setDeletingOrder(group)} className="px-4 py-2 bg-terracotta-500 text-white rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-terracotta-600 shadow-md flex items-center gap-2"><Trash2 className="w-4 h-4" /> Supprimer</button>
                </div>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {group.telephone && <div className="text-sm"><span className="font-bold text-espresso-500 uppercase tracking-widest mr-2">Tél:</span><span className="font-medium">{group.telephone}</span></div>}
                  {group.email && <div className="text-sm"><span className="font-bold text-espresso-500 uppercase tracking-widest mr-2">Email:</span><span className="font-medium">{group.email}</span></div>}
                  {group.avance && <div className="text-sm"><span className="font-bold text-espresso-500 uppercase tracking-widest mr-2">Avance:</span><span className="font-bold text-green-700">{group.avance} DHS</span></div>}
                </div>
                <div className="space-y-3 border-t border-parchment-200 pt-6">
                  {group.children.map(child => (
                    <div key={child.id} className="flex justify-between items-center p-4 bg-parchment-50 rounded-xl border border-parchment-200">
                      <div>
                        <div className="font-bold text-espresso-900">{child.ecole}</div>
                        <div className="text-sm text-espresso-600">{child.niveau} {child.genre ? `(${child.genre})` : ''}</div>
                      </div>
                      <div className="font-mono font-bold text-lg text-amber-700 tracking-widest">{child.code}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>

    {deletingOrder && (
      <div className="fixed inset-0 bg-espresso-950/60 flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-3xl shadow-book-hover border border-parchment-300 p-8 max-w-md w-full">
          <h2 className="text-xl font-heading font-bold text-espresso-900 mb-3">Supprimer la commande ?</h2>
          <p className="text-espresso-600 mb-2">Cette action est irréversible. La commande de <span className="font-bold text-espresso-900">{deletingOrder.nom}</span> et ses {deletingOrder.children.length} enfant(s) seront définitivement supprimés.</p>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setDeletingOrder(null)} disabled={isDeleting} className="flex-1 px-5 py-3 bg-parchment-200 text-espresso-800 rounded-xl font-bold uppercase tracking-wide hover:bg-parchment-300 transition-colors text-sm">Annuler</button>
            <button onClick={handleDeleteOrder} disabled={isDeleting} className="flex-1 px-5 py-3 bg-terracotta-500 text-white rounded-xl font-bold uppercase tracking-wide hover:bg-terracotta-600 transition-colors text-sm disabled:opacity-50">
              {isDeleting ? 'Suppression...' : 'Confirmer la suppression'}
            </button>
          </div>
        </div>
      </div>
    )}

    {printingOrder && (
      <div id="print-section" style={{ display: 'none' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '8px', lineHeight: '1.4' }}>
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>LIBRAIRIE 2B</div>
          <div style={{ textAlign: 'center', marginBottom: '6px' }}>Reçu de commande</div>
          <div style={{ borderTop: '1px dashed #000', marginBottom: '4px' }} />
          <div><span style={{ fontWeight: 'bold' }}>Client:</span> {printingOrder.nom}</div>
          {printingOrder.telephone && <div><span style={{ fontWeight: 'bold' }}>Tél:</span> {printingOrder.telephone}</div>}
          {printingOrder.email && <div><span style={{ fontWeight: 'bold' }}>Email:</span> {printingOrder.email}</div>}
          <div><span style={{ fontWeight: 'bold' }}>Date:</span> {new Date(printingOrder.created_at).toLocaleString('fr-FR')}</div>
          {printingOrder.avance && <div><span style={{ fontWeight: 'bold' }}>Avance:</span> {printingOrder.avance} DHS</div>}
          {printingOrder.couverture_demandee && <div><span style={{ fontWeight: 'bold' }}>Couverture:</span> Oui</div>}
          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
          {printingOrder.children.map((child, i) => (
            <div key={i} style={{ marginBottom: '4px' }}>
              <div style={{ fontWeight: 'bold' }}>Enfant {i + 1} — Code: {child.code}</div>
              <div>École: {child.ecole}</div>
              <div>Niveau: {child.niveau}{child.genre ? ` (${child.genre})` : ''}</div>
            </div>
          ))}
          {printingOrder.note && (
            <>
              <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
              <div><span style={{ fontWeight: 'bold' }}>Note:</span> {printingOrder.note}</div>
            </>
          )}
          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
          <div style={{ textAlign: 'center', fontSize: '7px' }}>Merci de votre confiance</div>
        </div>
      </div>
    )}
    </>
  )
}

export default Correction