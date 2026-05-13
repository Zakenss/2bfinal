import React, { useState, useEffect } from 'react'
import { BookOpen, Check, Download, Printer, X, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'

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
        console.log('Loading écoles from Supabase...')
        const { data, error } = await supabase
          .from('ecoles')
          .select('nom_ecole')
        
        console.log('Supabase response:', { data, error })
        
        if (error) {
          console.error('Supabase error:', error)
          return
        }
        
        if (data && data.length > 0) {
          const ecoleNames = data.map(item => item.nom_ecole).filter(Boolean)
          console.log('Loaded écoles:', ecoleNames)
          setEcoles(ecoleNames)
          
          // Force show dropdown if we have data and field is focused
          if (ecoleNames.length > 0 && document.activeElement?.id === 'ecole') {
            setShowDropdown(true)
          }
        } else {
          console.log('No data returned from Supabase')
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
    // Generate a 4-character code: 2 letters followed by 2 numbers (e.g., AB12)
    // This gives us 26^2 * 10^2 = 67,600 possible combinations
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const numbers = '0123456789'
    
    // Generate 2 random letters
    const letter1 = letters[Math.floor(Math.random() * letters.length)]
    const letter2 = letters[Math.floor(Math.random() * letters.length)]
    
    // Generate 2 random numbers
    const number1 = numbers[Math.floor(Math.random() * numbers.length)]
    const number2 = numbers[Math.floor(Math.random() * numbers.length)]
    
    const code = letter1 + letter2 + number1 + number2
    
    return code
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    console.log('Form submission started', formData)

    try {
      // Validate required fields before submission
      if (!formData.nom.trim()) {
        throw new Error('Le nom est requis')
      }
      if (formData.children.length === 0 || !formData.children[0].ecole.trim()) {
        throw new Error('Au moins une école est requise')
      }
      if (formData.children.length === 0 || !formData.children[0].niveau.trim()) {
        throw new Error('Au moins un niveau est requis')
      }
      
      // Validate all children have valid écoles
      for (let i = 0; i < formData.children.length; i++) {
        const child = formData.children[i]
        if (!child.ecole.trim() || !child.niveau.trim()) {
          throw new Error(`Veuillez remplir l'école et le niveau pour l'enfant ${i + 1}`)
        }
        if (!ecoles.includes(child.ecole)) {
          throw new Error(`Veuillez sélectionner une école valide dans la liste pour l'enfant ${i + 1}`)
        }
      }

      const code = generateCode()
      
      console.log('Generated code:', code)
      
      // Generate unique codes for each child
      const childCodes: string[] = []
      
      for (let i = 0; i < formData.children.length; i++) {
        let childCode = generateCode()
        let codeExists = true
        let attempts = 0
        
        // Check if code already exists and regenerate if needed
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
            console.log('Code exists, regenerating:', childCode, 'Attempt:', attempts)
          }
        }
        
        if (attempts >= 20) {
          throw new Error(`Impossible de générer un code unique pour l'enfant ${i + 1}. Veuillez réessayer.`)
        }
        
        childCodes.push(childCode)
      }
      
      console.log('Generated codes for children:', childCodes)
      
      // Insert each child as a separate record
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

        return supabase
          .from('students')
          .insert([submissionData])
      })

      console.log('Prepared submission data for', formData.children.length, 'children')

      const results = await Promise.all(submissionPromises)
      
      // Check for any errors
      const errors = results.filter(result => result.error)
      if (errors.length > 0) {
        console.error('Supabase errors:', errors)
        throw errors[0].error
      }

      console.log('All submissions successful')

      // Send webhook notifications for each child
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

        // Send all webhooks (don't await to avoid blocking the UI)
        Promise.all(webhookPromises).catch(webhookError => {
          console.warn('Webhook notifications failed:', webhookError);
          // Don't show error to user as the main form submission was successful
        });
      } catch (webhookError) {
        console.warn('Webhook setup failed:', webhookError);
        // Don't show error to user as the main form submission was successful
      }

      console.log('Form submission successful, setting result')
      
      // Ensure we have a deep copy of form data for the result
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

      // Reset form
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
      console.error('Error submitting form:', error)
      
      // Provide more specific error messages
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
      
      setSubmissionResult({
        success: false,
        message: errorMessage
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    // Show dropdown when typing in école field
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
    if (!currentChild?.ecole.trim()) {
      return ecoles
    }
    return ecoles.filter(ecole => 
      ecole.toLowerCase().includes(currentChild.ecole.toLowerCase())
    )
  }

  const handlePrint = () => {
    try {
      // Ensure the print section is visible and properly formatted
      const printSection = document.getElementById('print-section')
      if (!printSection) {
        console.error('Print section not found')
        alert('Erreur: Section d\'impression non trouvée')
        return
      }

      // Add a small delay to ensure the DOM is fully rendered
      setTimeout(() => {
        try {
          window.print()
        } catch (printError) {
          console.error('Print error:', printError)
          alert('Erreur lors de l\'impression. Veuillez utiliser Ctrl+P pour imprimer manuellement.')
        }
      }, 100)
    } catch (error) {
      console.error('Print preparation error:', error)
      alert('Erreur lors de la préparation de l\'impression.')
    }
  }

  if (submissionResult?.success) {
    return (
      <div className="max-w-md mx-auto">
        {/* Success message for screen readers */}
        <div className="sr-only" role="status" aria-live="polite">
          Commande soumise avec succès. Codes de référence: {submissionResult.codes?.join(', ')}
        </div>
        
        {/* Print Section - Optimized for 75mm thermal printer */}
        <div id="print-section" className="bg-white p-1 text-xs leading-tight">
          <div className="mb-1">
            <div className="mb-1 text-center">
              <h1 className="text-lg font-bold text-gray-900 mb-1">
                LIBRAIRIE 2B
              </h1>
              <div className="text-xs text-gray-800 mb-1 leading-tight">
                <p>
                  {new Date(Date.now() - 60 * 60 * 1000).toLocaleDateString('fr-FR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p>
                {new Date(Date.now() - 60 * 60 * 1000).toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
                </p>
              </div>
            </div>
            
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
              <Check className="h-4 w-4 text-green-600" />
            </div>
            
            <h2 className="text-sm font-bold text-gray-900 mb-1 text-center">
              Commande Confirmée
            </h2>
            
            {/* Codes for each child */}
            {submissionResult.formData?.childrenWithCodes && submissionResult.formData.childrenWithCodes.length > 0 && (
              <div className="space-y-1 mb-1">
                {submissionResult.formData.childrenWithCodes.map((child, index) => (
                  <div key={index} className="bg-blue-100 rounded p-1 mb-1">
                    <p className="text-xs font-medium text-blue-800 mb-1 leading-tight">
                      {submissionResult.formData?.childrenWithCodes && submissionResult.formData.childrenWithCodes.length > 1 
                        ? `Enfant ${index + 1}:` 
                        : 'Votre code de référence:'}
                    </p>
                    <p className="text-lg font-bold text-blue-900 tracking-wider font-mono mb-1">
                      {child.code}
                    </p>
                    {submissionResult.formData?.childrenWithCodes && submissionResult.formData.childrenWithCodes.length > 1 && (
                      <p className="text-xs text-blue-800 leading-tight">
                        {child.ecole} - {child.niveau}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Order Details */}
            <div className="bg-gray-50 rounded p-1 mb-1 text-left">
              <h3 className="text-xs font-bold text-gray-900 mb-1 text-center border-b border-gray-300 pb-1">DÉTAILS</h3>
              <div className="space-y-1 text-xs leading-tight">
                <div className="flex justify-between items-start">
                  <span className="text-gray-700">Nom:</span>
                  <span className="font-medium text-gray-900 text-right flex-1 break-words">{submissionResult.formData?.nom}</span>
                </div>
                {submissionResult.formData?.telephone && (
                  <div className="flex justify-between items-start">
                    <span className="text-gray-700">Tél:</span>
                    <span className="font-medium text-gray-900 text-right flex-1">{submissionResult.formData.telephone}</span>
                  </div>
                )}
                {submissionResult.formData?.childrenWithCodes && submissionResult.formData.childrenWithCodes.map((child, index) => (
                  <div key={index} className="border-t border-gray-300 pt-1 mt-1">
                    <div className="text-center mb-1">
                      <span className="font-bold text-gray-900">
                        {submissionResult.formData?.childrenWithCodes && submissionResult.formData.childrenWithCodes.length > 1 
                          ? `ENFANT ${index + 1}` 
                          : 'ENFANT'}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-700">École:</span>
                      <span className="font-medium text-gray-900 text-right flex-1 break-words">{child.ecole}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-700">Niveau:</span>
                      <span className="font-medium text-gray-900 text-right flex-1">{child.niveau}</span>
                    </div>
                   <div className="flex justify-between items-start">
                     <span className="text-gray-700">Genre:</span>
                     <span className="font-medium text-gray-900 text-right flex-1">{submissionResult.formData?.children[index]?.genre === 'fille' ? 'Fille' : submissionResult.formData?.children[index]?.genre === 'garcon' ? 'Garçon' : ''}</span>
                   </div>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-700">Code:</span>
                      <span className="font-bold text-blue-900 text-right flex-1 font-mono">{child.code}</span>
                    </div>
                  </div>
                ))}
                {submissionResult.formData?.couverture_demandee && (
                  <div className="border-t border-gray-300 pt-1 mt-1">
                    <div className="flex justify-between items-start">
                      <span className="text-gray-700">Couverture:</span>
                      <span className="font-bold text-black text-right flex-1">DEMANDÉE</span>
                    </div>
                  </div>
                )}
                {submissionResult.formData?.avance && submissionResult.formData.avance !== '0' && (
                  <div className="border-t border-gray-300 pt-1 mt-1">
                    <div className="flex justify-between items-start">
                      <span className="text-gray-700">Avance:</span>
                      <span className="font-bold text-green-800 text-right flex-1">{submissionResult.formData.avance} DHS</span>
                    </div>
                  </div>
                )}
                {submissionResult.formData?.note && (
                  <div className="border-t border-gray-300 pt-1 mt-1">
                    <span className="font-bold text-gray-900">NOTE:</span>
                    <p className="font-medium text-gray-900 text-xs leading-tight break-words">{submissionResult.formData.note}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t-2 border-gray-400 pt-1">
              <p className="text-xs text-gray-800 leading-tight text-center">
                Merci pour votre confiance!
              </p>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
            aria-label="Imprimer le reçu de commande"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimer</span>
          </button>
        </div>

        <div className="print:hidden">
          <button
            onClick={() => setSubmissionResult(null)}
            className="text-blue-800 hover:text-blue-900 font-medium focus:outline-none focus:underline text-sm"
            aria-label="Créer une nouvelle commande"
          >
            Nouvelle commande
          </button>
          <button
            onClick={handleBackToHome}
            className="ml-4 text-blue-800 hover:text-blue-900 font-medium focus:outline-none focus:underline text-sm"
            aria-label="Retourner à la page d'accueil"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  // Show error message if submission failed
  if (submissionResult && !submissionResult.success) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={handleBackToHome}
            className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="h-8 w-8 text-red-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Erreur de Soumission
          </h2>
          
          <p className="text-gray-800 mb-6">
            {submissionResult.message}
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => setSubmissionResult(null)}
              className="w-full bg-blue-800 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-900 transition-colors"
            >
              Réessayer
            </button>
            <button
              onClick={() => onNavigate('espace-client')}
              className="w-full bg-gray-200 text-gray-900 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Retour à l'Espace Client
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="mb-6">
        <button
          onClick={() => onNavigate('espace-client')}
          className="px-4 py-2 bg-blue-200 text-blue-900 rounded-lg font-medium hover:bg-blue-300 transition-colors"
        >
          Retour à l'Espace Client
        </button>
      </div>

      <div className="text-center mb-8">
        <BookOpen className="h-12 w-12 text-blue-900 mx-auto mb-4" />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Commande de Liste de Livres
        </h1>
        <p className="text-sm md:text-base text-gray-800">
          Remplissez le formulaire ci-dessous pour soumettre votre liste de livres scolaires
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Name */}
          <div>
            <label htmlFor="nom" className="block text-sm font-semibold text-gray-900 mb-2">
              Nom de l'élève ou parent *
            </label>
            <input
              type="text"
              id="nom"
              name="nom"
              required
              value={formData.nom}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Entrez le nom complet"
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
              {formData.children.map((child, index) => (
                <div key={index} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">
                      Enfant {index + 1}
                    </h4>
                    {formData.children.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeChild(index)}
                        className="text-red-700 hover:text-red-900 text-sm"
                      >
                        <X className="h-4 w-4" />
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
                          onChange={(e) => handleChildInputChange(index, 'ecole', e.target.value)}
                          onFocus={() => {
                            if (ecoles.length > 0 && !isLoadingEcoles) {
                              setActiveChildIndex(index)
                              setShowDropdown(true)
                            }
                          }}
                          onBlur={() => setTimeout(() => {
                            setShowDropdown(false)
                            setActiveChildIndex(null)
                          }, 200)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-all text-sm ${
                            child.ecole && !ecoles.includes(child.ecole)
                              ? 'border-red-500 focus:ring-red-500 bg-red-100' 
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                          placeholder={isLoadingEcoles ? "Chargement..." : "Tapez pour rechercher"}
                          disabled={isLoadingEcoles}
                        />
                        {child.ecole && !ecoles.includes(child.ecole) && (
                          <p className="mt-1 text-xs text-red-800">
                            Sélectionnez une école dans la liste
                          </p>
                        )}
                        {showDropdown && activeChildIndex === index && ecoles.length > 0 && getFilteredEcoles().length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-400 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {getFilteredEcoles().map((ecole) => (
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
                        onChange={(e) => handleChildInputChange(index, 'niveau', e.target.value)}
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
                        onClick={() => handleChildInputChange(index, 'genre', 'fille')}
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
                        onClick={() => handleChildInputChange(index, 'genre', 'garcon')}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="votre.email@exemple.com"
              />
            </div>

            <div>
              <label htmlFor="telephone" className="block text-sm font-semibold text-gray-900 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                id="telephone"
                name="telephone"
                value={formData.telephone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="01 23 45 67 89"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-4">
              Couverture Demandée:
            </label>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                onClick={() => handleCouvertureChange(true)}
                className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                  formData.couverture_demandee
                    ? 'bg-green-700 text-white shadow-md'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                <span>Oui</span>
              </button>
              <button
                type="button"
                onClick={() => handleCouvertureChange(false)}
                className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                  !formData.couverture_demandee
                    ? 'bg-red-700 text-white shadow-md'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                <span>Non</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="avance" className="block text-sm font-semibold text-gray-900 mb-2">
                Avance (DHS)
              </label>
              <input
                type="number"
                id="avance"
                name="avance"
                value={formData.avance}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label htmlFor="note" className="block text-sm font-semibold text-gray-900 mb-2">
                Note
              </label>
              <textarea
                id="note"
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Remarques ou instructions spéciales..."
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-800 text-white py-3 md:py-4 px-6 rounded-lg font-semibold hover:bg-blue-900 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
          >
            {isSubmitting ? 'Envoi en cours...' : 'Soumettre la Commande'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ClientForm