import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ModalProvider, useModal } from './contexts/ModalContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { LoadingSpinner } from './components/UI/LoadingSpinner';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import ConfirmationModal from './components/UI/ConfirmationModal';
import NotificationModal from './components/UI/NotificationModal';

// Auth Pages
import { RoleSelection } from './pages/Auth/RoleSelection';
import { AdminAccess } from './pages/Auth/AdminAccess';
import { MemberAccess } from './pages/Auth/MemberAccess';
import { SignIn } from './pages/Auth/SignIn';

// Admin Pages
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { MemberManagement } from './pages/Admin/MemberManagement';
import { ProjectManagement } from './pages/Admin/ProjectManagement';
import { AnnouncementManagement } from './pages/Admin/AnnouncementManagement';
import { WikiManagement } from './pages/Admin/WikiManagement';
import { ContractManagement } from './pages/Admin/ContractManagement';
import { CompanySettings } from './pages/Admin/CompanySettings';
import { Projects } from './pages/Admin/Projects';
import { Tasks } from './pages/Admin/Tasks';
import { Notifications } from './pages/Admin/Notifications';
import { AuditLogs } from './pages/Admin/AuditLogs';
import { AnalyticsDashboard } from './pages/Admin/AnalyticsDashboard';
import { Billing } from './pages/Admin/Billing';

// Member Pages
import { MemberDashboard } from './pages/Member/MemberDashboard';
import { MemberProjects } from './pages/Member/MemberProjects';
import { MemberProfile } from './pages/Member/MemberProfile';

// Onboarding
import { OnboardingFlow } from './components/Onboarding/OnboardingFlow';
import { ContractStatusCheck } from './components/Onboarding/ContractStatusCheck';

// Shared Pages
import { Wiki } from './pages/Shared/Wiki';
import { Skills } from './pages/Shared/Skills';
import { Settings } from './pages/Shared/Settings';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/auth/role-selection" element={<RoleSelection />} />
      <Route path="/auth/admin-access" element={<AdminAccess />} />
      <Route path="/auth/member-access" element={<MemberAccess />} />
      <Route path="/auth/signin" element={<SignIn />} />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <Navigate to="/admin/dashboard" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/members"
        element={
          <ProtectedRoute requireAdmin>
            <MemberManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/projects"
        element={
          <ProtectedRoute requireAdmin>
            <ProjectManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/announcements"
        element={
          <ProtectedRoute requireAdmin>
            <AnnouncementManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/wiki"
        element={
          <ProtectedRoute requireAdmin>
            <WikiManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/contracts"
        element={
          <ProtectedRoute requireAdmin>
            <ContractManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/company-settings"
        element={
          <ProtectedRoute requireAdmin>
            <CompanySettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/projects"
        element={
          <ProtectedRoute requireAdmin>
            <Projects />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tasks"
        element={
          <ProtectedRoute requireAdmin>
            <Tasks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute requireAdmin>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit-logs"
        element={
          <ProtectedRoute requireAdmin>
            <AuditLogs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute requireAdmin>
            <AnalyticsDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/billing"
        element={
          <ProtectedRoute requireAdmin>
            <Billing />
          </ProtectedRoute>
        }
      />

      {/* Member Routes */}
      <Route
        path="/member/dashboard"
        element={
          <ProtectedRoute>
            {user?.onboardingCompleted || user?.contractSigned ? (
              <MemberDashboard />
            ) : (
              <Navigate to="/onboarding" replace />
            )}
          </ProtectedRoute>
        }
      />
      <Route
        path="/member/projects"
        element={
          <ProtectedRoute>
            {user?.onboardingCompleted || user?.contractSigned ? (
              <MemberProjects />
            ) : (
              <Navigate to="/onboarding" replace />
            )}
          </ProtectedRoute>
        }
      />
      <Route
        path="/member/profile"
        element={
          <ProtectedRoute>
            {user?.onboardingCompleted || user?.contractSigned ? (
              <MemberProfile />
            ) : (
              <Navigate to="/onboarding" replace />
            )}
          </ProtectedRoute>
        }
      />
      {/* Auto-redirect users with contracts to dashboard */}
      <Route
        path="/onboarding"
        element={
          user?.onboardingCompleted || user?.contractSigned ? (
            <Navigate to="/member/dashboard" replace />
          ) : (
            <ProtectedRoute>
              <OnboardingFlow />
            </ProtectedRoute>
          )
        }
      />

      {/* Contract status check route for stuck users */}
      <Route
        path="/check-contract"
        element={
          user?.onboardingCompleted || user?.contractSigned ? (
            <Navigate to="/member/dashboard" replace />
          ) : (
            <ProtectedRoute>
              <ContractStatusCheck />
            </ProtectedRoute>
          )
        }
      />

      {/* Shared Routes */}
      <Route
        path="/wiki"
        element={
          <ProtectedRoute>
            {user?.onboardingCompleted || user?.contractSigned ? (
              <Wiki />
            ) : (
              <Navigate to="/onboarding" replace />
            )}
          </ProtectedRoute>
        }
      />
      <Route
        path="/skills"
        element={
          <ProtectedRoute>
            {user?.onboardingCompleted || user?.contractSigned ? (
              <Skills />
            ) : (
              <Navigate to="/onboarding" replace />
            )}
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            {user?.onboardingCompleted || user?.contractSigned ? (
              <Settings />
            ) : (
              <Navigate to="/onboarding" replace />
            )}
          </ProtectedRoute>
        }
      />

      {/* Redirect logic */}
      <Route
        path="/"
        element={
          user ? (
            user.isAdmin ? (
              <Navigate to="/admin/dashboard" replace />
            ) : user.onboardingCompleted || user.contractSigned ? (
              <Navigate to="/member/dashboard" replace />
            ) : (
              <Navigate to="/onboarding" replace />
            )
          ) : (
            <Navigate to="/auth/role-selection" replace />
          )
        }
      />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <SidebarProvider>
          <Router>
            <AppContent />
            <Toaster position="top-right" />
            <ModalComponents />
          </Router>
        </SidebarProvider>
      </ModalProvider>
    </AuthProvider>
  );
}

// ModalComponents component that uses the modal context
const ModalComponents: React.FC = () => {
  const { confirmationModal, notificationModal, closeConfirmation, closeNotification } = useModal();
  
  return (
    <>
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        title={confirmationModal.title}
        message={confirmationModal.message}
        confirmText={confirmationModal.confirmText}
        cancelText={confirmationModal.cancelText}
        type={confirmationModal.type}
        onConfirm={confirmationModal.onConfirm || closeConfirmation}
        onCancel={confirmationModal.onCancel || closeConfirmation}
      />
      <NotificationModal
        isOpen={notificationModal.isOpen}
        title={notificationModal.title}
        message={notificationModal.message}
        type={notificationModal.type}
        duration={notificationModal.duration}
        onClose={closeNotification}
      />
    </>
  );
};

export default App;