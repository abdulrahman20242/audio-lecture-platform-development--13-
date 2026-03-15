import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Clock from 'lucide-react/dist/esm/icons/clock';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import Ban from 'lucide-react/dist/esm/icons/ban';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';

function StatusLayout({ children, gradient }: { children: React.ReactNode; gradient: string }) {
  return (
    <div className={`min-h-screen ${gradient} flex items-center justify-center p-4 relative overflow-hidden`} dir="rtl">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-white/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-white/5 rounded-full blur-[100px]" />
      </div>
      <div className="w-full max-w-[420px] bg-white/95 backdrop-blur-xl rounded-[28px] shadow-2xl shadow-black/20 p-8 text-center relative z-10 animate-fade-in-scale">
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
          ? 'bg-gradient-to-l from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg shadow-indigo-600/20'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
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
    <StatusLayout gradient="bg-gradient-to-br from-amber-950 via-slate-900 to-orange-950">
      <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <Clock className="w-10 h-10 text-amber-500" />
      </div>
      <h2 className="text-2xl font-black text-slate-800 mb-3">في انتظار الموافقة</h2>
      <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
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
    <StatusLayout gradient="bg-gradient-to-br from-red-950 via-slate-900 to-rose-950">
      <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <XCircle className="w-10 h-10 text-red-500" />
      </div>
      <h2 className="text-2xl font-black text-slate-800 mb-3">تم رفض طلبك</h2>
      <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
        للأسف تم رفض طلب تسجيلك. يرجى التواصل مع المدرس لمزيد من المعلومات.
      </p>
      <ActionButton onClick={signOut} variant="secondary" icon={LogOut} label="تسجيل الخروج" />
    </StatusLayout>
  );
}

export function SuspendedScreen() {
  const { signOut } = useAuth();
  return (
    <StatusLayout gradient="bg-gradient-to-br from-orange-950 via-slate-900 to-amber-950">
      <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <Ban className="w-10 h-10 text-orange-500" />
      </div>
      <h2 className="text-2xl font-black text-slate-800 mb-3">حسابك معلّق</h2>
      <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
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
    <StatusLayout gradient="bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950">
      <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <Smartphone className="w-10 h-10 text-indigo-500" />
      </div>
      <h2 className="text-2xl font-black text-slate-800 mb-3">جهاز غير مفعّل</h2>
      <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
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
    <StatusLayout gradient="bg-gradient-to-br from-red-950 via-slate-900 to-rose-950">
      <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <Smartphone className="w-10 h-10 text-red-500" />
      </div>
      <h2 className="text-2xl font-black text-slate-800 mb-3">هذا الجهاز مرفوض</h2>
      <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
        تم رفض هذا الجهاز من قبل المدرس. يرجى التواصل معه.
      </p>
      <ActionButton onClick={signOut} variant="secondary" icon={LogOut} label="تسجيل الخروج" />
    </StatusLayout>
  );
}
