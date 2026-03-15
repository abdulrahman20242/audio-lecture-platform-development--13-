import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import {
  collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc,
  addDoc, serverTimestamp, getDoc, where, setDoc, collectionGroup, getCountFromServer
} from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { UserData, DeviceData, SubjectData, LectureData, AlertData, SettingsData } from '../types';
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard';
import Users from 'lucide-react/dist/esm/icons/users';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import Bell from 'lucide-react/dist/esm/icons/bell';
import Settings from 'lucide-react/dist/esm/icons/settings';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import Check from 'lucide-react/dist/esm/icons/check';
import X from 'lucide-react/dist/esm/icons/x';
import Ban from 'lucide-react/dist/esm/icons/ban';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Edit3 from 'lucide-react/dist/esm/icons/edit-3';
import Save from 'lucide-react/dist/esm/icons/save';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import Search from 'lucide-react/dist/esm/icons/search';
import Headphones from 'lucide-react/dist/esm/icons/headphones';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Download from 'lucide-react/dist/esm/icons/download';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Menu from 'lucide-react/dist/esm/icons/menu';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import Shield from 'lucide-react/dist/esm/icons/shield';
import Monitor from 'lucide-react/dist/esm/icons/monitor';
import Clock from 'lucide-react/dist/esm/icons/clock';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import UserCheck from 'lucide-react/dist/esm/icons/user-check';
import UserX from 'lucide-react/dist/esm/icons/user-x';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import ToggleLeft from 'lucide-react/dist/esm/icons/toggle-left';
import ToggleRight from 'lucide-react/dist/esm/icons/toggle-right';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';

// Note: All imports above are used across the admin panel sections

type AdminSection = 'dashboard' | 'students' | 'devices' | 'subjects' | 'alerts' | 'settings' | 'subject-lectures' | 'add-lecture' | 'edit-lecture';

// ===== UTILITY: Small Spinner =====
const Spinner = memo(({ size = 'sm' }: { size?: 'sm' | 'md' }) => (
  <div className={`border-[2.5px] border-current/20 border-t-current rounded-full animate-spin ${size === 'sm' ? 'w-4 h-4' : 'w-8 h-8'}`} />
));

