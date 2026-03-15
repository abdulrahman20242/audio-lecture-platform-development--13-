import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserPlus from 'lucide-react/dist/esm/icons/user-plus';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Lock from 'lucide-react/dist/esm/icons/lock';
import User from 'lucide-react/dist/esm/icons/user';
import Phone from 'lucide-react/dist/esm/icons/phone';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Send from 'lucide-react/dist/esm/icons/send';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';

export default function RegisterPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    setLoading(true);
    try {
      // Save email before signUp clears it (since signUp does signOut)
      setRegisteredEmail(email);
      await signUp(name, email, password, phone);
      setSuccess(true);
    } catch (err: any) {
      const errorMap: Record<string, string> = {
        'auth/email-already-in-use': 'هذا الإيميل مسجل بالفعل',
        'auth/weak-password': 'كلمة المرور ضعيفة — استخدم 8 أحرف على الأقل',
        'auth/invalid-email': 'البريد الإلكتروني غير صالح',
      };
      setError(errorMap[err.code] || 'حدث خطأ في التسجيل. حاول مرة أخرى');
      setSuccess(false);
    }
    setLoading(false);
  }, [name, email, password, phone, signUp]);

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 flex items-center justify-center p-4" dir="rtl">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/3 -left-20 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px]" />
        </div>
        <div className="w-full max-w-[440px] bg-white/95 backdrop-blur-xl rounded-[28px] shadow-2xl shadow-black/20 p-8 text-center relative z-10 animate-fade-in-scale">
          <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">تم التسجيل بنجاح! ✅</h2>
          <p className="text-slate-500 text-sm mb-5">تم إرسال طلبك إلى المدرس</p>
          
          {/* Email Verification Notice */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-5 text-right">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Send className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-indigo-800 text-sm font-extrabold">الخطوة الأولى: فعّل بريدك الإلكتروني</h3>
                <p className="text-indigo-500 text-xs mt-0.5">مطلوب قبل تسجيل الدخول</p>
              </div>
            </div>
            <div className="bg-indigo-100/50 rounded-xl p-3 space-y-2">
              <p className="text-indigo-700 text-xs leading-relaxed">
                📧 تم إرسال رابط تفعيل إلى: <strong dir="ltr">{registeredEmail}</strong>
              </p>
              <p className="text-indigo-600 text-xs leading-relaxed">
                1️⃣ افتح بريدك الوارد
              </p>
              <p className="text-indigo-600 text-xs leading-relaxed">
                2️⃣ اضغط على رابط التفعيل
              </p>
              <p className="text-indigo-600 text-xs leading-relaxed">
                3️⃣ عُد هنا وسجّل دخولك
              </p>
              <p className="text-indigo-400 text-xs mt-2">
                💡 لم تجد الرسالة؟ تحقق من مجلد رسائل غير مرغوب فيها أو Spam
              </p>
            </div>
          </div>

          {/* Pending Approval Notice */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6">
            <p className="text-amber-700 text-sm font-bold flex items-center justify-center gap-2">
              <span className="text-lg">⏳</span>
              الخطوة الثانية: انتظر موافقة المدرس
            </p>
            <p className="text-amber-500 text-xs mt-1">حتى بعد تفعيل الإيميل، يجب أن يوافق المدرس على حسابك</p>
          </div>
          
          <button
            onClick={() => onNavigate('login')}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 px-6 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <Mail className="w-[18px] h-[18px]" />
            الذهاب لتسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  const fields = [
    { label: 'الاسم الكامل', icon: User, type: 'text', value: name, onChange: setName, placeholder: 'أدخل اسمك الكامل', dir: 'rtl' as const },
    { label: 'البريد الإلكتروني', icon: Mail, type: 'email', value: email, onChange: setEmail, placeholder: 'example@email.com', dir: 'ltr' as const },
    { label: 'رقم التليفون', icon: Phone, type: 'tel', value: phone, onChange: setPhone, placeholder: '01xxxxxxxxx', dir: 'ltr' as const },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-indigo-500/25">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-1 -left-1 w-5 h-5 bg-amber-400 rounded-lg flex items-center justify-center shadow-lg">
              <Sparkles className="w-3 h-3 text-amber-800" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white">إنشاء حساب جديد</h1>
          <p className="text-indigo-300/70 text-sm mt-1 font-medium">سجّل بياناتك وانتظر موافقة المدرس</p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-[28px] shadow-2xl shadow-black/20 p-7">
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-5 flex items-center gap-3 animate-fade-in-scale">
              <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-red-700 text-sm font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {fields.map(field => (
              <div key={field.label}>
                <label className="block text-sm font-bold text-slate-600 mb-1.5">{field.label}</label>
                <div className="relative group">
                  <field.icon className="absolute right-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={e => field.onChange(e.target.value)}
                    className="w-full pr-12 pl-4 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 text-sm transition-all duration-200 placeholder:text-slate-400"
                    placeholder={field.placeholder}
                    dir={field.dir}
                    required
                  />
                </div>
              </div>
            ))}

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1.5">كلمة المرور</label>
              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pr-12 pl-12 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 text-sm transition-all duration-200 placeholder:text-slate-400"
                  placeholder="8 أحرف على الأقل"
                  dir="ltr"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 mr-1">يجب أن تكون 8 أحرف على الأقل</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-l from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold py-3.5 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-[18px] h-[18px]" />
                  إنشاء الحساب
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-100 text-center">
            <button
              onClick={() => onNavigate('login')}
              className="text-indigo-600 hover:text-indigo-800 font-bold text-sm flex items-center justify-center gap-1.5 mx-auto transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              لديك حساب؟ سجّل دخول
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
