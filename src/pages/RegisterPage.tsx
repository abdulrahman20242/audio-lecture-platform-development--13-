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

// Floating particles for ambient background
function AmbientParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${15 + i * 14}%`,
            bottom: '-10px',
            animationDuration: `${7 + i * 1.2}s`,
            animationDelay: `${i * 1}s`,
            width: `${2 + (i % 3)}px`,
            height: `${2 + (i % 3)}px`,
            opacity: 0.25 + (i % 3) * 0.1,
          }}
        />
      ))}
    </div>
  );
}

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
      <div className="min-h-screen flex items-center justify-center p-4 grain-overlay" dir="rtl"
        style={{ background: 'radial-gradient(ellipse at 40% 30%, #0d2818 0%, #0a0f1c 50%, #050810 100%)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 -right-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/3 -left-20 w-96 h-96 bg-navy-400/10 rounded-full blur-[120px]" />
        </div>
        <div className="w-full max-w-[440px] glass-card rounded-[28px] shadow-2xl shadow-black/30 p-8 text-center relative z-10 animate-fade-in-scale">
          <div className="w-20 h-20 bg-emerald-500/15 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 font-display">تم التسجيل بنجاح! ✅</h2>
          <p className="text-slate-400 text-sm mb-5">تم إرسال طلبك إلى المدرس</p>
          
          {/* Email Verification Notice */}
          <div className="bg-gold-400/8 border border-gold-400/15 rounded-2xl p-5 mb-5 text-right">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gold-400/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <Send className="w-5 h-5 text-gold-400" />
              </div>
              <div>
                <h3 className="text-gold-300 text-sm font-extrabold">الخطوة الأولى: فعّل بريدك الإلكتروني</h3>
                <p className="text-gold-400/60 text-xs mt-0.5">مطلوب قبل تسجيل الدخول</p>
              </div>
            </div>
            <div className="bg-navy-800/50 rounded-xl p-3 space-y-2">
              <p className="text-gold-300/80 text-xs leading-relaxed">
                📧 تم إرسال رابط تفعيل إلى: <strong dir="ltr">{registeredEmail}</strong>
              </p>
              <p className="text-gold-400/70 text-xs leading-relaxed">
                1️⃣ افتح بريدك الوارد
              </p>
              <p className="text-gold-400/70 text-xs leading-relaxed">
                2️⃣ اضغط على رابط التفعيل
              </p>
              <p className="text-gold-400/70 text-xs leading-relaxed">
                3️⃣ عُد هنا وسجّل دخولك
              </p>
              <p className="text-navy-400 text-xs mt-2">
                💡 لم تجد الرسالة؟ تحقق من مجلد رسائل غير مرغوب فيها أو Spam
              </p>
            </div>
          </div>

          {/* Pending Approval Notice */}
          <div className="bg-amber-500/10 border border-amber-500/15 rounded-2xl p-4 mb-6">
            <p className="text-amber-300 text-sm font-bold flex items-center justify-center gap-2">
              <span className="text-lg">⏳</span>
              الخطوة الثانية: انتظر موافقة المدرس
            </p>
            <p className="text-amber-400/50 text-xs mt-1">حتى بعد تفعيل الإيميل، يجب أن يوافق المدرس على حسابك</p>
          </div>
          
          <button
            onClick={() => onNavigate('login')}
            className="w-full btn-gold py-3.5 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 text-navy-950 font-bold"
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden grain-overlay" dir="rtl"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, #1b2641 0%, #0a0f1c 50%, #050810 100%)' }}>
      <AmbientParticles />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-navy-500/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 -left-32 w-[500px] h-[500px] bg-navy-400/10 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #d4a853, #a37a2e)', boxShadow: '0 0 35px rgba(212, 168, 83, 0.2)' }}>
              <BookOpen className="w-8 h-8 text-navy-950" />
            </div>
            <div className="absolute -top-1 -left-1 w-5 h-5 rounded-lg flex items-center justify-center shadow-lg"
              style={{ background: '#2dd4bf' }}>
              <Sparkles className="w-3 h-3 text-teal-900" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white font-display">إنشاء حساب جديد</h1>
          <p className="text-gold-400/70 text-sm mt-1 font-medium">سجّل بياناتك وانتظر موافقة المدرس</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-[28px] shadow-2xl shadow-black/30 p-7 animate-border-glow">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-5 flex items-center gap-3 animate-fade-in-scale">
              <div className="w-9 h-9 bg-red-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-red-300 text-sm font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {fields.map(field => (
              <div key={field.label}>
                <label className="block text-sm font-bold text-gold-300/80 mb-1.5">{field.label}</label>
                <div className="relative group">
                  <field.icon className="absolute right-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-navy-400 group-focus-within:text-gold-400 transition-colors" />
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={e => field.onChange(e.target.value)}
                    className="w-full pr-12 pl-4 py-3 bg-navy-750/60 border border-navy-500/30 rounded-2xl focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400/50 text-sm text-white transition-all duration-200 placeholder:text-navy-300"
                    placeholder={field.placeholder}
                    dir={field.dir}
                    required
                  />
                </div>
              </div>
            ))}

            <div>
              <label className="block text-sm font-bold text-gold-300/80 mb-1.5">كلمة المرور</label>
              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-navy-400 group-focus-within:text-gold-400 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pr-12 pl-12 py-3 bg-navy-750/60 border border-navy-500/30 rounded-2xl focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400/50 text-sm text-white transition-all duration-200 placeholder:text-navy-300"
                  placeholder="8 أحرف على الأقل"
                  dir="ltr"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 text-navy-400 hover:text-gold-400 transition-colors rounded-lg hover:bg-navy-700/50"
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
              <p className="text-xs text-navy-300 mt-1.5 mr-1">يجب أن تكون 8 أحرف على الأقل</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gold py-3.5 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-gold-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-4 text-navy-950 font-bold"
            >
              {loading ? (
                <div className="w-5 h-5 border-[2.5px] border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-[18px] h-[18px]" />
                  إنشاء الحساب
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-navy-500/20 text-center">
            <button
              onClick={() => onNavigate('login')}
              className="text-gold-400 hover:text-gold-300 font-bold text-sm flex items-center justify-center gap-1.5 mx-auto transition-colors"
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
