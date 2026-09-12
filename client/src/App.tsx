import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DocumentProvider, useDocument } from './context/DocumentContext';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { DocumentEditor } from './components/Editor/DocumentEditor';
import { CopilotDrawer } from './components/Drawers/CopilotDrawer';
import { CommentsDrawer } from './components/Drawers/CommentsDrawer';
import { ChatDrawer } from './components/Drawers/ChatDrawer';
import { VersionsDrawer } from './components/Drawers/VersionsDrawer';
import { OutlineDrawer } from './components/Drawers/OutlineDrawer';
import { ShareModal } from './components/Modals/ShareModal';
import { TemplatesModal } from './components/Modals/TemplatesModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { DeveloperLoginPage } from './pages/DeveloperLoginPage';
import { DeveloperDashboardPage } from './pages/DeveloperDashboardPage';

interface DocumentWorkspaceInnerProps {
  onBack: () => void;
  onOpenTemplates: () => void;
  onOpenSettings: () => void;
}

const DocumentWorkspaceInner: React.FC<DocumentWorkspaceInnerProps> = ({
  onBack,
  onOpenTemplates,
  onOpenSettings,
}) => {
  const { isLoadingDoc, document } = useDocument();

  if (isLoadingDoc) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold">Connecting to collaborative session...</p>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 gap-4">
        <p className="text-base font-bold text-slate-800 dark:text-slate-200">
          Document not found or removed.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Header
        onBackToDashboard={onBack}
      />
      <div className="flex-1 flex overflow-hidden">
        <DocumentEditor />
        <CopilotDrawer />
        <CommentsDrawer />
        <ChatDrawer />
        <VersionsDrawer />
        <OutlineDrawer />
      </div>
      <ShareModal />
    </div>
  );
};

const MainWorkspace: React.FC = () => {
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    // Read query params or hash for deep linking
    const params = new URLSearchParams(window.location.search);
    const docParam = params.get('doc');
    if (docParam) {
      setCurrentDocId(docParam);
    }
  }, []);

  const handleSelectDoc = (id: string) => {
    setCurrentDocId(id);
    const newUrl = `${window.location.pathname}?doc=${id}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const handleBackToDashboard = () => {
    setCurrentDocId(null);
    const newUrl = window.location.pathname;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  if (!currentDocId) {
    return (
      <>
        <Dashboard
          onSelectDocument={handleSelectDoc}
          onOpenTemplates={() => setShowTemplatesModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
        />
        <TemplatesModal
          isOpen={showTemplatesModal}
          onClose={() => setShowTemplatesModal(false)}
          onSelectDocument={handleSelectDoc}
        />
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
        />
      </>
    );
  }

  return (
    <DocumentProvider key={currentDocId} documentId={currentDocId}>
      <DocumentWorkspaceInner
        onBack={handleBackToDashboard}
        onOpenTemplates={() => setShowTemplatesModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
      />
      <TemplatesModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        onSelectDocument={handleSelectDoc}
      />
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </DocumentProvider>
  );
};

const WorkspaceRouter: React.FC = () => {
  const location = useLocation();

  // Allow deep-linking via query params on the workspace route
  return <MainWorkspace key={location.search || undefined} />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/dev/login" element={<DeveloperLoginPage />} />
        <Route path="/dev/dashboard" element={<DeveloperDashboardPage />} />
        <Route path="/" element={<WorkspaceRouter />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
