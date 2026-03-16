import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Clock from 'lucide-react/dist/esm/icons/clock';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import Ban from 'lucide-react/dist/esm/icons/ban';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';

function StatusLayout({ children, accentColor }: { children: React.ReactNode; accentColor: string }) {
  const bgMap: Record<string, string> = {
    gold: 'radial-gradient(ellipse at 40% 30%, #1a1508 0%, #0a0f1c 50%, #050810 100%)',
    red: 'radial-gradient(ellipse at 40% 30%, #1a0808 0%, #0a0f1c 50%, #050810 100%)',
    orange: 'radial-gradient(ellipse at 40% 30%, #1a1005 0%, #0a0f1c 50%, #050810 100%)',
    teal: 'radial-gradient(ellipse at 40% 30%, #081a18 0%, #0a0f1c 50%, #050810 100%)',
  };
  const glowMap: Record<string, string> = {
    gold: 'rgba(212, 168, 83, 0.06)',
    red: 'rgba(239, 68, 68, 0.06)',
    orange: 'rgba(249, 115, 22, 0.06)',
    teal: 'rgba(45, 212, 191, 0.06)',
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden grain-overlay" dir="rtl"
      style={{ background: bgMap[accentColor] || bgMap.gold }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -right-20 w-96 h-96 rounded-full blur-[120px]" style={{ background: glowMap[accentColor] }} />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 rounded-full blur-[120px]" style={{ background: glowMap[accentColor] }} />
      </div>
      <div className="w-full max-w-[420px] glass-card rounded-[28px] shadow-2xl shadow-black/30 p-8 text-center relative z-10 animate-fade-in-scale">
        {children}
      </div>
    </div>
  );
}

function ActionButton({ onClick, variant, icon: Icon, label, loading }: {
  onClick: () => void;
  variant: 'primary' | 'secondary';
  icon: React.ElementType;
  label: string;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-2.5 font-bold py-3 px-6 rounded-2xl transition-all duration-200 text-sm disabled:opacity-50 ${
        variant === 'primary'
          ? 'btn-gold text-navy-950 shadow-lg shadow-gold-500/15'
          : 'bg-navy-700/50 hover:bg-navy-600/50 text-slate-300 border border-navy-600/30'
      }`}
    >
      <Icon className={`w-[18px] h-[18px] ${loading ? 'animate-spin' : ''}`} />
      {label}
    </button>
  );
}

export function PendingApprovalScreen() {
  const { signOut, refreshUserData } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshUserData();
    setRefreshing(false);
  };

  return (
    <StatusLayout accentColor="gold">
      <div className="w-20 h-20 bg-gold-400/15 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-gold-400/20 animate-float">
        <Clock className="w-10 h-10 text-gold-400" />
      </div>
      <h2 className="text-2xl font-black text-white mb-3 font-display">في انتظار الموافقة</h2>
      <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
        تم إرسال طلبك بنجاح. يرجى الانتظار حتى يوافق المدرس على حسابك.
      </p>
      <div className="flex gap-3 justify-center flex-wrap">
        <ActionButton onClick={handleRefresh} variant="primary" icon={RefreshCw} label="تحديث الحالة" loading={refreshing} />
        <ActionButton onClick={signOut} variant="secondary" icon={LogOut} label="خروج" />
      </div>
    </StatusLayout>
  );
}

export function RejectedScreen() {
  const { signOut } = useAuth();
  return (
    <StatusLayout accentColor="red">
      <div className="w-20 h-20 bg-red-500/15 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-500/20 animate-float">
        <XCircle className="w-10 h-10 text-red-400" />
      </div>
      <h2 className="text-2xl font-black text-white mb-3 font-display">تم رفض طلبك</h2>
      <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
        للأسف تم رفض طلب تسجيلك. يرجى التواصل مع المدرس لمزيد من المعلومات.
      </p>
      <ActionButton onClick={signOut} variant="secondary" icon={LogOut} label="تسجيل الخروج" />
    </StatusLayout>
  );
}

export function SuspendedScreen() {
  const { signOut } = useAuth();
  return (
    <StatusLayout accentColor="orange">
      <div className="w-20 h-20 bg-orange-500/15 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-orange-500/20 animate-float">
        <Ban className="w-10 h-10 text-orange-400" />
      </div>
      <h2 className="text-2xl font-black text-white mb-3 font-display">حسابك معلّق</h2>
      <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
        تم تعليق حسابك مؤقتاً. يرجى التواصل مع المدرس.
      </p>
      <ActionButton onClick={signOut} variant="secondary" icon={LogOut} label="تسجيل الخروج" />
    </StatusLayout>
  );
}

export function DevicePendingScreen() {
  const { signOut, refreshUserData } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshUserData();
    setRefreshing(false);
  };

  return (
    <StatusLayout accentColor="teal">
      <div className="w-20 h-20 bg-teal-400/15 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-teal-400/20 animate-float">
        <Smartphone className="w-10 h-10 text-teal-400" />
      </div>
      <h2 className="text-2xl font-black text-white mb-3 font-display">جهاز غير مفعّل</h2>
      <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
        هذا الجهاز غير مفعّل بعد. تم إرسال طلب للمدرس للموافقة عليه.
      </p>
      <div className="flex gap-3 justify-center flex-wrap">
        <ActionButton onClick={handleRefresh} variant="primary" icon={RefreshCw} label="تحديث" loading={refreshing} />
        <ActionButton onClick={signOut} variant="secondary" icon={LogOut} label="خروج" />
      </div>
    </StatusLayout>
  );
}

export function DeviceRejectedScreen() {
  const { signOut } = useAuth();
  return (
    <StatusLayout accentColor="red">
      <div className="w-20 h-20 bg-red-500/15 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-500/20 animate-float">
        <Smartphone className="w-10 h-10 text-red-400" />
      </div>
      <h2 className="text-2xl font-black text-white mb-3 font-display">هذا الجهاز مرفوض</h2>
      <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
        تم رفض هذا الجهاز من قبل المدرس. يرجى التواصل معه.
      </p>
      <ActionButton onClick={signOut} variant="secondary" icon={LogOut} label="تسجيل الخروج" />
    </StatusLayout>
  );
}
