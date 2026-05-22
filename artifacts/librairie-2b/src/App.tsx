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
import AccessPage from './components/AccessPage'

type Page = 'client' | 'employee' | 'manager' | 'ecole' | 'home' | 'espace-client' | 'espace-client-auth' | 'follow-up' | 'correction' | 'couverture' | 'zakaria'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [isEspaceClientAuthenticated, setIsEspaceClientAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<string>('')
  const [currentUserRole, setCurrentUserRole] = useState<string>('')

  const handlePageSelect = (pageId: Page) => {
    setCurrentPage(pageId)
    if (pageId === 'home') {
      setIsEspaceClientAuthenticated(false)
      setCurrentUser('')
      setCurrentUserRole('')
    }
  }

  const renderHomePage = () => (
    <div className="min-h-screen bg-parchment-100 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] px-4 py-12 md:py-20 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-parchment-100/50 to-parchment-200/80 pointer-events-none" />
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-20 h-20 bg-espresso-900 rounded-full flex items-center justify-center shadow-lg">
              <BookOpen className="h-10 w-10 text-parchment-100" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-heading font-bold text-espresso-900 mb-6">
            Librairie 2B
          </h1>
          <p className="text-lg md:text-xl text-espresso-700 max-w-2xl mx-auto font-medium">
            Système de gestion des livres scolaires. Sélectionnez votre espace pour commencer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button
            onClick={() => {
              if (isEspaceClientAuthenticated) {
                handlePageSelect('espace-client')
              } else {
                setCurrentPage('espace-client-auth')
              }
            }}
            className="group bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-left shadow-book hover:shadow-book-hover transition-all duration-300 transform hover:-translate-y-1 border border-parchment-300 flex flex-col"
          >
            <div className="flex items-start justify-between mb-8">
              <div className="p-4 rounded-xl bg-parchment-200 text-amber-700 shadow-sm border border-parchment-300 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
                <Users className="h-8 w-8" />
              </div>
              <ArrowRight className="h-6 w-6 text-espresso-300 group-hover:text-amber-600 transition-colors duration-300 transform group-hover:translate-x-1" />
            </div>
            <h3 className="text-3xl font-heading font-bold text-espresso-900 mb-4">
              Espace Client
            </h3>
            <p className="text-espresso-600 mb-8 leading-relaxed flex-grow">
              Accès aux services clients : commandes, gestion et administration
            </p>
            <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide ${
              isEspaceClientAuthenticated
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-parchment-200 text-espresso-700 border border-parchment-300'
            }`}>
              {isEspaceClientAuthenticated ? 'Connecté' : 'Connexion requise'}
            </div>
          </button>

          <button
            onClick={() => handlePageSelect('employee')}
            className="group bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-left shadow-book hover:shadow-book-hover transition-all duration-300 transform hover:-translate-y-1 border border-parchment-300 flex flex-col"
          >
            <div className="flex items-start justify-between mb-8">
              <div className="p-4 rounded-xl bg-parchment-200 text-espresso-700 shadow-sm border border-parchment-300 group-hover:bg-espresso-800 group-hover:text-white transition-colors duration-300">
                <Search className="h-8 w-8" />
              </div>
              <ArrowRight className="h-6 w-6 text-espresso-300 group-hover:text-espresso-800 transition-colors duration-300 transform group-hover:translate-x-1" />
            </div>
            <h3 className="text-3xl font-heading font-bold text-espresso-900 mb-4">
              Espace Collaborateur
            </h3>
            <p className="text-espresso-600 mb-8 leading-relaxed flex-grow">
              Recherchez et gérez les commandes des clients
            </p>
          </button>
        </div>

        <div className="text-center mt-16">
          <div className="inline-block px-6 py-2 border-t border-parchment-300">
            <p className="text-sm font-medium text-espresso-500 uppercase tracking-widest">
              © 2025 Librairie 2B
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderEspaceClientPage = () => (
    <div className="min-h-screen bg-parchment-100 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] px-4 py-10 relative">
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-espresso-900 rounded-full mb-6 shadow-md">
            <Users className="h-10 w-10 text-parchment-100" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-espresso-900 mb-4">
            Espace Client
          </h1>
          <p className="text-lg text-espresso-600 max-w-2xl mx-auto font-medium">
            Choisissez le service dont vous avez besoin
          </p>
        </div>

        <div className="mb-8 flex justify-center">
          <button
            onClick={() => setCurrentPage('home')}
            className="px-6 py-2.5 bg-white border border-parchment-300 text-espresso-800 rounded-full font-semibold hover:bg-parchment-200 hover:text-espresso-900 transition-all shadow-sm"
          >
            ← Retour au menu principal
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => handlePageSelect('client')}
            className="group bg-white rounded-2xl p-6 text-left shadow-sm hover:shadow-book transition-all duration-200 border border-parchment-300"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-heading font-bold text-espresso-900">
                Commande Client
              </h3>
            </div>
            <p className="text-espresso-600 mb-4 leading-relaxed">
              Passez votre commande de livres scolaires
            </p>
            <div className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-parchment-200 text-espresso-700">
              Accès libre
            </div>
          </button>

          <button
            onClick={() => handlePageSelect('follow-up')}
            className="group bg-white rounded-2xl p-6 text-left shadow-sm hover:shadow-book transition-all duration-200 border border-parchment-300"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-heading font-bold text-espresso-900">
                Suivi de Commande
              </h3>
            </div>
            <p className="text-espresso-600 mb-4 leading-relaxed">
              Suivez le statut de votre commande
            </p>
            <div className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-parchment-200 text-espresso-700">
              Accès libre
            </div>
          </button>

          <button
            onClick={() => handlePageSelect('correction')}
            className="group bg-white rounded-2xl p-6 text-left shadow-sm hover:shadow-book transition-all duration-200 border border-parchment-300"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Edit className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-heading font-bold text-espresso-900">
                Correction
              </h3>
            </div>
            <p className="text-espresso-600 mb-4 leading-relaxed">
              Consultez vos commandes récentes groupées
            </p>
            <div className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-parchment-200 text-espresso-700">
              Accès libre
            </div>
          </button>

          <button
            onClick={() => handlePageSelect('ecole')}
            className="group bg-white rounded-2xl p-6 text-left shadow-sm hover:shadow-book transition-all duration-200 border border-parchment-300"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <School className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-heading font-bold text-espresso-900">
                Gestion des Écoles
              </h3>
            </div>
            <p className="text-espresso-600 mb-4 leading-relaxed">
              Ajoutez ou supprimez des écoles
            </p>
            <div className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-parchment-200 text-espresso-700">
              Accès libre
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-parchment-300">
          {currentUserRole === 'gerant' && (
          <button
            onClick={() => handlePageSelect('manager')}
            className="group bg-espresso-50 rounded-2xl p-6 text-left shadow-sm hover:shadow-book transition-all duration-200 border border-espresso-200"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 rounded-lg bg-espresso-200 text-espresso-800 border border-espresso-300 group-hover:bg-espresso-800 group-hover:text-white transition-colors">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-heading font-bold text-espresso-900">
                Gestionnaire
              </h3>
            </div>
            <p className="text-espresso-700 mb-4 leading-relaxed">
              Tableau de bord et statistiques
            </p>
            <div className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-espresso-200 text-espresso-800">
              Privé
            </div>
          </button>
          )}

          {(currentUser === 'aichabenzangue@gmail.com' || currentUser === 'lib2b@gmail.com') && (
          <button
            onClick={() => handlePageSelect('couverture')}
            className="group bg-espresso-50 rounded-2xl p-6 text-left shadow-sm hover:shadow-book transition-all duration-200 border border-espresso-200"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 rounded-lg bg-espresso-200 text-espresso-800 border border-espresso-300 group-hover:bg-espresso-800 group-hover:text-white transition-colors">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-heading font-bold text-espresso-900">
                Couverture
              </h3>
            </div>
            <p className="text-espresso-700 mb-4 leading-relaxed">
              Commandes avec couverture demandée
            </p>
            <div className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-espresso-200 text-espresso-800">
              Privé
            </div>
          </button>
          )}

          {currentUserRole === 'gerant' && (
          <button
            onClick={() => handlePageSelect('zakaria')}
            className="group bg-espresso-50 rounded-2xl p-6 text-left shadow-sm hover:shadow-book transition-all duration-200 border border-espresso-200 md:col-span-2 lg:col-span-1"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 rounded-lg bg-espresso-200 text-espresso-800 border border-espresso-300 group-hover:bg-espresso-800 group-hover:text-white transition-colors">
                <KeyRound className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-heading font-bold text-espresso-900">
                Accès
              </h3>
            </div>
            <p className="text-espresso-700 mb-4 leading-relaxed">
              Gestion des identifiants de connexion
            </p>
            <div className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-espresso-900 text-parchment-100">
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
              setCurrentPage('espace-client')
            }}
            title="Espace Client"
            description="Connectez-vous pour accéder aux services clients"
            onUserIdentified={setCurrentUser}
            onRoleIdentified={setCurrentUserRole}
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
        return (isEspaceClientAuthenticated && currentUserRole === 'gerant') ? <ManagerDashboard onNavigate={setCurrentPage} /> : renderHomePage()
      case 'correction':
        return isEspaceClientAuthenticated ? <Correction onNavigate={setCurrentPage} /> : renderHomePage()
      case 'ecole':
        return isEspaceClientAuthenticated ? <EcoleManagement onNavigate={setCurrentPage} /> : renderHomePage()
      case 'couverture':
        return (isEspaceClientAuthenticated && (currentUser === 'aichabenzangue@gmail.com' || currentUser === 'lib2b@gmail.com')) ? <CouverturePage onNavigate={setCurrentPage} currentUser={currentUser} /> : renderHomePage()
      case 'zakaria':
        return (isEspaceClientAuthenticated && currentUserRole === 'gerant') ? <AccessPage onNavigate={setCurrentPage} /> : renderHomePage()
      default:
        return renderHomePage()
    }
  }

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
    <div className="min-h-screen bg-parchment-100 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] font-sans text-espresso-900">
      {showNavigation && (
        <header className="bg-espresso-900 text-parchment-100 shadow-md border-b border-espresso-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <button
                onClick={() => setCurrentPage('home')}
                className="flex items-center space-x-3 text-parchment-200 hover:text-white transition-colors group"
              >
                <div className="p-2 bg-espresso-800 rounded-lg group-hover:bg-amber-600 transition-colors">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-heading font-bold tracking-tight">
                  Librairie 2B
                </h1>
              </button>
              <button
                onClick={() => setCurrentPage('home')}
                className="px-5 py-2 text-sm font-semibold bg-white/10 hover:bg-white/20 text-parchment-100 rounded-full transition-all border border-white/10 hover:border-white/30 backdrop-blur-sm"
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        </header>
      )}
      <main className={showNavigation ? "max-w-7xl mx-auto py-10" : ""}>
        {renderPage()}
      </main>
    </div>
  )
}

export default App