// ===== MAIN ADMIN PANEL =====
export default function AdminPanel() {
  const { signOut } = useAuth();
  const [section, setSection] = useState<AdminSection>('dashboard');
  const [selectedSubject, setSelectedSubject] = useState<SubjectData | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<LectureData | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [students, setStudents] = useState<UserData[]>([]);
  const [pendingDevices, setPendingDevices] = useState<DeviceData[]>([]);
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [settings, setSettings] = useState<SettingsData>({ maxDevicesPerUser: 3 });
  const [lectures, setLectures] = useState<LectureData[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stats, setStats] = useState({ pendingStudents: 0, pendingDevices: 0, unreadAlerts: 0, approvedStudents: 0, totalSubjects: 0, totalLectures: 0 });

  // ===== FETCH FUNCTIONS =====
  const fetchStats = useCallback(async () => {
    try {
      const pendingStudentsQuery = query(collection(db, 'users'), where('role', '==', 'student'), where('status', '==', 'pending'));
      const approvedStudentsQuery = query(collection(db, 'users'), where('role', '==', 'student'), where('status', '==', 'approved'));
      const unreadAlertsQuery = query(collection(db, 'alerts'), where('status', '==', 'unread'));
      const pendingDevicesQuery = query(collectionGroup(db, 'devices'), where('status', '==', 'pending'));

      const [pendingStudentsSnap, approvedStudentsSnap, unreadAlertsSnap, pendingDevicesSnap, subjectsSnap] = await Promise.all([
        getCountFromServer(pendingStudentsQuery),
        getCountFromServer(approvedStudentsQuery),
        getCountFromServer(unreadAlertsQuery),
        getCountFromServer(pendingDevicesQuery),
        getDocs(collection(db, 'subjects'))
      ]);

      let totalLectures = 0;
      const lecPromises = subjectsSnap.docs.map(d => getCountFromServer(collection(db, 'subjects', d.id, 'lectures')));
      const lecResults = await Promise.all(lecPromises);
      lecResults.forEach(snap => totalLectures += snap.data().count);

      setStats({
        pendingStudents: pendingStudentsSnap.data().count,
        pendingDevices: pendingDevicesSnap.data().count,
        unreadAlerts: unreadAlertsSnap.data().count,
        approvedStudents: approvedStudentsSnap.data().count,
        totalSubjects: subjectsSnap.size,
        totalLectures
      });
    } catch (err) { console.error('Stats error:', err); }
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
      setStudents(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserData)).filter(u => u.role === 'student'));
    } catch (err) { console.error(err); }
    setLoading(false);
  }, []);

  const fetchPendingDevices = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collectionGroup(db, 'devices'), where('status', '==', 'pending')));
      setPendingDevices(snap.docs.map(d => ({ deviceId: d.id, ...d.data() } as DeviceData)));
    } catch (err) { console.error(err); }
    setLoading(false);
  }, []);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'subjects'), orderBy('order', 'asc')));
      setSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as SubjectData)));
    } catch (err) { console.error(err); }
    setLoading(false);
  }, []);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'alerts'), orderBy('createdAt', 'desc')));
      setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() } as AlertData)));
    } catch (err) { console.error(err); }
    setLoading(false);
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'global'));
      if (snap.exists()) setSettings(snap.data() as SettingsData);
    } catch (err) { console.error(err); }
  }, []);

  const fetchLectures = useCallback(async (subjectId: string) => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'subjects', subjectId, 'lectures'), orderBy('order', 'asc')));
      setLectures(snap.docs.map(d => ({ id: d.id, ...d.data() } as LectureData)));
    } catch (err) { console.error(err); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); fetchSettings(); }, [fetchStats, fetchSettings]);
  useEffect(() => {
    if (section === 'students') fetchStudents();
    if (section === 'devices') fetchPendingDevices();
    if (section === 'subjects') fetchSubjects();
    if (section === 'alerts') fetchAlerts();
  }, [section, fetchStudents, fetchPendingDevices, fetchSubjects, fetchAlerts]);

  // ===== ACTION HANDLERS =====
  async function handleStudentAction(uid: string, newStatus: string) {
    setActionLoading(uid + newStatus);
    try {
      await updateDoc(doc(db, 'users', uid), { status: newStatus });
      setStudents(prev => prev.map(s => s.uid === uid ? { ...s, status: newStatus as UserData['status'] } : s));
      fetchStats();
    } catch (err) { console.error(err); }
    setActionLoading(null);
  }

  const handleDeleteStudent = (uid: string) => {
    toast('هل أنت متأكد؟', {
      description: 'هذا الإجراء لا يمكن التراجع عنه.',
      action: {
        label: 'حذف', onClick: async () => {
          setActionLoading(uid + 'delete');
          try {
            const [devicesSnap, alertsSnap] = await Promise.all([
              getDocs(collection(db, 'users', uid, 'devices')),
              getDocs(query(collection(db, 'alerts'), where('userId', '==', uid)))
            ]);
            await Promise.all([
              ...devicesSnap.docs.map(d => deleteDoc(d.ref)),
              ...alertsSnap.docs.map(d => deleteDoc(d.ref)),
              deleteDoc(doc(db, 'users', uid))
            ]);
            setStudents(prev => prev.filter(s => s.uid !== uid));
            fetchStats();
            toast.success('تم حذف الطالب والأجهزة المرتبطة بنجاح');
          } catch (err) { console.error(err); toast.error('حدث خطأ أثناء الحذف'); }
          setActionLoading(null);
        }
      },
      cancel: { label: 'إلغاء' }
    });
  };

  async function handleDeviceAction(userId: string, deviceId: string, newStatus: string, canDownload: boolean = false) {
    setActionLoading(deviceId + newStatus);
    try {
      await updateDoc(doc(db, 'users', userId, 'devices', deviceId), { status: newStatus, canDownloadAudio: canDownload });
      fetchPendingDevices();
      fetchStats();
    } catch (err) { console.error(err); }
    setActionLoading(null);
  }

  const handleDeleteDevice = (userId: string, deviceId: string) => {
    toast('هل تريد إزالة هذا الجهاز؟', {
      action: {
        label: 'إزالة', onClick: async () => {
          try {
            await deleteDoc(doc(db, 'users', userId, 'devices', deviceId));
            fetchStats();
            toast.success('تمت إزالة الجهاز بنجاح');
          } catch (err) { console.error(err); toast.error('حدث خطأ'); }
        }
      },
      cancel: { label: 'إلغاء' }
    });
  };

  async function handleToggleDownload(userId: string, deviceId: string, currentVal: boolean) {
    try {
      await updateDoc(doc(db, 'users', userId, 'devices', deviceId), { canDownloadAudio: !currentVal });
    } catch (err) { console.error(err); }
  }

  async function handleMarkAlertRead(alertId: string) {
    try {
      await updateDoc(doc(db, 'alerts', alertId), { status: 'read' });
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'read' } : a));
      fetchStats();
    } catch (err) { console.error(err); }
  }

  async function handleMarkAllAlertsRead() {
    try {
      const unread = alerts.filter(a => a.status === 'unread');
      await Promise.all(unread.map(a => updateDoc(doc(db, 'alerts', a.id), { status: 'read' })));
      setAlerts(prev => prev.map(a => ({ ...a, status: 'read' as const })));
      fetchStats();
    } catch (err) { console.error(err); }
  }

  async function handleSaveSettings(maxDevices: number) {
    try {
      await setDoc(doc(db, 'settings', 'global'), { maxDevicesPerUser: maxDevices });
      setSettings({ maxDevicesPerUser: maxDevices });
    } catch (err) { console.error(err); }
  }

  const navItems = [
    { id: 'dashboard' as const, label: 'لوحة التحكم', icon: LayoutDashboard, badge: 0 },
    { id: 'students' as const, label: 'الطلاب', icon: Users, badge: stats.pendingStudents },
    { id: 'devices' as const, label: 'الأجهزة', icon: Smartphone, badge: stats.pendingDevices },
    { id: 'subjects' as const, label: 'المواد', icon: BookOpen, badge: 0 },
    { id: 'alerts' as const, label: 'التنبيهات', icon: Bell, badge: stats.unreadAlerts },
    { id: 'settings' as const, label: 'الإعدادات', icon: Settings, badge: 0 },
  ];

  function navigateToSection(s: AdminSection) { setSection(s); setMobileMenuOpen(false); }
  const isActive = (id: string) => {
    if (id === 'subjects' && ['subject-lectures', 'add-lecture', 'edit-lecture'].includes(section)) return true;
    return section === id;
  };

  const handleRefresh = useCallback(() => {
    fetchStats();
    if (section === 'students') fetchStudents();
    if (section === 'devices') fetchPendingDevices();
    if (section === 'subjects') fetchSubjects();
    if (section === 'alerts') fetchAlerts();
  }, [section, fetchStats, fetchStudents, fetchPendingDevices, fetchSubjects, fetchAlerts]);

  return (
    <div className="min-h-screen bg-slate-50/80 flex" dir="rtl">
      {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 right-0 z-50 w-[260px] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 transform transition-transform duration-300 ease-out lg:transform-none ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'} flex flex-col`}>
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Shield className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-white">لوحة التحكم</h1>
                <p className="text-[10px] text-slate-400 font-medium">إدارة المنصة</p>
              </div>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden p-1 text-slate-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="p-2.5 space-y-0.5 mt-1 flex-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => navigateToSection(item.id)}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 ${isActive(item.id)
                ? 'bg-gradient-to-l from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:bg-white/8 hover:text-white'
                }`}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              <span className="flex-1 text-right">{item.label}</span>
              {item.badge > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full min-w-[20px] text-center font-extrabold ${isActive(item.id) ? 'bg-white/20' : 'bg-red-500 text-white'
                  }`}>{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-2.5 border-t border-white/10">
          <button onClick={signOut} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-bold text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut className="w-[18px] h-[18px]" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="glass border-b border-slate-200/60 px-4 lg:px-6 py-2.5 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-xl text-slate-600">
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-sm font-extrabold text-slate-800 hidden lg:block">
            {navItems.find(n => isActive(n.id))?.label || 'لوحة التحكم'}
          </h2>
          <div className="flex items-center gap-1.5">
            <button onClick={handleRefresh} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors" title="تحديث">
              <RefreshCw className="w-[18px] h-[18px]" />
            </button>
            <button onClick={() => navigateToSection('alerts')} className="relative p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-[18px] h-[18px]" />
              {stats.unreadAlerts > 0 && (
                <span className="absolute -top-0.5 -left-0.5 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-extrabold animate-pulse">
                  {stats.unreadAlerts}
                </span>
              )}
            </button>
          </div>
        </header>

        <main className="p-4 lg:p-6 max-w-7xl mx-auto w-full flex-1">
          {section === 'dashboard' && <DashboardSection stats={stats} onNavigate={navigateToSection} />}
          {section === 'students' && (
            <StudentsSection students={students} loading={loading} actionLoading={actionLoading}
              onAction={handleStudentAction} onDelete={handleDeleteStudent} onDeviceAction={handleDeviceAction}
              onDeleteDevice={handleDeleteDevice} onToggleDownload={handleToggleDownload} onRefresh={fetchStudents} />
          )}
          {section === 'devices' && (
            <DevicesSection devices={pendingDevices} loading={loading} actionLoading={actionLoading}
              onAction={handleDeviceAction} onRefresh={fetchPendingDevices} />
          )}
          {section === 'subjects' && (
            <SubjectsSection subjects={subjects} loading={loading} onRefresh={fetchSubjects}
              onViewLectures={s => { setSelectedSubject(s); fetchLectures(s.id); setSection('subject-lectures'); }} />
          )}
          {section === 'subject-lectures' && selectedSubject && (
            <LecturesSection subject={selectedSubject} lectures={lectures} loading={loading}
              onBack={() => setSection('subjects')} onAddLecture={() => { setSelectedLecture(null); setSection('add-lecture'); }}
              onEditLecture={l => { setSelectedLecture(l); setSection('edit-lecture'); }}
              onRefresh={() => fetchLectures(selectedSubject.id)} />
          )}
          {section === 'add-lecture' && selectedSubject && (
            <LectureFormSection subject={selectedSubject} onBack={() => { fetchLectures(selectedSubject.id); setSection('subject-lectures'); }} />
          )}
          {section === 'edit-lecture' && selectedSubject && selectedLecture && (
            <LectureFormSection subject={selectedSubject} lecture={selectedLecture} onBack={() => { fetchLectures(selectedSubject.id); setSection('subject-lectures'); }} />
          )}
          {section === 'alerts' && (
            <AlertsSection alerts={alerts} loading={loading} onMarkRead={handleMarkAlertRead} onMarkAllRead={handleMarkAllAlertsRead} onRefresh={fetchAlerts} />
          )}
          {section === 'settings' && <SettingsSection settings={settings} onSave={handleSaveSettings} />}
        </main>
      </div>
    </div>
  );
}

