
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import PropertyList from './components/PropertyList';
import Chatbot from './components/Chatbot';
import Login from './components/Login';
import { LANGUAGES, PROPERTY_TYPES } from './constants';
import { Property, User, Filter, Feedback } from './types';
import PropertyDetail from './components/PropertyDetail';
import AdminDashboard from './components/AdminDashboard';
import PropertyForm from './components/PropertyForm';
import Modal from './components/Modal';
import PaymentModal from './components/PaymentModal';
import HeroSection from './components/HeroSection';
import FeaturedProperties from './components/FeaturedProperties';
import AdminAlert from './components/AdminAlert';
import UserDashboard from './components/UserDashboard';
import Register from './components/Register';
import * as api from './services/api';
import { FeedbackIcon } from './components/icons';
import IntroPage from './components/IntroPage';

type View = 'list' | 'detail' | 'admin' | 'submitForm' | 'editForm' | 'adminDetail' | 'userDashboard';
type AuthStage = 'intro' | 'login' | 'register';

// Inline form component for feedback to keep it self-contained
const FeedbackForm = ({ onSubmit, onClose }: { onSubmit: (message: string) => Promise<void>, onClose: () => void }) => {
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;
        setIsSubmitting(true);
        await onSubmit(message);
        setIsSubmitting(false);
        setIsSuccess(true);
        setTimeout(() => {
            onClose();
        }, 2000);
    };

    if (isSuccess) {
        return (
            <div className="text-center p-4">
                <div className="mx-auto mb-4 h-12 w-12 flex items-center justify-center rounded-full bg-emerald-100">
                    <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-emerald-700">Thank you!</h3>
                <p className="text-slate-600 mt-2">Your feedback has been submitted.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us how we can improve..."
                rows={5}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
                aria-label="Feedback message"
            />
            <div className="flex justify-end pt-4">
                <button type="submit" disabled={isSubmitting || !message.trim()} className="bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-800 transition active:scale-95 disabled:bg-slate-400 disabled:cursor-not-allowed">
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
            </div>
        </form>
    );
};


