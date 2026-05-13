import React, { useState } from 'react'
import { BookOpen, Search, BarChart3, School, ArrowRight, Users, CreditCard as Edit, KeyRound } from 'lucide-react'
import SimpleAuth from './components/SimpleAuth'
import ClientForm from './components/ClientForm'
import EmployeeSearch from './components/EmployeeSearch'
import ManagerDashboard from './components/ManagerDashboard'
import EcoleManagement from './components/EcoleManagement'
import FollowUp from './components/FollowUp'
import Correction from './components/Correction'
import CouverturePage from './components/CouverturePage'
import ZakariaPage from './components/ZakariaPage'
type Page = 'client' | 'employee' | 'manager' | 'ecole' | 'home' | 'espace-client' | 'follow-up' | 'correction' | 'couverture' | 'zakaria'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [isEspaceClientAuthenticated, setIsEspaceClientAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<string>('')

  const handlePageSelect = (pageId: Page) => {
    setCurrentPage(pageId)
    // Reset authentication state when going back to home
    if (pageId === 'home') {
      setIsEspaceClientAuthenticated(false)
      setCurrentUser('')
    }
  }

  const renderHomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-indigo-100 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <BookOpen className="h-16 w-16 text-gray-900" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Librairie 2B
          </h1>
          <p className="text-lg md:text-xl text-gray-800 max-w-2xl mx-auto">
            Système de gestion des livres scolaires. Sélectionnez votre espace pour commencer.
          </p>
        </div>

        {/* Page Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Espace Client */}
          <button
            onClick={() => {
              if (isEspaceClientAuthenticated) {
                handlePageSelect('espace-client')
              } else {
                setCurrentPage('espace-client-auth')
              }
            }}
            className="bg-white rounded-2xl p-8 text-left hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-blue-200 backdrop-blur-sm"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="p-4 rounded-xl bg-blue-100 shadow-lg">
                <Users className="h-8 w-8 text-blue-800" />
              </div>
              <ArrowRight className="h-6 w-6 text-gray-600" />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Espace Client
            </h3>
            
            <p className="text-gray-800 mb-4 leading-relaxed">
              Accès aux services clients : commandes, gestion et administration
            </p>
            
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isEspaceClientAuthenticated 
                ? 'bg-green-200 text-green-900' 
                : 'bg-yellow-200 text-yellow-900'
            }`}>
              {isEspaceClientAuthenticated ? 'Connecté' : 'Connexion requise'}
            </div>
          </button>

          {/* Espace Adjoint */}
          <button
            onClick={() => handlePageSelect('employee')}
            className="bg-white rounded-2xl p-8 text-left hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-green-200 backdrop-blur-sm"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="p-4 rounded-xl bg-green-100 shadow-lg">
                <Search className="h-8 w-8 text-green-800" />
              </div>
              <ArrowRight className="h-6 w-6 text-gray-600" />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Espace Adjoint
            </h3>
            
            <p className="text-gray-800 mb-4 leading-relaxed">
              Recherchez et gérez les commandes
            </p>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p className="text-sm">
            © 2025 Librairie 2B - Système de gestion des livres scolaires
          </p>
        </div>
      </div>
    </div>
  )

  const renderEspaceClientPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-indigo-100 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Users className="h-16 w-16 text-gray-900" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Espace Client
          </h1>
          <p className="text-lg md:text-xl text-gray-800 max-w-2xl mx-auto">
            Choisissez le service dont vous avez besoin
          </p>
        </div>

        {/* Back Button */}
        <div className="mb-8">
          <button
            onClick={() => setCurrentPage('home')}
            className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            ← Retour au menu principal
          </button>
        </div>

        {/* Service Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Commande Client */}
          <button
            onClick={() => handlePageSelect('client')}
            className="bg-white rounded-2xl p-8 text-left hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-blue-200 backdrop-blur-sm"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="p-4 rounded-xl bg-blue-100 shadow-lg">
                <BookOpen className="h-8 w-8 text-blue-800" />
              </div>
              <ArrowRight className="h-6 w-6 text-gray-600" />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Commande Client
            </h3>
            
            <p className="text-gray-800 mb-4 leading-relaxed">
              Passez votre commande de livres scolaires
            </p>
            
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-200 text-green-900">
              Accès libre
            </div>
          </button>

          {/* Follow Up */}
          <button
            onClick={() => handlePageSelect('follow-up')}
            className="bg-white rounded-2xl p-8 text-left hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-indigo-200 backdrop-blur-sm"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="p-4 rounded-xl bg-indigo-100 shadow-lg">
                <Search className="h-8 w-8 text-indigo-800" />
              </div>
              <ArrowRight className="h-6 w-6 text-gray-600" />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Follow Up
            </h3>
            
            <p className="text-gray-800 mb-4 leading-relaxed">
              Suivez le statut de votre commande
            </p>
            
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-200 text-green-900">
              Accès libre
            </div>
          </button>

          {/* Correction */}
          <button
            onClick={() => handlePageSelect('correction')}
            className="bg-white rounded-2xl p-8 text-left hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-orange-200 backdrop-blur-sm"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="p-4 rounded-xl bg-orange-100 shadow-lg">
                <Edit className="h-8 w-8 text-orange-800" />
              </div>
              <ArrowRight className="h-6 w-6 text-gray-600" />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Correction
            </h3>
            
            <p className="text-gray-800 mb-4 leading-relaxed">
              Consultez vos commandes récentes groupées
            </p>
            
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-200 text-green-900">
              Accès libre
            </div>
          </button>

          {/* Gestion des Écoles */}
          <button
            onClick={() => handlePageSelect('ecole')}
            className="bg-white rounded-2xl p-8 text-left hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-orange-200 backdrop-blur-sm"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="p-4 rounded-xl bg-orange-100 shadow-lg">
                <School className="h-8 w-8 text-orange-800" />
              </div>
              <ArrowRight className="h-6 w-6 text-gray-600" />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Gestion des Écoles
            </h3>
            
            <p className="text-gray-800 mb-4 leading-relaxed">
              Ajoutez ou supprimez des écoles
            </p>
            
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-200 text-green-900">
              Accès libre
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Gestionnaire */}
          {currentUser !== 'lib2b@gmail.com' && (
          <button
            onClick={() => handlePageSelect('manager')}
            className="bg-white rounded-2xl p-8 text-left hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-purple-200 backdrop-blur-sm"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="p-4 rounded-xl bg-purple-100 shadow-lg">
                <BarChart3 className="h-8 w-8 text-purple-800" />
              </div>
              <ArrowRight className="h-6 w-6 text-gray-600" />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Gestionnaire
            </h3>
            
            <p className="text-gray-800 mb-4 leading-relaxed">
              Tableau de bord et statistiques
            </p>
            
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-200 text-green-900">
              Accès libre
            </div>
          </button>
          )}

          {/* Couverture - Only for aichabenzangue@gmail.com */}
          {(currentUser === 'aichabenzangue@gmail.com' || currentUser === 'lib2b@gmail.com') && (
          <button
            onClick={() => handlePageSelect('couverture')}
            className="bg-white rounded-2xl p-8 text-left hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-purple-200 backdrop-blur-sm"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="p-4 rounded-xl bg-purple-100 shadow-lg">
                <BookOpen className="h-8 w-8 text-purple-800" />
              </div>
              <ArrowRight className="h-6 w-6 text-gray-600" />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Couverture
            </h3>
            
            <p className="text-gray-800 mb-4 leading-relaxed">
              Commandes avec couverture demandée
            </p>
            
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-200 text-green-900">
              Accès libre
            </div>
          </button>
          )}

          {/* Zakaria - credential management, only for admin */}
          {currentUser === 'aichabenzangue@gmail.com' && (
          <button
            onClick={() => handlePageSelect('zakaria')}
            className="bg-white rounded-2xl p-8 text-left hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-gray-300 backdrop-blur-sm"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="p-4 rounded-xl bg-gray-100 shadow-lg">
                <KeyRound className="h-8 w-8 text-gray-800" />
              </div>
              <ArrowRight className="h-6 w-6 text-gray-600" />
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Zakaria
            </h3>

            <p className="text-gray-800 mb-4 leading-relaxed">
              Gestion des identifiants de connexion
            </p>

            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-900">
              Administration
            </div>
          </button>
          )}

        </div>
      </div>
    </div>
  )

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return renderHomePage()
      case 'espace-client-auth':
        return (
          <SimpleAuth 
            onAuthSuccess={() => {
              setIsEspaceClientAuthenticated(true)
              // Determine user type based on current auth attempt
              // This will be set by the auth component
              setCurrentPage('espace-client')
            }}
            title="Espace Client"
            description="Connectez-vous pour accéder aux services clients"
            onUserIdentified={setCurrentUser}
          />
        )
      case 'espace-client':
        return isEspaceClientAuthenticated ? renderEspaceClientPage() : renderHomePage()
      case 'client':
        return isEspaceClientAuthenticated ? <ClientForm onNavigate={setCurrentPage} /> : renderHomePage()
      case 'employee':
        return <EmployeeSearch />
      case 'follow-up':
        return isEspaceClientAuthenticated ? <FollowUp onNavigate={setCurrentPage} /> : renderHomePage()
      case 'manager':
        return (isEspaceClientAuthenticated && currentUser !== 'lib2b@gmail.com') ? <ManagerDashboard onNavigate={setCurrentPage} /> : renderHomePage()
      case 'correction':
        return isEspaceClientAuthenticated ? <Correction onNavigate={setCurrentPage} /> : renderHomePage()
      case 'ecole':
        return isEspaceClientAuthenticated ? <EcoleManagement onNavigate={setCurrentPage} /> : renderHomePage()
      case 'couverture':
        return (isEspaceClientAuthenticated && (currentUser === 'aichabenzangue@gmail.com' || currentUser === 'lib2b@gmail.com')) ? <CouverturePage onNavigate={setCurrentPage} currentUser={currentUser} /> : renderHomePage()
      case 'zakaria':
        return (isEspaceClientAuthenticated && currentUser === 'aichabenzangue@gmail.com') ? <ZakariaPage onNavigate={setCurrentPage} /> : renderHomePage()
      default:
        return renderHomePage()
    }
  }

  // Show back button and header only when not on home page
  const showNavigation = currentPage !== 'home' && currentPage !== 'espace-client' && currentPage !== 'espace-client-auth' && (
    (currentPage === 'employee') || 
    (currentPage === 'follow-up' && isEspaceClientAuthenticated) ||
    (currentPage === 'correction' && isEspaceClientAuthenticated) ||
    (currentPage === 'ecole' && isEspaceClientAuthenticated) ||
    (currentPage === 'couverture' && isEspaceClientAuthenticated) ||
    (currentPage === 'client' && isEspaceClientAuthenticated) || 
    (currentPage === 'manager' && isEspaceClientAuthenticated) ||
    (currentPage === 'zakaria' && isEspaceClientAuthenticated)
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-indigo-100">
      {/* Header - Only show when navigation should be visible */}
      {showNavigation && (
        <header className="bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 shadow-lg border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={() => setCurrentPage('home')}
                className="flex items-center space-x-3 text-gray-100 hover:text-white transition-colors"
              >
                <BookOpen className="h-8 w-8" />
                <h1 className="text-xl font-bold">
                  Librairie 2B
                </h1>
              </button>
              
              <button
                onClick={() => setCurrentPage('home')}
                className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={showNavigation ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" : ""}>
        {renderPage()}
      </main>
    </div>
  )
}

export default App