import React, { useState, useEffect } from 'react'
import { CreditCard as Edit, Search, Plus, Trash2, Printer, Check } from 'lucide-react'
import { supabase, Student } from '../lib/supabase'
import { buildReceiptHTML } from '../lib/receiptBuilder'

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
  const [groupedOrders, setGroupedOrders] = useState<GroupedOrder[]>([])
  const [filteredGroupedOrders, setFilteredGroupedOrders] = useState<GroupedOrder[]>([])
  const [searchCode, setSearchCode] = useState('')
  const [searchName, setSearchName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [editingOrder, setEditingOrder] = useState<GroupedOrder | null>(null)
  const [editForm, setEditForm] = useState<EditFormData | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [deletingOrder, setDeletingOrder] = useState<GroupedOrder | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [ecoles, setEcoles] = useState<string[]>([])
  const [isLoadingEcoles, setIsLoadingEcoles] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeChildIndex, setActiveChildIndex] = useState<number | null>(null)

  const loadRecentOrders = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      groupOrdersByCustomer(data || [])
    } catch (err) {
      console.error('Erreur lors du chargement des commandes:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const groupOrdersByCustomer = (orders: Student[]) => {
    const grouped: Record<string, GroupedOrder> = {}
    for (const order of orders) {
      const key = `${order.nom}-${order.email}-${order.telephone}`
      if (!grouped[key]) {
        grouped[key] = {
          nom: order.nom ?? '',
          email: order.email ?? '',
          telephone: order.telephone ?? '',
          avance: order.avance,
          note: order.note ?? '',
          couverture_demandee: order.couverture_demandee ?? false,
          created_at: order.created_at ?? '',
          children: [],
        }
      }
      grouped[key].children.push(order)
      if (new Date(order.created_at ?? '') < new Date(grouped[key].created_at)) {
        grouped[key].created_at = order.created_at ?? ''
      }
    }
    const sorted = Object.values(grouped).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    setGroupedOrders(sorted)
  }

  useEffect(() => {
    let filtered = groupedOrders
    if (searchCode) {
      filtered = filtered.filter(g =>
        g.children.some(c => (c.code ?? '').toLowerCase().includes(searchCode.toLowerCase()))
      )
    }
    if (searchName) {
      filtered = filtered.filter(g =>
        g.nom.toLowerCase().includes(searchName.toLowerCase())
      )
    }
    setFilteredGroupedOrders(filtered)
  }, [groupedOrders, searchCode, searchName])

  useEffect(() => {
    loadRecentOrders()
    const subscription = supabase
      .channel('correction_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, loadRecentOrders)
      .subscribe()
    const refreshInterval = setInterval(loadRecentOrders, 180_000)
    return () => {
      subscription.unsubscribe()
      clearInterval(refreshInterval)
    }
  }, [])

  useEffect(() => {
    const loadEcoles = async () => {
      setIsLoadingEcoles(true)
      try {
        const { data, error } = await supabase
          .from('ecoles')
          .select('nom_ecole')
          .order('nom_ecole')
        if (error) throw error
        setEcoles((data || []).map(item => item.nom_ecole).filter(Boolean))
      } catch (err) {
        console.error('Erreur lors du chargement des écoles:', err)
      } finally {
        setIsLoadingEcoles(false)
      }
    }
    loadEcoles()
  }, [])

  const getFilteredEcoles = (query: string) => {
    if (!query.trim()) return ecoles.slice(0, 20)
    const q = query.toLowerCase()
    return ecoles.filter(ecole => ecole.toLowerCase().includes(q)).slice(0, 20)
  }

  const updateChild = (
    index: number,
    field: 'ecole' | 'niveau' | 'genre',
    value: string
  ) => {
    if (!editForm) return
    setEditForm({
      ...editForm,
      children: editForm.children.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      ),
    })
  }

  const handlePrintOrder = (order: GroupedOrder) => {
    const html = buildReceiptHTML({
      nom: order.nom,
      telephone: order.telephone || null,
      avance: order.avance ?? null,
      note: order.note || null,
      couverture_demandee: order.couverture_demandee,
      created_at: order.created_at,
      children: order.children.map(c => ({
        ecole: c.ecole ?? '',
        niveau: c.niveau ?? '',
        genre: c.genre ?? null,
        code: c.code ?? '',
      })),
    })
    const printWindow = window.open('', '_blank', 'width=320,height=600')
    if (!printWindow) {
      alert('Veuillez autoriser les pop-ups pour imprimer.')
      return
    }
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  const handleDeleteOrder = async () => {
    if (!deletingOrder) return
    setIsDeleting(true)
    try {
      const ids = deletingOrder.children.map(c => c.id)
      await Promise.all(ids.map(id => supabase.from('students').delete().eq('id', id)))
      await loadRecentOrders()
      setDeletingOrder(null)
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      alert('Erreur lors de la suppression. Veuillez réessayer.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditOrder = (order: GroupedOrder) => {
    setEditingOrder(order)
    setEditForm({
      nom: order.nom,
      children: order.children.map(c => ({
        id: c.id,
        ecole: c.ecole ?? '',
        niveau: c.niveau ?? '',
        genre: (c.genre as 'fille' | 'garcon' | '') || '',
      })),
      email: order.email,
      telephone: order.telephone,
      avance: order.avance?.toString() || '',
      note: order.note || '',
      couverture_demandee: order.couverture_demandee,
    })
  }

  const handleCancelEdit = () => {
    setEditingOrder(null)
    setEditForm(null)
  }

  const generateCode = (): string => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const digits = '0123456789'
    return (
      letters[Math.floor(Math.random() * letters.length)] +
      letters[Math.floor(Math.random() * letters.length)] +
      digits[Math.floor(Math.random() * digits.length)] +
      digits[Math.floor(Math.random() * digits.length)]
    )
  }

  const handleSaveChanges = async () => {
    if (!editForm || !editingOrder) return
    setIsUpdating(true)
    try {
      const sharedFields = {
        nom: editForm.nom.trim(),
        email: editForm.email.trim(),
        telephone: editForm.telephone.trim(),
        avance: editForm.avance ? parseFloat(editForm.avance) : null,
        note: editForm.note.trim(),
        couverture_demandee: editForm.couverture_demandee,
      }

      const updatePromises = editForm.children
        .filter(c => c.id)
        .map(child =>
          supabase
            .from('students')
            .update({ ...sharedFields, ecole: child.ecole.trim(), niveau: child.niveau.trim(), genre: child.genre || null })
            .eq('id', child.id)
        )

      const insertPromises = editForm.children
        .filter(c => !c.id)
        .map(child =>
          supabase.from('students').insert([{
            code: generateCode(),
            ...sharedFields,
            ecole: child.ecole.trim(),
            niveau: child.niveau.trim(),
            genre: child.genre || null,
          }])
        )

      const removedChildren = editingOrder.children.filter(
        orig => !editForm.children.some(f => f.id === orig.id)
      )
      const deletePromises = removedChildren.map(child =>
        supabase.from('students').delete().eq('id', child.id)
      )

      await Promise.all([...updatePromises, ...insertPromises, ...deletePromises])
      await loadRecentOrders()
      handleCancelEdit()
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err)
      alert('Erreur lors de la mise à jour. Veuillez réessayer.')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-espresso-900" />
      </div>
    )
  }

  if (editingOrder && editForm) {
    return (
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="mb-8 flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-parchment-300">
          <button
            onClick={handleCancelEdit}
            className="px-5 py-2 bg-parchment-200 text-espresso-800 rounded-xl font-bold tracking-wide hover:bg-parchment-300 transition-colors uppercase text-xs"
          >
            ← Annuler
          </button>
          <h1 className="text-xl font-heading font-bold text-espresso-900">
            Modifier : {editingOrder.nom}
          </h1>
        </div>

        <div className="bg-white rounded-3xl shadow-book border border-parchment-300 overflow-hidden">
          <div className="p-8 space-y-10">
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-espresso-500 border-b border-parchment-200 pb-2">
                Informations Client
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-espresso-800 mb-2">
                    Nom et Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.nom}
                    onChange={e => setEditForm({ ...editForm, nom: e.target.value })}
                    className="w-full px-4 py-3.5 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 font-medium text-espresso-900 bg-parchment-50"
                    placeholder="Ex: Martin Dubois"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-espresso-800 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={editForm.telephone}
                    onChange={e => setEditForm({ ...editForm, telephone: e.target.value })}
                    className="w-full px-4 py-3.5 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 font-medium text-espresso-900 bg-parchment-50"
                    placeholder="Ex: 06 12 34 56 78"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-espresso-800 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-4 py-3.5 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 font-medium text-espresso-900 bg-parchment-50"
                    placeholder="votre.email@exemple.com"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-parchment-200 pb-2">
                <h3 className="text-sm font-bold uppercase tracking-widest text-espresso-500">
                  Enfants (Écoles & Niveaux)
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setEditForm({
                      ...editForm,
                      children: [...editForm.children, { id: '', ecole: '', niveau: '', genre: '' }],
                    })
                  }
                  className="text-amber-700 hover:text-amber-800 font-bold text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Ajouter
                </button>
              </div>

              <div className="space-y-6">
                {editForm.children.map((child, index) => {
                  const originalChild = editingOrder.children.find(c => c.id === child.id)
                  return (
                    <div
                      key={child.id || `new-${index}`}
                      className="p-6 rounded-2xl bg-parchment-100 border border-parchment-300 relative"
                    >
                      {editForm.children.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setEditForm({
                              ...editForm,
                              children: editForm.children.filter((_, i) => i !== index),
                            })
                          }
                          className="absolute top-4 right-4 text-terracotta-500 hover:text-terracotta-700"
                          aria-label="Supprimer cet enfant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <div className="flex items-center justify-between mb-4 pr-8">
                        <h4 className="text-base font-heading font-bold text-espresso-900">
                          Enfant {index + 1}
                        </h4>
                        {originalChild?.code && (
                          <span className="font-mono font-bold text-amber-700 tracking-widest text-sm">
                            {originalChild.code}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-bold text-espresso-800 mb-2">
                            École *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={child.ecole}
                              onChange={e => {
                                updateChild(index, 'ecole', e.target.value)
                                setActiveChildIndex(index)
                                setShowDropdown(true)
                              }}
                              onFocus={() => {
                                if (ecoles.length > 0) {
                                  setActiveChildIndex(index)
                                  setShowDropdown(true)
                                }
                              }}
                              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                              disabled={isLoadingEcoles}
                              className="w-full px-4 py-3.5 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 bg-white text-espresso-900 font-medium"
                              placeholder={isLoadingEcoles ? 'Chargement...' : 'Ex: École Elbilia'}
                            />
                            {showDropdown && activeChildIndex === index && getFilteredEcoles(child.ecole).length > 0 && (
                              <div className="absolute z-50 w-full mt-1 bg-white border-2 border-parchment-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                {getFilteredEcoles(child.ecole).map(ecole => (
                                  <button
                                    key={ecole}
                                    type="button"
                                    onClick={() => {
                                      updateChild(index, 'ecole', ecole)
                                      setShowDropdown(false)
                                    }}
                                    className="w-full px-4 py-3 text-left hover:bg-parchment-100 font-medium text-espresso-900 border-b border-parchment-100 last:border-0"
                                  >
                                    {ecole}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-espresso-800 mb-2">
                            Niveau *
                          </label>
                          <select
                            value={child.niveau}
                            onChange={e => updateChild(index, 'niveau', e.target.value)}
                            className="w-full px-4 py-3.5 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 bg-white text-espresso-900 font-medium"
                          >
                            <option value="">Sélectionnez un niveau</option>
                            <option value="PS">Petite Section (PS)</option>
                            <option value="MS">Moyenne Section (MS)</option>
                            <option value="GS">Grande Section (GS)</option>
                            <option value="CP">CP</option>
                            <option value="CE1">CE1</option>
                            <option value="CE2">CE2</option>
                            <option value="CM1">CM1</option>
                            <option value="CM2">CM2</option>
                            <option value="CE6">CE6</option>
                            <option value="CE7">CE7</option>
                            <option value="CE8">CE8</option>
                            <option value="CE9">CE9</option>
                            <option value="TC">Tronc Commun (TC)</option>
                            <option value="1BAC">1ère Année Bac (1BAC)</option>
                            <option value="2BAC">2ème Année Bac (2BAC)</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-espresso-800 mb-3">
                            Genre (Optionnel)
                          </label>
                          <div className="flex space-x-6">
                            <label className="flex items-center space-x-3 cursor-pointer group">
                              <div className="relative flex items-center justify-center w-6 h-6 border-2 border-parchment-400 rounded-full group-hover:border-amber-500 transition-colors">
                                <input
                                  type="radio"
                                  name={`edit-genre-${index}`}
                                  value="fille"
                                  checked={child.genre === 'fille'}
                                  onChange={() => updateChild(index, 'genre', 'fille')}
                                  className="sr-only"
                                />
                                {child.genre === 'fille' && <div className="w-3 h-3 bg-amber-600 rounded-full" />}
                              </div>
                              <span className="font-medium text-espresso-800">Fille</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer group">
                              <div className="relative flex items-center justify-center w-6 h-6 border-2 border-parchment-400 rounded-full group-hover:border-amber-500 transition-colors">
                                <input
                                  type="radio"
                                  name={`edit-genre-${index}`}
                                  value="garcon"
                                  checked={child.genre === 'garcon'}
                                  onChange={() => updateChild(index, 'genre', 'garcon')}
                                  className="sr-only"
                                />
                                {child.genre === 'garcon' && <div className="w-3 h-3 bg-amber-600 rounded-full" />}
                              </div>
                              <span className="font-medium text-espresso-800">Garçon</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-espresso-500 border-b border-parchment-200 pb-2">
                Options Supplémentaires
              </h3>

              <label className="flex items-start space-x-4 cursor-pointer group p-4 rounded-xl border-2 border-parchment-200 hover:border-amber-400 hover:bg-amber-50/30 transition-all">
                <div className="relative flex items-center justify-center w-6 h-6 border-2 border-parchment-400 rounded mt-0.5 group-hover:border-amber-500 transition-colors flex-shrink-0 bg-white">
                  <input
                    type="checkbox"
                    checked={editForm.couverture_demandee}
                    onChange={e => setEditForm({ ...editForm, couverture_demandee: e.target.checked })}
                    className="sr-only"
                  />
                  {editForm.couverture_demandee && <Check className="h-4 w-4 text-amber-600" strokeWidth={3} />}
                </div>
                <div>
                  <span className="block font-bold text-espresso-900 mb-1">Je souhaite une couverture pour les livres</span>
                  <span className="block text-sm text-espresso-600">Cochez cette case si vous désirez que nous couvrions vos livres (service payant).</span>
                </div>
              </label>

              <div>
                <label className="block text-sm font-bold text-espresso-800 mb-2">
                  Avance versée (DHS) - Optionnel
                </label>
                <div className="relative max-w-xs">
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={editForm.avance}
                    onChange={e => setEditForm({ ...editForm, avance: e.target.value })}
                    className="w-full pl-4 pr-12 py-3.5 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 bg-parchment-50 text-espresso-900 font-medium"
                    placeholder="0"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-espresso-500 font-bold">DHS</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-espresso-800 mb-2">
                  Note ou instruction spéciale
                </label>
                <textarea
                  rows={3}
                  value={editForm.note}
                  onChange={e => setEditForm({ ...editForm, note: e.target.value })}
                  className="w-full px-4 py-3.5 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 bg-parchment-50 text-espresso-900 font-medium resize-none"
                  placeholder="Avez-vous une demande particulière ?"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-parchment-200">
              <button
                onClick={handleSaveChanges}
                disabled={isUpdating}
                className="w-full bg-amber-600 text-white py-4 rounded-xl font-bold uppercase tracking-wider hover:bg-amber-700 disabled:opacity-50 shadow-md transition-colors"
              >
                {isUpdating ? 'Sauvegarde en cours...' : 'Sauvegarder les modifications'}
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
          <button
            onClick={() => onNavigate('espace-client')}
            className="px-5 py-2 bg-white border border-parchment-300 text-espresso-800 rounded-full font-semibold hover:bg-parchment-200 transition-all shadow-sm text-sm uppercase tracking-wide"
          >
            ← Retour à l'Espace Client
          </button>
        </div>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-espresso-900 rounded-full mb-6 shadow-md">
            <Edit className="h-8 w-8 text-parchment-100" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-espresso-900 mb-4">
            Correction
          </h1>
          <p className="text-lg text-espresso-600 font-medium">
            Consultez et modifiez les 50 dernières commandes.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-book border border-parchment-300 p-8 mb-10">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-espresso-400" />
              <input
                type="text"
                value={searchCode}
                onChange={e =>
                  setSearchCode(
                    e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, '')
                      .slice(0, 4)
                  )
                }
                placeholder="Code (EX: AB12)"
                maxLength={4}
                className="w-full pl-12 pr-4 py-4 border-2 border-parchment-300 rounded-xl focus:border-amber-500 font-mono font-bold text-lg uppercase bg-parchment-50 text-espresso-900"
              />
            </div>
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-espresso-400" />
              <input
                type="text"
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                placeholder="Nom du client"
                className="w-full pl-12 pr-4 py-4 border-2 border-parchment-300 rounded-xl focus:border-amber-500 font-medium text-lg bg-parchment-50 text-espresso-900"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {filteredGroupedOrders.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-book border border-parchment-300 p-12 text-center text-espresso-600 font-medium">
              Aucune commande trouvée.
            </div>
          ) : (
            filteredGroupedOrders.map(group => (
              <div
                key={`${group.nom}-${group.created_at}`}
                className="bg-white rounded-3xl shadow-book border border-parchment-300 overflow-hidden"
              >
                <div className="bg-parchment-100 border-b border-parchment-200 px-8 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-espresso-900 mb-1">{group.nom}</h3>
                    <span className="text-sm font-medium text-espresso-600">
                      {new Date(group.created_at).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handlePrintOrder(group)}
                      className="px-4 py-2 bg-espresso-900 text-parchment-100 rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-espresso-950 shadow-md flex items-center gap-2 transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      Imprimer
                    </button>
                    <button
                      onClick={() => handleEditOrder(group)}
                      className="px-4 py-2 bg-amber-600 text-white rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-amber-700 shadow-md transition-colors"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => setDeletingOrder(group)}
                      className="px-4 py-2 bg-terracotta-500 text-white rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-terracotta-600 shadow-md flex items-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                </div>

                <div className="p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {group.telephone && (
                      <div className="text-sm">
                        <span className="font-bold text-espresso-500 uppercase tracking-widest mr-2">Tél:</span>
                        <span className="font-medium">{group.telephone}</span>
                      </div>
                    )}
                    {group.email && (
                      <div className="text-sm">
                        <span className="font-bold text-espresso-500 uppercase tracking-widest mr-2">Email:</span>
                        <span className="font-medium">{group.email}</span>
                      </div>
                    )}
                    {group.avance != null && (
                      <div className="text-sm">
                        <span className="font-bold text-espresso-500 uppercase tracking-widest mr-2">Avance:</span>
                        <span className="font-bold text-green-700">{group.avance} DHS</span>
                      </div>
                    )}
                    {group.couverture_demandee && (
                      <div className="text-sm">
                        <span className="font-bold text-espresso-500 uppercase tracking-widest mr-2">Couverture:</span>
                        <span className="font-medium">Oui</span>
                      </div>
                    )}
                  </div>
                  {group.note && (
                    <div className="mb-4 text-sm">
                      <span className="font-bold text-espresso-500 uppercase tracking-widest mr-2">Note:</span>
                      <span className="font-medium">{group.note}</span>
                    </div>
                  )}
                  <div className="space-y-3 border-t border-parchment-200 pt-6">
                    {group.children.map(child => (
                      <div
                        key={child.id}
                        className="flex justify-between items-center p-4 bg-parchment-50 rounded-xl border border-parchment-200"
                      >
                        <div>
                          <div className="font-bold text-espresso-900">{child.ecole}</div>
                          <div className="text-sm text-espresso-600">
                            {child.niveau} {child.genre ? `(${child.genre})` : ''}
                          </div>
                        </div>
                        <div className="font-mono font-bold text-lg text-amber-700 tracking-widest">
                          {child.code}
                        </div>
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
            <h2 className="text-xl font-heading font-bold text-espresso-900 mb-3">
              Supprimer la commande ?
            </h2>
            <p className="text-espresso-600 mb-2">
              Cette action est irréversible. La commande de{' '}
              <span className="font-bold text-espresso-900">{deletingOrder.nom}</span> et{' '}
              {deletingOrder.children.length === 1
                ? 'son 1 enfant seront définitivement supprimés.'
                : `ses ${deletingOrder.children.length} enfants seront définitivement supprimés.`}
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeletingOrder(null)}
                disabled={isDeleting}
                className="flex-1 px-5 py-3 bg-parchment-200 text-espresso-800 rounded-xl font-bold uppercase tracking-wide hover:bg-parchment-300 transition-colors text-sm disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteOrder}
                disabled={isDeleting}
                className="flex-1 px-5 py-3 bg-terracotta-500 text-white rounded-xl font-bold uppercase tracking-wide hover:bg-terracotta-600 transition-colors text-sm disabled:opacity-50"
              >
                {isDeleting ? 'Suppression...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Correction