export default function App(): React.ReactNode {
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [pendingProperties, setPendingProperties] = useState<Property[]>([]);
  const [allApproved, setAllApproved] = useState<Property[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [bookedProperties, setBookedProperties] = useState<Property[]>([]);
  const [allFeedback, setAllFeedback] = useState<Feedback[]>([]);
  const [adminStats, setAdminStats] = useState({ totalValue: 0, approvedCount: 0, pendingCount: 0, userCount: 0 });
  
  const [language, setLanguage] = useState(LANGUAGES[0].code);
  const [view, setView] = useState<View>('list');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [filters, setFilters] = useState<Filter>({
      searchTerm: '',
      minPrice: '',
      maxPrice: '',
      type: 'all',
      listingType: 'all',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authStage, setAuthStage] = useState<AuthStage>('intro');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const allProps = await api.getProperties();
      const availableProps = allProps.filter(p => p.status !== 'booked');
      setProperties(availableProps);

      if (user.type === 'admin') {
          const [stats, pending, allApprovedProps, users, feedback] = await Promise.all([
              api.getAdminStats(),
              api.getProperties('pending'),
              api.getProperties('approved'),
              api.getUsers(),
              api.getFeedback(),
          ]);
          setAdminStats(stats);
          setPendingProperties(pending);
          setAllApproved(allApprovedProps);
          setAllUsers(users);
          setAllFeedback(feedback);
      } else { // 'user'
          const userBookedProps = await api.getPropertiesByUserId(user.id);
          setBookedProperties(userBookedProps);
      }
    } catch (e: any) {
        setError(e.message || 'Failed to load data.');
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // When the app loads, if there's no user, we start at the intro.
    // If there is a user, we load their data.
    if (user) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [user, loadData]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setView('list');
    setRegistrationSuccess(false);
  };

  const handleLogout = () => {
    setUser(null);
    setView('list');
    setSelectedProperty(null);
    setAuthStage('intro');
  };
  
  const handleViewDetails = (property: Property) => {
    setSelectedProperty(property);
    setView('detail');
  };

  const handleBackToList = () => {
    setSelectedProperty(null);
    setView('list');
  };

  const handleNavigate = (newView: View) => {
    setView(newView);
  }

  const handleOpenFormModal = (propertyToEdit?: Property) => {
      setSelectedProperty(propertyToEdit || null);
      setView(propertyToEdit ? 'editForm' : 'submitForm');
      setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
      setIsFormModalOpen(false);
      setSelectedProperty(null);
      setView(user?.type === 'admin' ? 'admin' : 'list');
  };

  const handleSaveProperty = async (propertyData: Omit<Property, 'id' | 'status' | 'bookedByUserId'>) => {
    try {
      if (view === 'editForm' && selectedProperty) {
        await api.updateProperty(selectedProperty.id, propertyData);
      } else {
        const status = user?.type === 'admin' ? 'approved' : 'pending';
        await api.addProperty({ ...propertyData, status, bookedByUserId: null });
      }
      await loadData();
      handleCloseFormModal();
      if (user?.type === 'admin') {
          setView('admin');
      } else {
          setView('list');
      }
    } catch(e) {
      console.error("Failed to save property", e);
      alert("Error: Could not save the property.");
    }
  };

  const handleDeleteProperty = async (propertyId: number) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await api.deleteProperty(propertyId);
        await loadData();
      } catch(e) {
        console.error("Failed to delete property", e);
        alert("Error: Could not delete the property.");
      }
    }
  };

  const handleApprove = async (propertyId: number) => {
    await api.updateProperty(propertyId, { status: 'approved' });
    loadData();
  }

  const handleReject = async (propertyId: number) => {
    await api.deleteProperty(propertyId);
    loadData();
  }

  const handleFilterChange = (newFilters: Filter) => {
      setFilters(newFilters);
  };

  const handleProceedToPayment = () => {
    if (user) {
        setIsPaymentModalOpen(true);
    }
  }

  const handleConfirmBooking = async (propertyId: number) => {
    if (user) {
        await api.updateProperty(propertyId, { status: 'booked', bookedByUserId: user.id });
        await loadData();
        setView('userDashboard');
    }
  };

  const handleViewPendingDetails = (property: Property) => {
    setSelectedProperty(property);
    setView('adminDetail');
  };

  const handleBackToAdmin = () => {
    setSelectedProperty(null);
    setView('admin');
  };

  const handleUpdateUser = async (userId: number, updates: Partial<Omit<User, 'id'>>) => {
      if (window.confirm('Are you sure you want to update this user\'s role?')) {
          try {
              await api.updateUser(userId, updates);
              await loadData();
          } catch(e: any) {
              console.error("Failed to update user", e);
              alert(`Error: ${e.message}`);
          }
      }
  };

  const handleDeleteUser = async (userId: number) => {
      if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
          try {
              await api.deleteUser(userId);
              await loadData();
          } catch(e: any) {
              console.error("Failed to delete user", e);
              alert(`Error: ${e.message}`);
          }
      }
  };

  const handleSubmitFeedback = async (message: string) => {
    if (!user) return;
    try {
        await api.submitFeedback(message, user);
        if (user.type === 'admin') {
            const feedback = await api.getFeedback();
            setAllFeedback(feedback);
        }
    } catch (e) {
        console.error("Failed to submit feedback", e);
        alert("Error: Could not submit feedback.");
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    try {
        await api.deleteFeedback(feedbackId);
        const feedback = await api.getFeedback();
        setAllFeedback(feedback);
    } catch (e) {
        console.error("Failed to delete feedback", e);
        alert("Error: Could not delete feedback.");
    }
  };


  if (!user) {
    switch(authStage) {
      case 'login':
        return (
          <Login 
            onLogin={handleLogin} 
            onSwitchToRegister={() => setAuthStage('register')}
            showSuccessMessage={registrationSuccess}
            clearSuccessMessage={() => setRegistrationSuccess(false)}
          />
        );
      case 'register':
        return (
          <Register 
            onSwitchToLogin={() => setAuthStage('login')} 
            onRegisterSuccess={() => {
              setRegistrationSuccess(true);
              setAuthStage('login');
            }}
          />
        );
      case 'intro':
      default:
        return <IntroPage onNavigateToAuth={() => setAuthStage('login')} />;
    }
  }
  
  const approvedListings = properties.filter(p => p.status === 'approved');

  const filteredProperties = approvedListings.filter(property => {
    const searchTermMatch = property.address.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                            property.city.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    const price = property.listingType === 'rent' ? (property.rentPrice || 0) : property.price;
    const minPriceMatch = filters.minPrice ? price >= Number(filters.minPrice) : true;
    const maxPriceMatch = filters.maxPrice ? price <= Number(filters.maxPrice) : true;
    
    const typeMatch = filters.type === 'all' || property.type === filters.type;
    const listingTypeMatch = filters.listingType === 'all' || property.listingType === filters.listingType;

    return searchTermMatch && minPriceMatch && maxPriceMatch && typeMatch && listingTypeMatch;
  });

  const renderView = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-700"></div>
        </div>
      );
    }

    if (error) {
       return <div className="text-center py-16 text-red-500 bg-red-50 p-8 rounded-lg">
          <h3 className="text-2xl font-bold mb-2">An Error Occurred</h3>
          <p>{error}</p>
          <button onClick={loadData} className="mt-4 bg-blue-700 text-white py-2 px-4 rounded-lg">Try Again</button>
       </div>;
    }

    switch(view) {
      case 'detail':
        return selectedProperty && <PropertyDetail 
            property={selectedProperty} 
            language={language} 
            onBack={handleBackToList} 
            user={user}
            onProceedToPayment={handleProceedToPayment}
        />;
      case 'adminDetail':
        return selectedProperty && <PropertyDetail 
            property={selectedProperty} 
            language={language} 
            onBack={handleBackToAdmin} 
            user={user}
            onProceedToPayment={() => {}} // No payment in preview
        />;
      case 'userDashboard':
        return <UserDashboard 
                  bookedProperties={bookedProperties}
                  onBack={() => setView('list')}
                  onViewProperty={handleViewDetails}
                  user={user}
                  language={language}
                />;
      case 'admin':
        return <AdminDashboard 
                 stats={adminStats}
                 pendingProperties={pendingProperties}
                 approvedProperties={allApproved}
                 allUsers={allUsers}
                 allFeedback={allFeedback}
                 currentUser={user}
                 onApprove={handleApprove}
                 onReject={handleReject}
                 onAddNew={() => handleOpenFormModal()}
                 onBack={() => setView('list')}
                 onViewDetails={handleViewPendingDetails}
                 onEditProperty={handleOpenFormModal}
                 onDeleteProperty={handleDeleteProperty}
                 onUpdateUser={handleUpdateUser}
                 onDeleteUser={handleDeleteUser}
                 onDeleteFeedback={handleDeleteFeedback}
               />
      default: // 'list'
        return (
          <>
            {user?.type === 'admin' && (
              <AdminAlert 
                pendingCount={adminStats.pendingCount}
                onNavigateToAdmin={() => handleNavigate('admin')}
              />
            )}
            <HeroSection
              filters={filters}
              onFilterChange={handleFilterChange}
              propertyTypes={PROPERTY_TYPES}
              selectedLanguage={language}
              onLanguageChange={setLanguage}
            />
             <FeaturedProperties
              properties={approvedListings.slice(0, 6)}
              language={language}
              user={user}
              onDeleteProperty={handleDeleteProperty}
              onEditProperty={(p) => handleOpenFormModal(p)}
              onViewProperty={handleViewDetails}
            />
            <PropertyList
              properties={filteredProperties}
              language={language}
              user={user}
              onDeleteProperty={handleDeleteProperty}
              onEditProperty={(p) => handleOpenFormModal(p)}
              onViewProperty={handleViewDetails}
            />
          </>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800">
      <Header user={user} onLogout={handleLogout} onNavigate={handleNavigate} onListProperty={() => handleOpenFormModal()} />
      <main className="container mx-auto px-4 py-8">
        {renderView()}
      </main>
      
      {(view === 'submitForm' || view === 'editForm') && isFormModalOpen && (
        <Modal onClose={handleCloseFormModal} title={view === 'editForm' ? 'Edit Property' : 'List Your Property'}>
            <PropertyForm 
                onSubmit={handleSaveProperty} 
                initialData={selectedProperty}
                propertyTypes={PROPERTY_TYPES}
            />
        </Modal>
      )}

      {isPaymentModalOpen && selectedProperty && (
        <PaymentModal 
          property={selectedProperty} 
          onClose={() => setIsPaymentModalOpen(false)} 
          onSuccess={handleConfirmBooking}
        />
      )}

      {isFeedbackModalOpen && (
        <Modal onClose={() => setIsFeedbackModalOpen(false)} title="Submit Feedback">
            <FeedbackForm onSubmit={handleSubmitFeedback} onClose={() => setIsFeedbackModalOpen(false)} />
        </Modal>
      )}

      <button
        onClick={() => setIsFeedbackModalOpen(true)}
        className="fixed bottom-6 left-6 bg-purple-700 text-white p-4 rounded-full shadow-lg hover:bg-purple-800 transition-all duration-300 transform hover:scale-110 z-30 active:scale-100"
        aria-label="Submit Feedback"
      >
        <FeedbackIcon />
      </button>

      <Chatbot />
    </div>
  );
}
