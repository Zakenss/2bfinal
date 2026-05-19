import React, { useState, useEffect } from 'react'
import { BookOpen, Check, Download, Printer, X, Plus, School, User, Mail, Phone, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { buildReceiptHTML } from '../lib/receiptBuilder'

interface FormData {
  nom: string
  children: Array<{
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

interface ClientFormProps {
  onNavigate: (page: 'espace-client') => void
}

function ClientForm({ onNavigate }: ClientFormProps) {
  const [formData, setFormData] = useState<FormData>({
    nom: '',
    children: [{ ecole: '', niveau: '', genre: '' }],
    email: '',
    telephone: '',
    avance: '',
    note: '',
    couverture_demandee: false,
  })
  const [ecoles, setEcoles] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeChildIndex, setActiveChildIndex] = useState<number | null>(null)
  const [isLoadingEcoles, setIsLoadingEcoles] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean
    codes?: string[]
    message: string
    formData?: FormData & { childrenWithCodes?: Array<{ ecole: string, niveau: string, code: string }> }
  } | null>(null)
  const [isValidEcole, setIsValidEcole] = useState(false)

  const handleBackToHome = () => {
    window.location.reload()
  }

  useEffect(() => {
    const loadEcoles = async () => {
      setIsLoadingEcoles(true)
      try {
        const { data, error } = await supabase
          .from('ecoles')
          .select('nom_ecole')
        
        if (error) return
        
        if (data && data.length > 0) {
          const ecoleNames = data.map(item => item.nom_ecole).filter(Boolean)
          setEcoles(ecoleNames)
        }
      } catch (error) {
        console.error('Error loading écoles:', error)
      } finally {
        setIsLoadingEcoles(false)
      }
    }
    
    loadEcoles()
  }, [])

  const generateCode = (): string => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const numbers = '0123456789'
    const letter1 = letters[Math.floor(Math.random() * letters.length)]
    const letter2 = letters[Math.floor(Math.random() * letters.length)]
    const number1 = numbers[Math.floor(Math.random() * numbers.length)]
    const number2 = numbers[Math.floor(Math.random() * numbers.length)]
    return letter1 + letter2 + number1 + number2
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!formData.nom.trim()) throw new Error('Le nom est requis')
      if (formData.children.length === 0 || !formData.children[0].ecole.trim()) throw new Error('Au moins une école est requise')
      if (formData.children.length === 0 || !formData.children[0].niveau.trim()) throw new Error('Au moins un niveau est requis')
      
      for (let i = 0; i < formData.children.length; i++) {
        const child = formData.children[i]
        if (!child.ecole.trim() || !child.niveau.trim()) throw new Error(`Veuillez remplir l'école et le niveau pour l'enfant ${i + 1}`)
        if (!ecoles.includes(child.ecole)) throw new Error(`Veuillez sélectionner une école valide dans la liste pour l'enfant ${i + 1}`)
      }

      const childCodes: string[] = []
      
      for (let i = 0; i < formData.children.length; i++) {
        let childCode = generateCode()
        let codeExists = true
        let attempts = 0
        
        while (codeExists && attempts < 20) {
          const { data: existingCode } = await supabase
            .from('students')
            .select('code')
            .eq('code', childCode)
            .maybeSingle()
          
          if (!existingCode && !childCodes.includes(childCode)) {
            codeExists = false
          } else {
            attempts++
            childCode = generateCode()
          }
        }
        
        if (attempts >= 20) throw new Error(`Impossible de générer un code unique pour l'enfant ${i + 1}. Veuillez réessayer.`)
        childCodes.push(childCode)
      }
      
      const now = new Date().toISOString()
      const submissionPromises = formData.children.map((child, index) => {
        const submissionData = {
          id: crypto.randomUUID(),
          code: childCodes[index],
          nom: formData.nom.trim(),
          ecole: child.ecole.trim(),
          niveau: child.niveau.trim(),
          genre: child.genre || null,
          email: formData.email.trim() || null,
          telephone: formData.telephone.trim() || null,
          avance: (index === 0 && formData.avance && formData.avance.trim()) ? parseFloat(formData.avance) : null,
          note: formData.note.trim() || null,
          couverture_demandee: Boolean(formData.couverture_demandee),
          liste_prete: false,
          created_at: now,
        }

        return supabase.from('students').insert([submissionData])
      })

      const results = await Promise.all(submissionPromises)
      
      const errors = results.filter(result => result.error)
      if (errors.length > 0) throw errors[0].error

      try {
        const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-webhook`;
        const webhookHeaders = {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        };

        const webhookPromises = formData.children.map((child, index) => {
          const webhookPayload = {
            code: childCodes[index],
            nom: formData.nom.trim(),
            ecole: child.ecole.trim(),
            niveau: child.niveau.trim(),
            genre: child.genre,
            email: formData.email.trim(),
            telephone: formData.telephone.trim(),
            avance: formData.avance && formData.avance.trim() ? parseFloat(formData.avance) : null,
            note: formData.note.trim(),
            couverture_demandee: formData.couverture_demandee,
          };

          return fetch(webhookUrl, {
            method: 'POST',
            headers: webhookHeaders,
            body: JSON.stringify(webhookPayload),
          });
        });

        Promise.all(webhookPromises).catch(webhookError => {
          console.warn('Webhook notifications failed:', webhookError);
        });
      } catch (webhookError) {
        console.warn('Webhook setup failed:', webhookError);
      }

      const resultFormData = {
        nom: formData.nom.trim(),
        children: formData.children,
        childrenWithCodes: formData.children.map((child, index) => ({
          ecole: child.ecole.trim(),
          niveau: child.niveau.trim(),
          code: childCodes[index]
        })),
        email: formData.email.trim(),
        telephone: formData.telephone.trim(),
        avance: formData.avance.trim(),
        note: formData.note.trim(),
        couverture_demandee: formData.couverture_demandee,
      }

      setSubmissionResult({
        success: true,
        codes: childCodes,
        message: 'Votre liste de livres a été soumise avec succès!',
        formData: resultFormData
      })

      setFormData({
        nom: '',
        children: [{ ecole: '', niveau: '', genre: '' }],
        email: '',
        telephone: '',
        avance: '',
        note: '',
        couverture_demandee: false,
      })
      
    } catch (error) {
      let errorMessage = 'Une erreur est survenue. Veuillez réessayer.'
      if (error instanceof Error) {
        if (error.message.includes('nom est requis') || 
            error.message.includes('école est requise') || 
            error.message.includes('niveau est requis') ||
            error.message.includes('école valide')) {
          errorMessage = error.message
        } else if (error.message.includes('duplicate key')) {
          errorMessage = 'Ce code existe déjà. Veuillez réessayer.'
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Problème de connexion. Vérifiez votre connexion internet et réessayez.'
        } else {
          errorMessage = `Erreur: ${error.message}`
        }
      }
      setSubmissionResult({ success: false, message: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === 'nom' || name === 'email' || name === 'telephone' || name === 'avance' || name === 'note') {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleCouvertureChange = (value: boolean) => {
    setFormData(prev => ({ ...prev, couverture_demandee: value }))
  }

  const handleChildInputChange = (index: number, field: 'ecole' | 'niveau' | 'genre', value: string) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children.map((child, i) => 
        i === index ? { ...child, [field]: value } : child
      )
    }))

    if (field === 'ecole' && !isLoadingEcoles && ecoles.length > 0) {
      setActiveChildIndex(index)
      setShowDropdown(true)
    }
  }

  const handleEcoleSelect = (ecoleName: string, childIndex: number) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children.map((child, i) => 
        i === childIndex ? { ...child, ecole: ecoleName } : child
      )
    }))
    setShowDropdown(false)
    setActiveChildIndex(null)
  }

  const addChild = () => {
    setFormData(prev => ({
      ...prev,
      children: [...prev.children, { ecole: '', niveau: '', genre: '' }]
    }))
  }

  const removeChild = (index: number) => {
    if (formData.children.length > 1) {
      setFormData(prev => ({
        ...prev,
        children: prev.children.filter((_, i) => i !== index)
      }))
    }
  }

  const getFilteredEcoles = () => {
    if (activeChildIndex === null) return ecoles
    const currentChild = formData.children[activeChildIndex]
    if (!currentChild?.ecole.trim()) return ecoles
    return ecoles.filter(ecole => ecole.toLowerCase().includes(currentChild.ecole.toLowerCase()))
  }

  const handlePrint = () => {
    if (!submissionResult?.success || !submissionResult.formData) return
    const fd = submissionResult.formData
    const children = (fd.childrenWithCodes ?? []).map((child, i) => ({
      ecole: child.ecole,
      niveau: child.niveau,
      genre: fd.children[i]?.genre ?? null,
      code: child.code,
    }))
    const html = buildReceiptHTML({
      nom: fd.nom,
      telephone: fd.telephone || null,
      avance: fd.avance || null,
      note: fd.note || null,
      couverture_demandee: fd.couverture_demandee,
      children,
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

  if (submissionResult?.success) {
    const R = submissionResult
    const multiChild = (R.formData?.childrenWithCodes?.length ?? 0) > 1

    return (
      <div className="max-w-md mx-auto pt-8 px-4">
        {/* Success icon */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-espresso-900 mb-1">Commande Confirmée</h2>
          <p className="text-espresso-600 text-sm font-medium">Votre commande a été enregistrée avec succès.</p>
        </div>

        {/* Code cards */}
        <div className="space-y-3 mb-6">
          {R.formData?.childrenWithCodes?.map((child, index) => (
            <div key={index} className="bg-white border-2 border-espresso-900 rounded-2xl p-5 text-center shadow-book">
              <p className="text-xs font-bold uppercase tracking-widest text-espresso-500 mb-1">
                {multiChild ? `Enfant ${index + 1} — ` : ''}Code Référence
              </p>
              <p className="text-4xl font-mono font-bold tracking-widest text-espresso-900 my-2">
                {child.code}
              </p>
              {multiChild && (
                <p className="text-xs font-bold text-espresso-600 uppercase">
                  {child.ecole} — {child.niveau}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-parchment-100 rounded-2xl p-5 mb-6 border border-parchment-300 text-sm space-y-2">
          <div className="flex justify-between"><span className="font-bold text-espresso-500 uppercase tracking-widest text-xs">Client</span><span className="font-medium text-espresso-900">{R.formData?.nom}</span></div>
          {R.formData?.telephone && <div className="flex justify-between"><span className="font-bold text-espresso-500 uppercase tracking-widest text-xs">Téléphone</span><span className="font-medium">{R.formData.telephone}</span></div>}
          {R.formData?.avance && R.formData.avance !== '0' && <div className="flex justify-between"><span className="font-bold text-espresso-500 uppercase tracking-widest text-xs">Avance</span><span className="font-medium text-green-700">{R.formData.avance} DHS</span></div>}
          {R.formData?.couverture_demandee && <div className="flex justify-between"><span className="font-bold text-espresso-500 uppercase tracking-widest text-xs">Couverture</span><span className="font-medium">Oui</span></div>}
        </div>

        {/* Print button */}
        <button
          onClick={handlePrint}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3.5 bg-amber-600 text-white rounded-xl font-bold tracking-wide hover:bg-amber-700 transition-colors shadow-md text-sm uppercase mb-4"
        >
          <Printer className="h-5 w-5" />
          <span>Imprimer le reçu</span>
        </button>

        <div className="flex justify-center space-x-6 text-sm font-semibold uppercase tracking-wide">
          <button onClick={() => setSubmissionResult(null)} className="text-espresso-600 hover:text-amber-700 transition-colors">
            Nouvelle commande
          </button>
          <button onClick={handleBackToHome} className="text-espresso-600 hover:text-amber-700 transition-colors">
            Retour accueil
          </button>
        </div>
      </div>
    )
  }

  if (submissionResult && !submissionResult.success) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-10">
        <div className="bg-white rounded-2xl shadow-book border border-parchment-300 p-8 text-center">
          <div className="w-20 h-20 bg-terracotta-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-terracotta-200">
            <X className="h-10 w-10 text-terracotta-600" />
          </div>
          <h2 className="text-3xl font-heading font-bold text-espresso-900 mb-4">Erreur</h2>
          <p className="text-espresso-700 mb-8 text-lg">{submissionResult.message}</p>
          <div className="space-y-4">
            <button
              onClick={() => setSubmissionResult(null)}
              className="w-full bg-amber-600 text-white py-4 px-6 rounded-xl font-bold tracking-wide hover:bg-amber-700 transition-colors shadow-md uppercase text-sm"
            >
              Réessayer
            </button>
            <button
              onClick={handleBackToHome}
              className="w-full bg-parchment-200 text-espresso-800 py-4 px-6 rounded-xl font-bold tracking-wide hover:bg-parchment-300 transition-colors shadow-sm border border-parchment-300 uppercase text-sm"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pb-12">
      <div className="mb-8">
        <button
          onClick={() => onNavigate('espace-client')}
          className="px-5 py-2 bg-white border border-parchment-300 text-espresso-800 rounded-full font-semibold hover:bg-parchment-200 hover:text-espresso-900 transition-all shadow-sm text-sm uppercase tracking-wide"
        >
          ← Retour à l'Espace Client
        </button>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-espresso-900 mb-4">
          Nouvelle Commande
        </h1>
        <p className="text-lg text-espresso-600 font-medium">
          Remplissez le formulaire ci-dessous pour commander vos livres scolaires.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-book border border-parchment-300 overflow-hidden">
        <div className="bg-parchment-200 border-b border-parchment-300 px-8 py-5">
          <h2 className="text-xl font-heading font-bold text-espresso-900 flex items-center">
            <FileText className="h-5 w-5 mr-3 text-amber-700" />
            Informations de Commande
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-10">
          {/* Section 1: Parent info */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-espresso-500 border-b border-parchment-200 pb-2">Informations Client</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="nom" className="block text-sm font-bold text-espresso-800 mb-2">
                  Nom et Prénom *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-espresso-300" />
                  </div>
                  <input
                    type="text"
                    id="nom"
                    name="nom"
                    required
                    value={formData.nom}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 transition-colors bg-parchment-50 text-espresso-900 font-medium"
                    placeholder="Ex: Martin Dubois"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="telephone" className="block text-sm font-bold text-espresso-800 mb-2">
                  Téléphone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-espresso-300" />
                  </div>
                  <input
                    type="tel"
                    id="telephone"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 transition-colors bg-parchment-50 text-espresso-900 font-medium"
                    placeholder="Ex: 06 12 34 56 78"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-bold text-espresso-800 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-espresso-300" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 transition-colors bg-parchment-50 text-espresso-900 font-medium"
                    placeholder="votre.email@exemple.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Children info */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-parchment-200 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-widest text-espresso-500">Enfants (Écoles & Niveaux)</h3>
              <button
                type="button"
                onClick={addChild}
                className="flex items-center space-x-1 text-amber-700 hover:text-amber-800 font-bold text-sm tracking-wide transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>AJOUTER UN ENFANT</span>
              </button>
            </div>

            <div className="space-y-6">
              {formData.children.map((child, index) => (
                <div key={index} className="p-6 rounded-2xl bg-parchment-100 border border-parchment-300 relative">
                  {formData.children.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeChild(index)}
                      className="absolute top-4 right-4 p-2 text-terracotta-500 hover:bg-terracotta-100 rounded-full transition-colors"
                      title="Supprimer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  
                  <h4 className="text-base font-heading font-bold text-espresso-900 mb-4 flex items-center">
                    <div className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-xs mr-2 border border-amber-300">
                      {index + 1}
                    </div>
                    Enfant {index + 1}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-espresso-800 mb-2">
                        École *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <School className="h-5 w-5 text-espresso-300" />
                        </div>
                        <input
                          type="text"
                          required
                          value={child.ecole}
                          onChange={(e) => handleChildInputChange(index, 'ecole', e.target.value)}
                          onFocus={() => {
                            if (ecoles.length > 0) {
                              setActiveChildIndex(index)
                              setShowDropdown(true)
                            }
                          }}
                          onBlur={() => {
                            setTimeout(() => setShowDropdown(false), 200)
                          }}
                          className="w-full pl-12 pr-4 py-3.5 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 transition-colors bg-white text-espresso-900 font-medium"
                          placeholder={isLoadingEcoles ? "Chargement..." : "Ex: École Elbilia"}
                          disabled={isLoadingEcoles}
                        />
                        {showDropdown && activeChildIndex === index && getFilteredEcoles().length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border-2 border-parchment-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                            {getFilteredEcoles().map((ecole) => (
                              <button
                                key={ecole}
                                type="button"
                                onClick={() => handleEcoleSelect(ecole, index)}
                                className="w-full px-4 py-3 text-left hover:bg-parchment-100 focus:bg-parchment-100 transition-colors font-medium text-espresso-900 border-b border-parchment-100 last:border-0"
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
                        required
                        value={child.niveau}
                        onChange={(e) => handleChildInputChange(index, 'niveau', e.target.value)}
                        className="w-full px-4 py-3.5 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 transition-colors bg-white text-espresso-900 font-medium appearance-none"
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
                              name={`genre-${index}`}
                              value="fille"
                              checked={child.genre === 'fille'}
                              onChange={(e) => handleChildInputChange(index, 'genre', 'fille')}
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
                              name={`genre-${index}`}
                              value="garcon"
                              checked={child.genre === 'garcon'}
                              onChange={(e) => handleChildInputChange(index, 'genre', 'garcon')}
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
              ))}
            </div>
          </div>

          {/* Section 3: Extra options */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-espresso-500 border-b border-parchment-200 pb-2">Options Supplémentaires</h3>
            
            <div className="grid grid-cols-1 gap-6">
              <label className="flex items-start space-x-4 cursor-pointer group p-4 rounded-xl border-2 border-parchment-200 hover:border-amber-400 hover:bg-amber-50/30 transition-all">
                <div className="relative flex items-center justify-center w-6 h-6 border-2 border-parchment-400 rounded mt-0.5 group-hover:border-amber-500 transition-colors flex-shrink-0 bg-white">
                  <input
                    type="checkbox"
                    checked={formData.couverture_demandee}
                    onChange={(e) => handleCouvertureChange(e.target.checked)}
                    className="sr-only"
                  />
                  {formData.couverture_demandee && <Check className="h-4 w-4 text-amber-600" strokeWidth={3} />}
                </div>
                <div>
                  <span className="block font-bold text-espresso-900 mb-1">Je souhaite une couverture pour les livres</span>
                  <span className="block text-sm text-espresso-600">Cochez cette case si vous désirez que nous couvrions vos livres (service payant).</span>
                </div>
              </label>

              <div>
                <label htmlFor="avance" className="block text-sm font-bold text-espresso-800 mb-2">
                  Avance versée (DHS) - Optionnel
                </label>
                <div className="relative max-w-xs">
                  <input
                    type="number"
                    id="avance"
                    name="avance"
                    min="0"
                    step="10"
                    value={formData.avance}
                    onChange={handleInputChange}
                    className="w-full pl-4 pr-12 py-3.5 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 transition-colors bg-parchment-50 text-espresso-900 font-medium"
                    placeholder="0"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-espresso-500 font-bold">DHS</span>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="note" className="block text-sm font-bold text-espresso-800 mb-2">
                  Note ou instruction spéciale
                </label>
                <textarea
                  id="note"
                  name="note"
                  rows={3}
                  value={formData.note}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3.5 border-2 border-parchment-300 rounded-xl focus:ring-0 focus:border-amber-500 transition-colors bg-parchment-50 text-espresso-900 font-medium resize-none"
                  placeholder="Avez-vous une demande particulière ?"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-parchment-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-600 text-white py-4 md:py-5 px-8 rounded-xl font-bold uppercase tracking-wider hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl text-sm md:text-base"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Check className="h-6 w-6" />
                  <span>Confirmer la commande</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ClientForm