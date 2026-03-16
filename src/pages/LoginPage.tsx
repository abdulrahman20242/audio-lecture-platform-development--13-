import { useState, useCallback } from 'react';
import { signInWithEmailAndPassword, sendEmailVerification, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import LogIn from 'lucide-react/dist/esm/icons/log-in';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Lock from 'lucide-react/dist/esm/icons/lock';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Send from 'lucide-react/dist/esm/icons/send';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';

// Redirect URL — always use origin without path
const REDIRECT_URL = window.location.origin;

// Floating particles for ambient background
function AmbientParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${12 + i * 12}%`,
            bottom: '-10px',
            animationDuration: `${6 + i * 1.5}s`,
            animationDelay: `${i * 0.8}s`,
            width: `${2 + (i % 3)}px`,
            height: `${2 + (i % 3)}px`,
            opacity: 0.3 + (i % 3) * 0.15,
          }}
        />
      ))}
    </div>
  );
}

export default function LoginPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailNotVerified(false);
    setResendSuccess(false);
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err: any) {
      if (err.message === 'EMAIL_NOT_VERIFIED') {
        setEmailNotVerified(true);
        setError('يجب تفعيل البريد الإلكتروني أولاً. تحقق من بريدك الوارد.');
      } else {
        const errorMap: Record<string, string> = {
          'auth/user-not-found': 'هذا الإيميل غير مسجل',
          'auth/wrong-password': 'كلمة المرور غير صحيحة',
          'auth/invalid-credential': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
          'auth/too-many-requests': 'تم تعطيل الحساب مؤقتاً بسبب محاولات كثيرة. حاول لاحقاً',
        };
        setError(errorMap[err.code] || err.message || 'حدث خطأ في تسجيل الدخول');
      }
    }
    setLoading(false);
  }, [email, password, signIn]);

  const handleResendVerification = useCallback(async () => {
    setResendLoading(true);
    setResendSuccess(false);
    try {
      // Temporarily sign in to resend verification email
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(cred.user, {
        url: REDIRECT_URL,
        handleCodeInApp: false
      });
      await firebaseSignOut(auth);
      setResendSuccess(true);
    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
        setError('تم إرسال عدة رسائل بالفعل. انتظر قليلاً ثم حاول مرة أخرى.');
      } else {
        setError('حدث خطأ أثناء إعادة الإرسال. حاول مرة أخرى.');
      }
    }
    setResendLoading(false);
  }, [email, password]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden grain-overlay" dir="rtl"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, #1b2641 0%, #0a0f1c 50%, #050810 100%)' }}>
      
      {/* Ambient Background */}
      <AmbientParticles />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-navy-500/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 -left-32 w-[500px] h-[500px] bg-navy-400/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-navy-600/25 rounded-full blur-[180px]" />
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-18 h-18 rounded-2xl flex items-center justify-center mx-auto mb-5 p-4 relative"
              style={{ background: 'linear-gradient(135deg, #d4a853, #a37a2e)', boxShadow: '0 0 40px rgba(212, 168, 83, 0.25)' }}>
              <BookOpen className="w-9 h-9 text-navy-950" />
            </div>
            <div className="absolute -top-1 -left-1 w-6 h-6 rounded-lg flex items-center justify-center shadow-lg"
              style={{ background: '#2dd4bf' }}>
              <Sparkles className="w-3.5 h-3.5 text-teal-900" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight font-display">منصة المحاضرات</h1>
          <p className="text-gold-400/70 text-sm mt-2 font-medium">تسجيل الدخول إلى حسابك</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-[28px] shadow-2xl shadow-black/30 p-7 animate-border-glow">
          {/* Error Message */}
          {error && !emailNotVerified && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-5 flex items-center gap-3 animate-fade-in-scale">
              <div className="w-9 h-9 bg-red-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-red-300 text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Email Not Verified Warning */}
          {emailNotVerified && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 mb-5 animate-fade-in-scale">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-amber-300 text-sm font-extrabold">البريد غير مفعّل</h3>
                  <p className="text-amber-400/70 text-xs mt-0.5">يجب تفعيل بريدك الإلكتروني أولاً</p>
                </div>
              </div>
              <p className="text-amber-300/80 text-xs leading-relaxed mb-4 bg-amber-500/10 rounded-xl p-3">
                تم إرسال رابط التفعيل إلى <strong dir="ltr">{email}</strong>.
                افتح بريدك الوارد واضغط على رابط التفعيل، ثم عُد وسجّل دخولك.
                <br />
                <span className="text-amber-500/60 mt-1 block">💡 لم تجد الرسالة؟ تحقق من مجلد رسائل غير مرغوب فيها أو Spam</span>
              </p>

              {resendSuccess ? (
                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 rounded-xl p-3 text-xs font-bold">
                  <CheckCircle className="w-4 h-4" />
                  تم إعادة إرسال رابط التفعيل بنجاح! تحقق من بريدك.
                </div>
              ) : (
                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold py-2.5 px-4 rounded-xl transition-all duration-200 text-sm disabled:opacity-50 border border-amber-500/20"
                >
                  {resendLoading ? (
                    <div className="w-4 h-4 border-2 border-amber-300/30 border-t-amber-300 rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {resendLoading ? 'جاري الإرسال...' : 'إعادة إرسال رابط التفعيل'}
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gold-300/80 mb-2">البريد الإلكتروني</label>
              <div className="relative group">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-navy-400 group-focus-within:text-gold-400 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pr-12 pl-4 py-3.5 bg-navy-750/60 border border-navy-500/30 rounded-2xl focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400/50 text-sm text-white transition-all duration-200 placeholder:text-navy-300"
                  placeholder="example@email.com"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gold-300/80 mb-2">كلمة المرور</label>
              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-navy-400 group-focus-within:text-gold-400 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pr-12 pl-12 py-3.5 bg-navy-750/60 border border-navy-500/30 rounded-2xl focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400/50 text-sm text-white transition-all duration-200 placeholder:text-navy-300"
                  placeholder="••••••••"
                  dir="ltr"
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
            </div>

            <div className="text-left pt-0.5">
              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                className="text-[13px] text-gold-400 hover:text-gold-300 font-semibold transition-colors"
              >
                نسيت كلمة المرور؟
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gold py-3.5 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-gold-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none mt-2 text-navy-950 font-bold"
            >
              {loading ? (
                <div className="w-5 h-5 border-[2.5px] border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-[18px] h-[18px]" />
                  تسجيل الدخول
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-navy-500/20 text-center">
            <p className="text-navy-400 text-sm">
              ليس لديك حساب؟{' '}
              <button
                onClick={() => onNavigate('register')}
                className="text-gold-400 hover:text-gold-300 font-extrabold transition-colors"
              >
                سجّل الآن
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-navy-400 text-xs mt-6 font-medium">
          منصة المحاضرات الصوتية — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