// ===== DASHBOARD =====
function DashboardSection({ stats, onNavigate }: { stats: any; onNavigate: (s: AdminSection) => void }) {
  const cards = [
    { label: 'طلبات طلاب جديدة', value: stats.pendingStudents, gradient: 'from-amber-500 to-orange-600', icon: UserCheck, section: 'students' as AdminSection, urgent: stats.pendingStudents > 0 },
    { label: 'طلبات أجهزة جديدة', value: stats.pendingDevices, gradient: 'from-blue-500 to-indigo-600', icon: Smartphone, section: 'devices' as AdminSection, urgent: stats.pendingDevices > 0 },
    { label: 'تنبيهات غير مقروءة', value: stats.unreadAlerts, gradient: 'from-red-500 to-rose-600', icon: Bell, section: 'alerts' as AdminSection, urgent: stats.unreadAlerts > 0 },
    { label: 'طلاب مقبولين', value: stats.approvedStudents, gradient: 'from-emerald-500 to-teal-600', icon: Users, section: 'students' as AdminSection, urgent: false },
    { label: 'إجمالي المواد', value: stats.totalSubjects, gradient: 'from-violet-500 to-purple-600', icon: BookOpen, section: 'subjects' as AdminSection, urgent: false },
    { label: 'إجمالي المحاضرات', value: stats.totalLectures, gradient: 'from-indigo-500 to-blue-600', icon: TrendingUp, section: 'subjects' as AdminSection, urgent: false },
  ];
  return (
    <div className="page-transition">
      <div className="mb-7">
        <h2 className="text-2xl font-black text-slate-800">مرحباً بك 👋</h2>
        <p className="text-slate-500 text-sm mt-1 font-medium">إليك نظرة سريعة على حالة المنصة</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <button key={i} onClick={() => onNavigate(card.section)}
            className={`animate-fade-in stagger-${Math.min(i + 1, 6)} relative bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-right overflow-hidden group ${card.urgent ? 'ring-2 ring-offset-2 ring-amber-300' : ''}`}>
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-l ${card.gradient}`} />
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-black text-slate-800">{card.value}</span>
            </div>
            <p className="text-xs font-bold text-slate-500">{card.label}</p>
            {card.urgent && (
              <span className="absolute top-3 left-3 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ===== STUDENTS =====
// Hoisted outside component to avoid per-render allocation
const statusCfg: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: 'انتظار', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  approved: { label: 'مقبول', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: UserCheck },
  rejected: { label: 'مرفوض', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: UserX },
  suspended: { label: 'معلّق', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: Ban }
};

function StudentsSection({ students, loading, actionLoading, onAction, onDelete, onDeviceAction, onDeleteDevice, onToggleDownload, onRefresh }: {
  students: UserData[]; loading: boolean; actionLoading: string | null;
  onAction: (uid: string, status: string) => void; onDelete: (uid: string) => void;
  onDeviceAction: (userId: string, deviceId: string, status: string, canDownload?: boolean) => void;
  onDeleteDevice: (userId: string, deviceId: string) => void; onToggleDownload: (userId: string, deviceId: string, current: boolean) => void; onRefresh: () => void;
}) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deviceMap, setDeviceMap] = useState<Record<string, DeviceData[]>>({});
  const [loadingDev, setLoadingDev] = useState<string | null>(null);

  const filtered = useMemo(() => students.filter(s => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (search) { const q = search.toLowerCase(); return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.phone.includes(q); }
    return true;
  }), [students, filter, search]);

  const counts = useMemo(() => {
    const c = { all: students.length, pending: 0, approved: 0, rejected: 0, suspended: 0 };
    for (const s of students) {
      if (s.status in c) c[s.status as keyof typeof c]++;
    }
    return c;
  }, [students]);

  async function toggleExpand(s: UserData) {
    if (expanded === s.uid) { setExpanded(null); return; }
    setExpanded(s.uid);
    if (!deviceMap[s.uid]) {
      setLoadingDev(s.uid);
      try { const snap = await getDocs(collection(db, 'users', s.uid, 'devices')); setDeviceMap(prev => ({ ...prev, [s.uid]: snap.docs.map(d => ({ deviceId: d.id, ...d.data() } as DeviceData)) })); }
      catch (err) { console.error(err); }
      setLoadingDev(null);
    }
  }

  async function refreshDevices(uid: string) {
    setLoadingDev(uid);
    try { const snap = await getDocs(collection(db, 'users', uid, 'devices')); setDeviceMap(prev => ({ ...prev, [uid]: snap.docs.map(d => ({ deviceId: d.id, ...d.data() } as DeviceData)) })); }
    catch (err) { console.error(err); }
    setLoadingDev(null);
  }

  return (
    <div className="page-transition">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-800">إدارة الطلاب</h2>
          <p className="text-slate-500 text-xs mt-1 font-medium">{students.length} طالب مسجل</p>
        </div>
        <button onClick={onRefresh} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"><RefreshCw className="w-[18px] h-[18px]" /></button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-3.5 mb-4 shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو الإيميل..."
              className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {(['all', 'pending', 'approved', 'rejected', 'suspended'] as const).map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${filter === s ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {s === 'all' ? `الكل (${counts.all})` : `${statusCfg[s].label} (${counts[s]})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="md" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Users className="w-14 h-14 mx-auto mb-3 text-slate-200" />
          <p className="text-slate-400 font-bold text-sm">لا يوجد طلاب</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(student => {
            const cfg = statusCfg[student.status];
            const isExpanded = expanded === student.uid;
            const devices = deviceMap[student.uid] || [];
            const isLoadingDev = loadingDev === student.uid;

            return (
              <div key={student.uid} className={`bg-white rounded-2xl border overflow-hidden transition-all duration-300 animate-fade-in ${isExpanded ? 'border-indigo-200 shadow-lg' : 'border-slate-100 hover:border-slate-200 shadow-sm'}`}>
                <button onClick={() => toggleExpand(student)} className="w-full p-4 text-right">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} border`}>
                          <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                        <h3 className="font-extrabold text-slate-800 truncate text-sm">{student.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-400 mr-11">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{student.email}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{student.phone}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{student.createdAt?.toDate ? student.createdAt.toDate().toLocaleDateString('ar-EG') : '—'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 mr-11 sm:mr-0">
                      {student.status === 'pending' && (<>
                        <button onClick={e => { e.stopPropagation(); onAction(student.uid, 'approved'); }} disabled={actionLoading === student.uid + 'approved'}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold transition-all disabled:opacity-50 shadow-sm">
                          {actionLoading === student.uid + 'approved' ? <Spinner /> : <Check className="w-3.5 h-3.5" />} قبول
                        </button>
                        <button onClick={e => { e.stopPropagation(); onAction(student.uid, 'rejected'); }} disabled={actionLoading === student.uid + 'rejected'}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[11px] font-bold transition-all disabled:opacity-50 shadow-sm">
                          {actionLoading === student.uid + 'rejected' ? <Spinner /> : <X className="w-3.5 h-3.5" />} رفض
                        </button>
                      </>)}
                      {student.status === 'approved' && (
                        <button onClick={e => { e.stopPropagation(); onAction(student.uid, 'suspended'); }} disabled={actionLoading === student.uid + 'suspended'}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[11px] font-bold transition-all disabled:opacity-50 shadow-sm">
                          {actionLoading === student.uid + 'suspended' ? <Spinner /> : <Ban className="w-3.5 h-3.5" />} تعليق
                        </button>
                      )}
                      {student.status === 'suspended' && (
                        <button onClick={e => { e.stopPropagation(); onAction(student.uid, 'approved'); }} disabled={actionLoading === student.uid + 'approved'}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold transition-all disabled:opacity-50 shadow-sm">
                          {actionLoading === student.uid + 'approved' ? <Spinner /> : <RotateCcw className="w-3.5 h-3.5" />} تفعيل
                        </button>
                      )}
                      {student.status === 'rejected' && (
                        <button onClick={e => { e.stopPropagation(); onAction(student.uid, 'approved'); }} disabled={actionLoading === student.uid + 'approved'}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold transition-all disabled:opacity-50 shadow-sm">
                          {actionLoading === student.uid + 'approved' ? <Spinner /> : <Check className="w-3.5 h-3.5" />} قبول
                        </button>
                      )}
                      <div className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 animate-slide-down">
                    <div className="px-4 py-2.5 flex flex-wrap gap-1.5 border-b border-slate-100 bg-slate-50/60">
                      <button onClick={() => onDelete(student.uid)} disabled={actionLoading === student.uid + 'delete'}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[11px] font-bold transition-all border border-red-200">
                        <Trash2 className="w-3 h-3" /> حذف نهائي
                      </button>
                      <button onClick={() => refreshDevices(student.uid)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-[11px] font-medium transition-all border border-slate-200">
                        <RefreshCw className={`w-3 h-3 ${isLoadingDev ? 'animate-spin' : ''}`} /> تحديث الأجهزة
                      </button>
                    </div>
                    <div className="p-4">
                      <h4 className="text-xs font-extrabold text-slate-600 mb-2.5 flex items-center gap-1.5">
                        <Monitor className="w-3.5 h-3.5 text-indigo-500" /> الأجهزة ({devices.length})
                      </h4>
                      {isLoadingDev ? (
                        <div className="flex justify-center py-6"><Spinner size="md" /></div>
                      ) : devices.length === 0 ? (
                        <div className="text-center py-5 text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                          <Smartphone className="w-7 h-7 mx-auto mb-1 opacity-50" /><p className="text-xs">لا توجد أجهزة</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {devices.map(device => (
                            <DeviceCard key={device.deviceId} device={device} userId={student.uid}
                              onDeviceAction={async (u, d, s, c) => { await onDeviceAction(u, d, s, c); await refreshDevices(u); }}
                              onDeleteDevice={async (u, d) => { await onDeleteDevice(u, d); await refreshDevices(u); }}
                              onToggleDownload={async (u, d, c) => { await onToggleDownload(u, d, c); await refreshDevices(u); }} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== DEVICE CARD =====
function DeviceCard({ device, userId, onDeviceAction, onDeleteDevice, onToggleDownload }: {
  device: DeviceData; userId: string;
  onDeviceAction: (u: string, d: string, s: string, c?: boolean) => void;
  onDeleteDevice: (u: string, d: string) => void; onToggleDownload: (u: string, d: string, c: boolean) => void;
}) {
  const [showChoice, setShowChoice] = useState(false);
  const [busy, setBusy] = useState(false);
  const cfg: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'انتظار', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    approved: { label: 'معتمد', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    rejected: { label: 'مرفوض', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  };
  const c = cfg[device.status];
  async function act(s: string, dl?: boolean) { setBusy(true); await onDeviceAction(userId, device.deviceId, s, dl); setShowChoice(false); setBusy(false); }

  return (
    <div className={`bg-white rounded-xl p-3.5 border ${device.status === 'pending' ? 'border-amber-200 bg-amber-50/20' : 'border-slate-100'} transition-all`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${c.bg}`}>
            <Smartphone className={`w-4 h-4 ${c.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-800 text-xs">{device.osName} — {device.browserName}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold border ${c.bg} ${c.color}`}>{c.label}</span>
            </div>
            <div className="flex flex-wrap gap-x-3 mt-0.5 text-[10px] text-slate-400">
              <span>أول ظهور: {device.firstSeenAt?.toDate ? device.firstSeenAt.toDate().toLocaleDateString('ar-EG') : '—'}</span>
              <span>آخر: {device.lastSeenAt?.toDate ? device.lastSeenAt.toDate().toLocaleDateString('ar-EG') : '—'}</span>
            </div>
            {device.status === 'approved' && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold mt-1 ${device.canDownloadAudio ? 'text-emerald-600' : 'text-slate-400'}`}>
                {device.canDownloadAudio ? <><Download className="w-2.5 h-2.5" /> تحميل مسموح</> : <><XCircle className="w-2.5 h-2.5" /> تحميل ممنوع</>}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 flex-wrap">
          {device.status === 'pending' && !showChoice && (<>
            <button onClick={() => setShowChoice(true)} disabled={busy} className="flex items-center gap-1 px-2 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold disabled:opacity-50"><Check className="w-3 h-3" />قبول</button>
            <button onClick={() => act('rejected')} disabled={busy} className="flex items-center gap-1 px-2 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[10px] font-bold disabled:opacity-50"><X className="w-3 h-3" />رفض</button>
          </>)}
          {showChoice && (
            <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 p-2 rounded-xl animate-fade-in-scale">
              <span className="text-[10px] text-indigo-700 font-bold whitespace-nowrap">تحميل صوت؟</span>
              <button onClick={() => act('approved', true)} disabled={busy} className="px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-lg disabled:opacity-50">نعم ✅</button>
              <button onClick={() => act('approved', false)} disabled={busy} className="px-2.5 py-1 bg-slate-500 text-white text-[10px] font-bold rounded-lg disabled:opacity-50">لا ❌</button>
              <button onClick={() => setShowChoice(false)} className="p-0.5 text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>
            </div>
          )}
          {device.status === 'approved' && (
            <button onClick={() => onToggleDownload(userId, device.deviceId, device.canDownloadAudio)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${device.canDownloadAudio ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
              {device.canDownloadAudio ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
              {device.canDownloadAudio ? 'إيقاف تحميل' : 'تفعيل تحميل'}
            </button>
          )}
          <button onClick={() => onDeleteDevice(userId, device.deviceId)} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg border border-red-100 transition-all" title="إزالة"><Trash2 className="w-3 h-3" /></button>
        </div>
      </div>
    </div>
  );
}

// ===== DEVICES PENDING =====
function DevicesSection({ devices, loading, actionLoading, onAction, onRefresh }: {
  devices: DeviceData[]; loading: boolean; actionLoading: string | null;
  onAction: (u: string, d: string, s: string, c?: boolean) => void; onRefresh: () => void;
}) {
  const [choice, setChoice] = useState<string | null>(null);
  return (
    <div className="page-transition">
      <div className="flex items-center justify-between mb-5">
        <div><h2 className="text-2xl font-black text-slate-800">طلبات الأجهزة</h2><p className="text-slate-500 text-xs mt-1 font-medium">{devices.length} طلب معلّق</p></div>
        <button onClick={onRefresh} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><RefreshCw className="w-[18px] h-[18px]" /></button>
      </div>
      {loading ? <div className="flex justify-center py-16"><Spinner size="md" /></div> : devices.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3"><Check className="w-8 h-8 text-emerald-400" /></div>
          <p className="text-slate-500 font-bold text-sm">لا توجد طلبات معلقة 🎉</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {devices.map(device => (
            <div key={device.deviceId} className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100 hover:shadow-md transition-all animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-11 h-11 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center flex-shrink-0"><Smartphone className="w-5 h-5 text-amber-600" /></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-slate-800 text-sm">{device.userName}</h3>
                    <p className="text-xs text-slate-500">{device.userEmail}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1"><Monitor className="w-3 h-3" />{device.osName} — {device.browserName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {choice === device.deviceId ? (
                    <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 p-2.5 rounded-xl animate-fade-in-scale">
                      <span className="text-[11px] text-indigo-700 font-bold whitespace-nowrap">تحميل صوت؟</span>
                      <button onClick={() => { onAction(device.userId, device.deviceId, 'approved', true); setChoice(null); }} disabled={actionLoading === device.deviceId + 'approved'} className="px-3 py-1.5 bg-emerald-500 text-white text-[11px] font-bold rounded-lg disabled:opacity-50">نعم ✅</button>
                      <button onClick={() => { onAction(device.userId, device.deviceId, 'approved', false); setChoice(null); }} disabled={actionLoading === device.deviceId + 'approved'} className="px-3 py-1.5 bg-slate-500 text-white text-[11px] font-bold rounded-lg disabled:opacity-50">لا ❌</button>
                      <button onClick={() => setChoice(null)} className="p-1 text-slate-400"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (<>
                    <button onClick={() => setChoice(device.deviceId)} className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm"><Check className="w-4 h-4" />قبول</button>
                    <button onClick={() => onAction(device.userId, device.deviceId, 'rejected')} className="flex items-center gap-1.5 px-3.5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-sm"><X className="w-4 h-4" />رفض</button>
                  </>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== SUBJECTS =====
function SubjectsSection({ subjects, loading, onRefresh, onViewLectures }: {
  subjects: SubjectData[]; loading: boolean; onRefresh: () => void; onViewLectures: (s: SubjectData) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SubjectData | null>(null);
  const [name, setName] = useState(''); const [doctorName, setDoctorName] = useState(''); const [order, setOrder] = useState(1); const [saving, setSaving] = useState(false);

  function startAdd() { setEditing(null); setName(''); setDoctorName(''); setOrder(subjects.length + 1); setShowForm(true); }
  function startEdit(s: SubjectData) { setEditing(s); setName(s.name); setDoctorName(s.doctorName); setOrder(s.order); setShowForm(true); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await updateDoc(doc(db, 'subjects', editing.id), { name, doctorName, order });
      else await addDoc(collection(db, 'subjects'), { name, doctorName, order, createdAt: serverTimestamp() });
      setShowForm(false); onRefresh();
    } catch (err) { console.error(err); }
    setSaving(false);
  }

  const handleDelete = (id: string) => {
    toast('حذف المادة وكل محاضراتها؟', {
      action: {
        label: 'حذف', onClick: async () => {
          try { const snap = await getDocs(collection(db, 'subjects', id, 'lectures')); await Promise.all(snap.docs.map(d => deleteDoc(d.ref))); await deleteDoc(doc(db, 'subjects', id)); onRefresh(); toast.success('تم الحذف بنجاح'); } catch (err) { console.error(err); toast.error('حدث خطأ'); }
        }
      },
      cancel: { label: 'إلغاء' }
    });
  };

  return (
    <div className="page-transition">
      <div className="flex items-center justify-between mb-5">
        <div><h2 className="text-2xl font-black text-slate-800">إدارة المواد</h2><p className="text-slate-500 text-xs mt-1 font-medium">{subjects.length} مادة</p></div>
        <div className="flex gap-1.5">
          <button onClick={onRefresh} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><RefreshCw className="w-[18px] h-[18px]" /></button>
          <button onClick={startAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"><Plus className="w-4 h-4" />إضافة مادة</button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-indigo-100 mb-5 animate-fade-in-scale">
          <h3 className="font-extrabold text-slate-800 text-sm mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-600" />{editing ? 'تعديل المادة' : 'مادة جديدة'}</h3>
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div><label className="block text-xs font-bold text-slate-600 mb-1">اسم المادة</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/40 transition-all" placeholder="إدارة الأعمال" required /></div>
            <div><label className="block text-xs font-bold text-slate-600 mb-1">اسم الدكتور</label>
              <input type="text" value={doctorName} onChange={e => setDoctorName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/40 transition-all" placeholder="د. أحمد" required /></div>
            <div><label className="block text-xs font-bold text-slate-600 mb-1">الترتيب</label>
              <input type="number" value={order} onChange={e => setOrder(Number(e.target.value))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/40 transition-all" min={1} required /></div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 shadow-sm">{saving ? <Spinner /> : <Save className="w-3.5 h-3.5" />}حفظ</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-bold">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="flex justify-center py-16"><Spinner size="md" /></div> : subjects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100"><BookOpen className="w-14 h-14 mx-auto mb-3 text-slate-200" /><p className="text-slate-400 font-bold text-sm">لا توجد مواد</p></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {subjects.map((s, i) => (
            <div key={s.id} className={`animate-fade-in stagger-${Math.min(i + 1, 6)} bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-100 transition-all duration-300 group card-hover`}>
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors"><BookOpen className="w-5 h-5 text-indigo-600" /></div>
                <div className="flex-1 min-w-0"><h3 className="font-extrabold text-slate-800 text-sm">{s.name}</h3><p className="text-xs text-slate-500">{s.doctorName}</p></div>
              </div>
              <div className="flex items-center gap-1.5 mt-3.5 pt-3 border-t border-slate-50">
                <button onClick={() => onViewLectures(s)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[11px] font-bold transition-all"><Headphones className="w-3.5 h-3.5" />المحاضرات</button>
                <button onClick={() => startEdit(s)} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-xl transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(s.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-400 rounded-xl transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== LECTURES =====
function LecturesSection({ subject, lectures, loading, onBack, onAddLecture, onEditLecture, onRefresh }: {
  subject: SubjectData; lectures: LectureData[]; loading: boolean; onBack: () => void; onAddLecture: () => void; onEditLecture: (l: LectureData) => void; onRefresh: () => void;
}) {
  const handleDelete = (id: string) => {
    toast('حذف المحاضرة؟', {
      action: {
        label: 'حذف', onClick: async () => {
          try { await deleteDoc(doc(db, 'subjects', subject.id, 'lectures', id)); onRefresh(); toast.success('تم حذف المحاضرة'); } catch (err) { console.error(err); toast.error('حدث خطأ'); }
        }
      },
      cancel: { label: 'إلغاء' }
    });
  };
  return (
    <div className="page-transition">
      <button onClick={onBack} className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 mb-4 font-bold text-xs transition-colors"><ChevronRight className="w-4 h-4" />العودة للمواد</button>
      <div className="flex items-center justify-between mb-5">
        <div><h2 className="text-2xl font-black text-slate-800">{subject.name}</h2><p className="text-slate-500 text-xs mt-0.5 font-medium">{subject.doctorName} · {lectures.length} محاضرة</p></div>
        <div className="flex gap-1.5">
          <button onClick={onRefresh} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><RefreshCw className="w-[18px] h-[18px]" /></button>
          <button onClick={onAddLecture} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"><Plus className="w-4 h-4" />إضافة محاضرة</button>
        </div>
      </div>
      {loading ? <div className="flex justify-center py-16"><Spinner size="md" /></div> : lectures.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100"><Headphones className="w-14 h-14 mx-auto mb-3 text-slate-200" /><p className="text-slate-400 font-bold text-sm">لا توجد محاضرات</p></div>
      ) : (
        <div className="space-y-2.5">
          {lectures.map((l, i) => (
            <div key={l.id} className={`animate-fade-in stagger-${Math.min(i + 1, 6)} bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-100 transition-all duration-300 group card-hover`}>
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"><span className="text-sm font-black text-white">{l.order}</span></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{l.title}</h3>
                  <div className="flex gap-2 mt-1">
                    {l.audioUrl && <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg font-bold flex items-center gap-0.5"><Headphones className="w-2.5 h-2.5" />صوت</span>}
                    {l.pdfUrl && <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg font-bold flex items-center gap-0.5"><FileText className="w-2.5 h-2.5" />PDF</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => onEditLecture(l)} className="p-2 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(l.id)} className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== LECTURE FORM =====
function LectureFormSection({ subject, lecture, onBack }: { subject: SubjectData; lecture?: LectureData; onBack: () => void; }) {
  const [title, setTitle] = useState(lecture?.title || ''); const [audioUrl, setAudioUrl] = useState(lecture?.audioUrl || '');
  const [pdfUrl, setPdfUrl] = useState(lecture?.pdfUrl || ''); const [order, setOrder] = useState(lecture?.order || 1); const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      if (lecture) await updateDoc(doc(db, 'subjects', subject.id, 'lectures', lecture.id), { title, audioUrl, pdfUrl, order });
      else await addDoc(collection(db, 'subjects', subject.id, 'lectures'), { title, audioUrl, pdfUrl, order, createdAt: serverTimestamp() });
      onBack();
    } catch (err) { console.error(err); }
    setSaving(false);
  }

  return (
    <div className="page-transition">
      <button onClick={onBack} className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 mb-4 font-bold text-xs transition-colors"><ChevronRight className="w-4 h-4" />العودة</button>
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-100 max-w-2xl animate-fade-in">
        <h2 className="text-lg font-black text-slate-800 mb-5 flex items-center gap-2"><Headphones className="w-5 h-5 text-indigo-600" />{lecture ? 'تعديل المحاضرة' : 'محاضرة جديدة'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-xs font-bold text-slate-600 mb-1">عنوان المحاضرة</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/40 transition-all" placeholder="المحاضرة الأولى" required /></div>
          <div><label className="block text-xs font-bold text-slate-600 mb-1">رابط الصوت (Google Drive)</label>
            <input type="url" value={audioUrl} onChange={e => setAudioUrl(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500/40 transition-all" placeholder="https://drive.google.com/file/d/..." dir="ltr" />
            <p className="text-[10px] text-slate-400 mt-1">ارفع على Drive واجعله "أي شخص لديه الرابط" ثم الصق الرابط</p></div>
          <div><label className="block text-xs font-bold text-slate-600 mb-1">رابط PDF (Google Drive)</label>
            <input type="url" value={pdfUrl} onChange={e => setPdfUrl(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500/40 transition-all" placeholder="https://drive.google.com/file/d/..." dir="ltr" /></div>
          <div><label className="block text-xs font-bold text-slate-600 mb-1">الترتيب</label>
            <input type="number" value={order} onChange={e => setOrder(Number(e.target.value))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/40 transition-all" min={1} required /></div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 shadow-sm">{saving ? <Spinner /> : <Save className="w-3.5 h-3.5" />}{lecture ? 'تحديث' : 'إضافة'}</button>
            <button type="button" onClick={onBack} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-xs font-bold">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== ALERTS =====
function AlertsSection({ alerts, loading, onMarkRead, onMarkAllRead, onRefresh }: {
  alerts: AlertData[]; loading: boolean; onMarkRead: (id: string) => void; onMarkAllRead: () => void; onRefresh: () => void;
}) {
  const cfg: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
    new_student: { label: 'طالب جديد', icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    new_device: { label: 'جهاز جديد', icon: Smartphone, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    device_limit: { label: 'تجاوز حد الأجهزة', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    concurrent_use: { label: 'استخدام متزامن', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  };
  const unread = alerts.filter(a => a.status === 'unread').length;

  return (
    <div className="page-transition">
      <div className="flex items-center justify-between mb-5">
        <div><h2 className="text-2xl font-black text-slate-800">التنبيهات</h2><p className="text-slate-500 text-xs mt-1 font-medium">{unread} غير مقروءة من {alerts.length}</p></div>
        <div className="flex gap-1.5">
          {unread > 0 && <button onClick={onMarkAllRead} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[11px] font-bold">تم قراءة الكل</button>}
          <button onClick={onRefresh} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><RefreshCw className="w-[18px] h-[18px]" /></button>
        </div>
      </div>
      {loading ? <div className="flex justify-center py-16"><Spinner size="md" /></div> : alerts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100"><Bell className="w-14 h-14 mx-auto mb-3 text-slate-200" /><p className="text-slate-400 font-bold text-sm">لا توجد تنبيهات</p></div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert, i) => {
            const c = cfg[alert.type] || cfg.new_student;
            const isUnread = alert.status === 'unread';
            return (
              <div key={alert.id} className={`animate-fade-in stagger-${Math.min(i + 1, 6)} rounded-2xl p-3.5 border transition-all ${isUnread ? `${c.bg} ${c.border} shadow-sm` : 'bg-white border-slate-100 opacity-60'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isUnread ? 'bg-white shadow-sm' : 'bg-slate-50'}`}>
                    <c.icon className={`w-4 h-4 ${isUnread ? c.color : 'text-slate-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-xs font-extrabold ${isUnread ? 'text-slate-800' : 'text-slate-500'}`}>{c.label}</span>
                      {isUnread && <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
                    </div>
                    <p className={`text-xs ${isUnread ? 'text-slate-700' : 'text-slate-400'}`}>{alert.userName}</p>
                    {alert.deviceInfo && <p className="text-[10px] text-slate-400 mt-0.5">{alert.deviceInfo}</p>}
                    <p className="text-[10px] text-slate-400 mt-0.5">{alert.createdAt?.toDate ? alert.createdAt.toDate().toLocaleString('ar-EG') : ''}</p>
                  </div>
                  {isUnread && <button onClick={() => onMarkRead(alert.id)} className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold border border-slate-200 flex-shrink-0">تم ✓</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== SETTINGS =====
function SettingsSection({ settings, onSave }: { settings: SettingsData; onSave: (n: number) => void; }) {
  const [maxDev, setMaxDev] = useState(settings.maxDevicesPerUser);
  const [saved, setSaved] = useState(false);
  function save() { onSave(maxDev); setSaved(true); setTimeout(() => setSaved(false), 2000); }

  return (
    <div className="page-transition">
      <div className="mb-5"><h2 className="text-2xl font-black text-slate-800">الإعدادات</h2><p className="text-slate-500 text-xs mt-1 font-medium">إعدادات عامة للمنصة</p></div>
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 max-w-xl animate-fade-in">
        <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center"><Settings className="w-5 h-5 text-indigo-600" /></div>
          <div><h3 className="font-extrabold text-slate-800 text-sm">إعدادات الأمان</h3><p className="text-[10px] text-slate-400 font-medium">التحكم في حدود الأجهزة</p></div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">الحد الأقصى للأجهزة لكل طالب</label>
            <input type="number" value={maxDev} onChange={e => setMaxDev(Number(e.target.value))} className="w-full max-w-xs px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/40 transition-all" min={1} max={10} />
            <p className="text-[10px] text-slate-400 mt-1">عند تجاوز العدد يظهر تنبيه تلقائي</p>
          </div>
          <button onClick={save} className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
            {saved ? <><Check className="w-3.5 h-3.5" />تم الحفظ</> : <><Save className="w-3.5 h-3.5" />حفظ</>}
          </button>
        </div>
      </div>
    </div>
  );
}
