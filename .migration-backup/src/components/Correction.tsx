import React, { useState, useEffect } from 'react'
import { CreditCard as Edit, Calendar, User, School, Search, Package, Check, Clock, Save, X, Plus, Trash2, Printer } from 'lucide-react'
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
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [editingOrder, setEditingOrder] = useState<GroupedOrder | null>(null)
  const [editForm, setEditForm] = useState<EditFormData | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [ecoles, setEcoles] = useState<string[]>([])
  const [showEcoleDropdown, setShowEcoleDropdown] = useState(false)
  const [activeChildIndex, setActiveChildIndex] = useState<number | null>(null)
  const [filteredEcoles, setFilteredEcoles] = useState<string[]>([])

  const handlePrint = (order: GroupedOrder) => {
    try {
      // Create a temporary print section
      const printContent = generatePrintContent(order)
      
      // Create a temporary div for printing
      const printDiv = document.createElement('div')
      printDiv.id = 'temp-print-section'
      printDiv.innerHTML = printContent
      printDiv.style.display = 'none'
      document.body.appendChild(printDiv)

      // Add a small delay to ensure the DOM is fully rendered
      setTimeout(() => {
        try {
          // Temporarily hide all other content
          const originalContent = document.body.innerHTML
          document.body.innerHTML = printDiv.innerHTML
          
          // Print
          window.print()
          
          // Restore original content
          document.body.innerHTML = originalContent
          
          // Clean up
          const tempDiv = document.getElementById('temp-print-section')
          if (tempDiv) {
            tempDiv.remove()
          }
        } catch (printError) {
          console.error('Print error:', printError)
          alert('Erreur lors de l\'impression. Veuillez réessayer.')
          
          // Clean up on error
          const tempDiv = document.getElementById('temp-print-section')
          if (tempDiv) {
            tempDiv.remove()
          }
        }
      }, 100)
    } catch (error) {
      console.error('Print preparation error:', error)
      alert('Erreur lors de la préparation de l\'impression.')
    }
  }

  const generatePrintContent = (order: GroupedOrder): string => {
    const currentDate = new Date(Date.now() - 60 * 60 * 1000)
    
    return `
      <div id="print-section" class="bg-white p-1 text-xs leading-tight">
        <div class="mb-1">
          <div class="mb-1 text-center">
            <h1 class="text-lg font-bold text-gray-900 mb-1">
              LIBRAIRIE 2B
            </h1>
            <div class="text-xs text-gray-800 mb-1 leading-tight">
              <p>
                ${currentDate.toLocaleDateString('fr-FR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p>
                ${currentDate.toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
          
          <div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
            <svg class="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          
          <h2 class="text-sm font-bold text-gray-900 mb-1 text-center">
            Commande Confirmée
          </h2>
          
          ${order.children.map((child, index) => `
            <div class="bg-blue-100 rounded p-1 mb-1">
              <p class="text-xs font-medium text-blue-800 mb-1 leading-tight">
                ${order.children.length > 1 ? `Enfant ${index + 1}:` : 'Votre code de référence:'}
              </p>
              <p class="text-lg font-bold text-blue-900 tracking-wider font-mono mb-1">
                ${child.code}
              </p>
              ${order.children.length > 1 ? `
                <p class="text-xs text-blue-800 leading-tight">
                  ${child.ecole} - ${child.niveau}
                </p>
              ` : ''}
            </div>
          `).join('')}

          <div class="bg-gray-50 rounded p-1 mb-1 text-left">
            <h3 class="text-xs font-bold text-gray-900 mb-1 text-center border-b border-gray-300 pb-1">DÉTAILS</h3>
            <div class="space-y-1 text-xs leading-tight">
              <div class="flex justify-between items-start">
                <span class="text-gray-700">Nom:</span>
                <span class="font-medium text-gray-900 text-right flex-1 break-words">${order.nom}</span>
              </div>
              ${order.telephone ? `
                <div class="flex justify-between items-start">
                  <span class="text-gray-700">Tél:</span>
                  <span class="font-medium text-gray-900 text-right flex-1">${order.telephone}</span>
                </div>
              ` : ''}
              ${order.children.map((child, index) => `
                <div class="border-t border-gray-300 pt-1 mt-1">
                  <div class="text-center mb-1">
                    <span class="font-bold text-gray-900">
                      ${order.children.length > 1 ? `ENFANT ${index + 1}` : 'ENFANT'}
                    </span>
                  </div>
                  <div class="flex justify-between items-start">
                    <span class="text-gray-700">École:</span>
                    <span class="font-medium text-gray-900 text-right flex-1 break-words">${child.ecole}</span>
                  </div>
                  <div class="flex justify-between items-start">
                    <span class="text-gray-700">Niveau:</span>
                    <span class="font-medium text-gray-900 text-right flex-1">${child.niveau}</span>
                  </div>
                  <div class="flex justify-between items-start">
                    <span class="text-gray-700">Genre:</span>
                    <span class="font-medium text-gray-900 text-right flex-1">${child.genre === 'fille' ? 'Fille' : child.genre === 'garcon' ? 'Garçon' : ''}</span>
                  </div>
                  <div class="flex justify-between items-start">
                    <span class="text-gray-700">Code:</span>
                    <span class="font-bold text-blue-900 text-right flex-1 font-mono">${child.code}</span>
                  </div>
                </div>
              `).join('')}
              ${order.couverture_demandee ? `
                <div class="border-t border-gray-300 pt-1 mt-1">
                  <div class="flex justify-between items-start">
                    <span class="text-gray-700">Couverture:</span>
                    <span class="font-bold text-black text-right flex-1">DEMANDÉE</span>
                  </div>
                </div>
              ` : ''}
              ${order.avance && order.avance !== 0 ? `
                <div class="border-t border-gray-300 pt-1 mt-1">
                  <div class="flex justify-between items-start">
                    <span class="text-gray-700">Avance:</span>
                    <span class="font-bold text-green-800 text-right flex-1">${order.avance} DHS</span>
                  </div>
                </div>
              ` : ''}
              ${order.note ? `
                <div class="border-t border-gray-300 pt-1 mt-1">
                  <span class="font-bold text-gray-900">NOTE:</span>
                  <p class="font-medium text-gray-900 text-xs leading-tight break-words">${order.note}</p>
                </div>
              ` : ''}
            </div>
          </div>
          
          <div class="border-t-2 border-gray-400 pt-1">
            <p class="text-xs text-gray-800 leading-tight text-center">
              Merci pour votre confiance!
            </p>
          </div>
        </div>
      </div>
    `
  }

  const loadRecentOrders = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setBookLists(data || [])
      groupOrdersByCustomer(data || [])
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error loading recent orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadEcoles = async () => {
    try {
      const { data, error } = await supabase
        .from('ecoles')
        .select('nom_ecole')
        .order('nom_ecole', { ascending: true })

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
        grouped[key] = {
          nom: order.nom,
          email: order.email,
          telephone: order.telephone,
          avance: order.avance,
          note: order.note,
          couverture_demandee: order.couverture_demandee,
          created_at: order.created_at,
          children: []
        }
      }
      
      grouped[key].children.push(order)
      
      // Use the earliest creation date for the group
      if (new Date(order.created_at) < new Date(grouped[key].created_at)) {
        grouped[key].created_at = order.created_at
      }
    })
    
    const groupedArray = Object.values(grouped).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    
    setGroupedOrders(groupedArray)
  }

  const filterGroupedOrders = () => {
    let filtered = groupedOrders
    
    // Filter by search code
    if (searchCode) {
      filtered = filtered.filter(group =>
        group.children.some(child => 
          child.code.toLowerCase().includes(searchCode.toLowerCase())
        )
      )
    }
    
    // Filter by search name
    if (searchName) {
      filtered = filtered.filter(group =>
        group.nom.toLowerCase().includes(searchName.toLowerCase())
      )
    }
    
    setFilteredGroupedOrders(filtered)
  }

  const handleEditOrder = (order: GroupedOrder) => {
    setEditingOrder(order)
    setEditForm({
      nom: order.nom,
      children: order.children.map(child => ({
        id: child.id,
        ecole: child.ecole,
        niveau: child.niveau,
        genre: child.genre || ''
      })),
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

  const handleFormChange = (field: keyof EditFormData, value: any) => {
    if (!editForm) return
    setEditForm(prev => prev ? { ...prev, [field]: value } : null)
  }

  const handleChildChange = (index: number, field: string, value: string) => {
    if (!editForm) return
    
    setEditForm(prev => {
      if (!prev) return null
      const newChildren = [...prev.children]
      newChildren[index] = { ...newChildren[index], [field]: value }
      return { ...prev, children: newChildren }
    })

    // Show dropdown when typing in école field
    if (field === 'ecole' && ecoles.length > 0) {
      setActiveChildIndex(index)
      const filtered = ecoles.filter(ecole => 
        ecole.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredEcoles(filtered)
      setShowEcoleDropdown(value.length > 0 && filtered.length > 0)
    }
  }

  const handleEcoleSelect = (ecoleName: string, childIndex: number) => {
    handleChildChange(childIndex, 'ecole', ecoleName)
    setShowEcoleDropdown(false)
    setActiveChildIndex(null)
    setFilteredEcoles(ecoles)
  }

  const addChild = () => {
    if (!editForm) return
    setEditForm(prev => {
      if (!prev) return null
      return {
        ...prev,
        children: [...prev.children, { id: '', ecole: '', niveau: '', genre: '' }]
      }
    })
  }

  const removeChild = (index: number) => {
    if (!editForm || editForm.children.length <= 1) return
    setEditForm(prev => {
      if (!prev) return null
      return {
        ...prev,
        children: prev.children.filter((_, i) => i !== index)
      }
    })
  }

  const handleSaveChanges = async () => {
    if (!editForm || !editingOrder) return

    setIsUpdating(true)
    try {
      // Update existing children
      const updatePromises = editForm.children
        .filter(child => child.id) // Only existing children
        .map(child => {
          const originalChild = editingOrder.children.find(c => c.id === child.id)
          if (!originalChild) return Promise.resolve()

          return supabase
            .from('students')
            .update({
              nom: editForm.nom.trim(),
              ecole: child.ecole.trim(),
              niveau: child.niveau.trim(),
              genre: child.genre || null,
              email: editForm.email.trim(),
              telephone: editForm.telephone.trim(),
              avance: editForm.avance && editForm.avance.trim() ? parseFloat(editForm.avance) : null,
              note: editForm.note.trim(),
              couverture_demandee: editForm.couverture_demandee,
            })
            .eq('id', child.id)
        })

      // Insert new children
      const newChildren = editForm.children.filter(child => !child.id)
      const insertPromises = newChildren.map(async (child) => {
        // Generate unique code for new child
        let newCode = generateCode()
        let codeExists = true
        let attempts = 0
        
        while (codeExists && attempts < 20) {
          const { data: existingCode } = await supabase
            .from('students')
            .select('code')
            .eq('code', newCode)
            .maybeSingle()
          
          if (!existingCode) {
            codeExists = false
          } else {
            attempts++
            newCode = generateCode()
          }
        }
        
        if (attempts >= 20) {
          throw new Error('Impossible de générer un code unique')
        }

        return supabase
          .from('students')
          .insert([{
            code: newCode,
            nom: editForm.nom.trim(),
            ecole: child.ecole.trim(),
            niveau: child.niveau.trim(),
            genre: child.genre || null,
            email: editForm.email.trim(),
            telephone: editForm.telephone.trim(),
            avance: editForm.avance && editForm.avance.trim() ? parseFloat(editForm.avance) : null,
            note: editForm.note.trim(),
            couverture_demandee: editForm.couverture_demandee,
          }])
      })

      // Delete removed children
      const removedChildren = editingOrder.children.filter(originalChild => 
        !editForm.children.some(formChild => formChild.id === originalChild.id)
      )
      const deletePromises = removedChildren.map(child =>
        supabase
          .from('students')
          .delete()
          .eq('id', child.id)
      )

      await Promise.all([...updatePromises, ...insertPromises, ...deletePromises])
      
      // Reload data
      await loadRecentOrders()
      handleCancelEdit()
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Erreur lors de la mise à jour de la commande')
    } finally {
      setIsUpdating(false)
    }
  }

  const generateCode = (): string => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const numbers = '0123456789'
    
    const letter1 = letters[Math.floor(Math.random() * letters.length)]
    const letter2 = letters[Math.floor(Math.random() * letters.length)]
    const number1 = numbers[Math.floor(Math.random() * numbers.length)]
    const number2 = numbers[Math.floor(Math.random() * numbers.length)]
    
    return letter1 + letter2 + number1 + number2
  }

  useEffect(() => {
    loadEcoles()
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('recent_orders')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'students'
        }, 
        () => {
          loadRecentOrders()
        }
      )
      .subscribe()

    // Set up periodic refresh every 3 minutes
    const refreshInterval = setInterval(() => {
      loadRecentOrders()
    }, 180000)

    return () => {
      subscription.unsubscribe()
      clearInterval(refreshInterval)
    }
  }, [])

  useEffect(() => {
    loadRecentOrders()
  }, [])

  useEffect(() => {
    filterGroupedOrders()
  }, [groupedOrders, searchCode, searchName])

  const handleManualRefresh = () => {
    loadRecentOrders()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  // Show edit form if editing
  if (editingOrder && editForm) {
    return (
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={handleCancelEdit}
            className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            ← Annuler
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            Modifier la commande de {editingOrder.nom}
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="space-y-6">
            {/* Customer Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Nom de l'élève ou parent *
              </label>
              <input
                type="text"
                required
                value={editForm.nom}
                onChange={(e) => handleFormChange('nom', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Children Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-gray-900">
                  Enfant(s) - École et Niveau *
                </label>
                <button
                  type="button"
                  onClick={addChild}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors text-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Ajouter</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {editForm.children.map((child, index) => (
                  <div key={index} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900">
                        Enfant {index + 1} {child.id && `(Code: ${editingOrder.children.find(c => c.id === child.id)?.code || 'N/A'})`}
                      </h4>
                      {editForm.children.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeChild(index)}
                          className="text-red-700 hover:text-red-900 text-sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          École *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={child.ecole}
                            onChange={(e) => handleChildChange(index, 'ecole', e.target.value)}
                            onFocus={() => {
                              if (ecoles.length > 0) {
                                setActiveChildIndex(index)
                                setShowEcoleDropdown(true)
                              }
                            }}
                            onBlur={() => setTimeout(() => {
                              setShowEcoleDropdown(false)
                              setActiveChildIndex(null)
                            }, 200)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-all text-sm ${
                              child.ecole && !ecoles.includes(child.ecole)
                                ? 'border-red-500 focus:ring-red-500 bg-red-100' 
                                : 'border-gray-300 focus:ring-blue-500'
                            }`}
                            placeholder="Tapez pour rechercher"
                          />
                          {child.ecole && !ecoles.includes(child.ecole) && (
                            <p className="mt-1 text-xs text-red-800">
                              Sélectionnez une école dans la liste
                            </p>
                          )}
                          {showEcoleDropdown && activeChildIndex === index && filteredEcoles.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-400 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                              {filteredEcoles.map((ecole) => (
                                <button
                                  key={ecole}
                                  type="button"
                                  onClick={() => handleEcoleSelect(ecole, index)}
                                  className="w-full px-3 py-2 text-left hover:bg-blue-100 focus:bg-blue-100 focus:outline-none transition-colors border-b border-gray-200 last:border-b-0 text-sm"
                                >
                                  {ecole}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Niveau *
                        </label>
                        <select
                          required
                          value={child.niveau}
                          onChange={(e) => handleChildChange(index, 'niveau', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                        >
                          <option value="">Sélectionnez</option>
                          <option value="PS">PS</option>
                          <option value="MS">MS</option>
                          <option value="GS">GS</option>
                          <option value="CP">CP</option>
                          <option value="CE1">CE1</option>
                          <option value="CE2">CE2</option>
                          <option value="CM1">CM1</option>
                          <option value="CM2">CM2</option>
                          <option value="CE6">CE6</option>
                          <option value="CE7">CE7</option>
                          <option value="CE8">CE8</option>
                          <option value="CE9">CE9</option>
                          <option value="TC">TC</option>
                          <option value="1BAC">1BAC</option>
                          <option value="2BAC">2BAC</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Genre
                      </label>
                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={() => handleChildChange(index, 'genre', 'fille')}
                          className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                            child.genre === 'fille'
                              ? 'bg-pink-200 text-pink-900 border-2 border-pink-400'
                              : 'bg-gray-200 text-gray-900 hover:bg-gray-300 border-2 border-transparent'
                          }`}
                        >
                          Fille
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChildChange(index, 'genre', 'garcon')}
                          className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                            child.genre === 'garcon'
                              ? 'bg-blue-200 text-blue-900 border-2 border-blue-400'
                              : 'bg-gray-200 text-gray-900 hover:bg-gray-300 border-2 border-transparent'
                          }`}
                        >
                          Garçon
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={editForm.telephone}
                  onChange={(e) => handleFormChange('telephone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Couverture */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-4">
                Couverture Demandée:
              </label>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  type="button"
                  onClick={() => handleFormChange('couverture_demandee', true)}
                  className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                    editForm.couverture_demandee
                      ? 'bg-green-700 text-white shadow-md'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  <span>Oui</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFormChange('couverture_demandee', false)}
                  className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                    !editForm.couverture_demandee
                      ? 'bg-red-700 text-white shadow-md'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  <span>Non</span>
                </button>
              </div>
            </div>

            {/* Avance and Note */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Avance (DHS)
                </label>
                <input
                  type="number"
                  value={editForm.avance}
                  onChange={(e) => handleFormChange('avance', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Note
                </label>
                <textarea
                  value={editForm.note}
                  onChange={(e) => handleFormChange('note', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="Remarques ou instructions spéciales..."
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex space-x-4">
              <button
                onClick={handleSaveChanges}
                disabled={isUpdating}
                className="flex-1 bg-blue-800 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-900 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isUpdating ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>Sauvegarder</span>
                  </>
                )}
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center space-x-2"
              >
                <X className="h-5 w-5" />
                <span>Annuler</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => onNavigate('espace-client')}
          className="group flex items-center space-x-2 px-6 py-3 bg-white/80 backdrop-blur-sm text-slate-700 rounded-xl font-medium hover:bg-white hover:shadow-lg transition-all duration-300 border border-slate-200/50"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Retour à l'Espace Client</span>
        </button>
      </div>

      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-6">
          <Edit className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3">
          Correction
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Gérez les 50 dernières commandes
        </p>
        <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>MAJ: {lastRefresh.toLocaleTimeString('fr-FR')}</span>
          </div>
          <button
            onClick={handleManualRefresh}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-end mb-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              🔍 Recherche par code
            </label>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchCode}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
                    setSearchCode(value)
                  }}
                  placeholder="AB12"
                  className="w-full pl-10 pr-3 py-3 bg-white/90 border-0 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all text-center font-mono text-base tracking-wider uppercase shadow-lg"
                  maxLength={4}
                />
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              👤 Recherche par nom
            </label>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Nom du client"
                  className="w-full pl-10 pr-3 py-3 bg-white/90 border-0 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:bg-white transition-all text-base shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          {searchCode && (
            <button
              onClick={() => setSearchCode('')}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors text-xs font-medium"
            >
              <span>Code: {searchCode}</span>
              <X className="w-3 h-3" />
            </button>
          )}
          
          {searchName && (
            <button
              onClick={() => setSearchName('')}
              className="flex items-center space-x-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors text-xs font-medium"
            >
              <span>Nom: {searchName}</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        
        {(searchCode || searchName) && (
          <div className="mt-3 p-3 bg-slate-100 rounded-lg">
            <div className="flex items-center space-x-2 text-slate-700">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium">
                {filteredGroupedOrders.length} sur {groupedOrders.length} commandes affichées
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Orders Grid */}
      <div className="space-y-4">
        {filteredGroupedOrders.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-slate-400 to-slate-500 rounded-xl shadow-lg mb-4">
              <Package className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              {groupedOrders.length === 0 ? 'Aucune commande récente' : 'Aucun résultat'}
            </h3>
            <p className="text-sm text-slate-600">
              {groupedOrders.length === 0 
                ? 'Les commandes récentes apparaîtront ici automatiquement' 
                : 'Essayez de modifier vos critères de recherche'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredGroupedOrders.map((order, orderIndex) => (
              <div key={orderIndex} className="group bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-5 hover:shadow-2xl hover:bg-white/80 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">{order.nom}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {order.children.length} enfant{order.children.length > 1 ? 's' : ''}
                            </span>
                            <span className="text-slate-500 text-xs">
                              {new Date(order.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Children Cards */}
                    <div className="grid gap-3 mb-4">
                      {order.children.map((child, childIndex) => (
                        <div key={child.id} className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200/50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
                                #{child.code}
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium shadow-sm ${
                                child.liste_prete
                                  ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' 
                                  : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
                              }`}>
                                {child.liste_prete ? '✓ Prête' : '⏳ En attente'}
                              </span>
                              {child.liste_prete && child.rangee && child.niveau_rangement && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-400 to-pink-500 text-white shadow-sm">
                                  📍 {child.rangee} N{child.niveau_rangement}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-slate-700">
                            <div className="flex items-center space-x-2">
                              <School className="h-3 w-3 text-slate-500" />
                              <span className="text-sm font-medium">{child.ecole}</span>
                              <span className="text-slate-500">•</span>
                              <span className="text-sm font-medium">{child.niveau}</span>
                            </div>
                            {child.genre && (
                              <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${child.genre === 'fille' ? 'bg-pink-400' : 'bg-blue-400'}`}></div>
                                <span className="text-xs font-medium">
                                  {child.genre === 'fille' ? 'Fille' : 'Garçon'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Contact & Info Grid */}
                    {/* Compact Contact & Info */}
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-3 border border-slate-200/50">
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        {/* Contact */}
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="font-semibold text-slate-800">Contact:</span>
                          </div>
                          <div className="flex items-center space-x-3 text-slate-600">
                            {order.email && (
                              <div className="flex items-center space-x-1">
                                <span>📧</span>
                                <span>{order.email}</span>
                              </div>
                            )}
                            {order.telephone && (
                              <div className="flex items-center space-x-1">
                                <span>📱</span>
                                <span>{order.telephone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Payment */}
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="font-semibold text-slate-800">Avance:</span>
                          </div>
                          <span className="font-bold text-green-700">{order.avance || 0} DHS</span>
                        </div>
                        
                        {/* Couverture */}
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${order.couverture_demandee ? 'bg-purple-500' : 'bg-slate-400'}`}></div>
                            <span className="font-semibold text-slate-800">Couverture:</span>
                          </div>
                          <span className={`font-bold ${order.couverture_demandee ? 'text-purple-700' : 'text-slate-600'}`}>
                            {order.couverture_demandee ? '✓ Demandée' : '✗ Non demandée'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-3 flex justify-end space-x-2">
                      {/* Print Button - Only for first 10 orders */}
                      {orderIndex < 10 && (
                        <button
                          onClick={() => handlePrint(order)}
                          className="group/btn flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          <Printer className="h-3 w-3 group-hover/btn:scale-110 transition-transform duration-300" />
                          <span className="text-sm font-medium">Imprimer</span>
                        </button>
                      )}
                      
                      {/* Modifier Button */}
                      <button
                        onClick={() => handleEditOrder(order)}
                        className="group/btn flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <Edit className="h-3 w-3 group-hover/btn:rotate-12 transition-transform duration-300" />
                        <span className="text-sm font-medium">Modifier</span>
                      </button>
                    </div>
                    
                    {/* Note */}
                    {order.note && (
                      <div className="mt-4 bg-gradient-to-r from-amber-50 to-yellow-100 rounded-xl p-4 border border-amber-200/50">
                        <h4 className="text-sm font-semibold text-slate-800 mb-2 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                          <span>Note</span>
                        </h4>
                        <p className="text-xs text-slate-700 leading-relaxed">{order.note}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  )
}

export default Correction