import { useState, useMemo, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import {
  PendingApprovalScreen,
  RejectedScreen,
  SuspendedScreen,
  DevicePendingScreen,
  DeviceRejectedScreen
} from './pages/StatusScreens';
import { SubjectsPage, LecturesPage, LecturePage } from './pages/StudentPages';
import AdminPanel from './pages/AdminPanel';
import { SubjectData, LectureData } from './types';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { Toaster } from 'sonner';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="relative">
          <div className="w-20 h-20 bg-indigo-600/20 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-float">
            <BookOpen className="w-10 h-10 text-indigo-400" />
          </div>
          <div className="absolute inset-0 w-20 h-20 mx-auto rounded-3xl animate-pulse-glow" />
        </div>
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mx-auto mb-3" />
        <p className="text-indigo-300 text-sm font-medium">جاري التحميل...</p>
      </div>
    </div>
  );
}

function NoUserDataScreen() {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-red-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center animate-fade-in-scale">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-800 mb-2">حساب غير موجود</h2>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">لم يتم العثور على بيانات حسابك في النظام. يرجى التواصل مع المدرس.</p>
        <button
          onClick={() => signOut()}
          className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-8 rounded-2xl transition-all"
        >
          <LogOut className="w-4 h-4" />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, userData, deviceData, loading } = useAuth();
  const [page, setPage] = useState<string>('login');
  const [selectedSubject, setSelectedSubject] = useState<SubjectData | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<LectureData | null>(null);

  const handleSelectSubject = useCallback((subject: SubjectData) => {
    setSelectedSubject(subject);
    setSelectedLecture(null);
  }, []);

  const handleSelectLecture = useCallback((lecture: LectureData) => {
    setSelectedLecture(lecture);
  }, []);

  const handleBackToSubjects = useCallback(() => {
    setSelectedSubject(null);
    setSelectedLecture(null);
  }, []);

  const handleBackToLectures = useCallback(() => {
    setSelectedLecture(null);
  }, []);

  // Memoize the rendered content based on state
  const content = useMemo(() => {
    if (loading) return <LoadingScreen />;

    // Not logged in — show auth pages
    if (!user) {
      if (page === 'register') return <RegisterPage onNavigate={setPage} />;
      if (page === 'forgot-password') return <ForgotPasswordPage onNavigate={setPage} />;
      return <LoginPage onNavigate={setPage} />;
    }

    // Logged in but no Firestore data — this shouldn't happen for admin
    // because AuthContext creates admin doc automatically.
    // For students, this means their doc was deleted.
    if (!userData) return <NoUserDataScreen />;

    // Admin — show admin panel
    if (userData.role === 'admin') return <AdminPanel />;

    // Student — check status
    if (userData.status === 'pending') return <PendingApprovalScreen />;
    if (userData.status === 'rejected') return <RejectedScreen />;
    if (userData.status === 'suspended') return <SuspendedScreen />;

    // Student approved — check device
    if (!deviceData) return <DevicePendingScreen />;
    if (deviceData.status === 'pending') return <DevicePendingScreen />;
    if (deviceData.status === 'rejected') return <DeviceRejectedScreen />;

    // Student approved + device approved — show content
    if (selectedLecture && selectedSubject) {
      return (
        <LecturePage
          lecture={selectedLecture}
          subject={selectedSubject}
          onBack={handleBackToLectures}
        />
      );
    }

    if (selectedSubject) {
      return (
        <LecturesPage
          subject={selectedSubject}
          onBack={handleBackToSubjects}
          onSelectLecture={handleSelectLecture}
        />
      );
    }

    return <SubjectsPage onSelectSubject={handleSelectSubject} />;
  }, [loading, user, userData, deviceData, page, selectedSubject, selectedLecture, handleSelectSubject, handleSelectLecture, handleBackToSubjects, handleBackToLectures]);

  return <>{content}</>;
}

export function App() {
  return (
    <>
      <Toaster position="top-center" richColors expand={true} style={{ fontFamily: 'inherit' }} />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </>
  );
}
