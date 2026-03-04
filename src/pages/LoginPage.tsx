import { useState, useCallback } from 'react';
import { signInWithEmailAndPassword, sendEmailVerification, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Mail, Lock, BookOpen, Eye, EyeOff, AlertCircle, Sparkles, Send, CheckCircle } from 'lucide-react';

// Redirect URL — always use origin without path
const REDIRECT_URL = window.location.origin;

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-18 h-18 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-indigo-500/25 p-4">
              <BookOpen className="w-9 h-9 text-white" />
            </div>
            <div className="absolute -top-1 -left-1 w-6 h-6 bg-amber-400 rounded-lg flex items-center justify-center shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-amber-800" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">منصة المحاضرات</h1>
          <p className="text-indigo-300/70 text-sm mt-2 font-medium">تسجيل الدخول إلى حسابك</p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-[28px] shadow-2xl shadow-black/20 p-7">
          {/* Error Message */}
          {error && !emailNotVerified && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-5 flex items-center gap-3 animate-fade-in-scale">
              <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-red-700 text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Email Not Verified Warning */}
          {emailNotVerified && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-5 animate-fade-in-scale">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-amber-800 text-sm font-extrabold">البريد غير مفعّل</h3>
                  <p className="text-amber-600 text-xs mt-0.5">يجب تفعيل بريدك الإلكتروني أولاً</p>
                </div>
              </div>
              <p className="text-amber-700 text-xs leading-relaxed mb-4 bg-amber-100/50 rounded-xl p-3">
                تم إرسال رابط التفعيل إلى <strong dir="ltr">{email}</strong>. 
                افتح بريدك الوارد واضغط على رابط التفعيل، ثم عُد وسجّل دخولك.
                <br />
                <span className="text-amber-500 mt-1 block">💡 لم تجد الرسالة؟ تحقق من مجلد رسائل غير مرغوب فيها أو Spam</span>
              </p>

              {resendSuccess ? (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-xl p-3 text-xs font-bold">
                  <CheckCircle className="w-4 h-4" />
                  تم إعادة إرسال رابط التفعيل بنجاح! تحقق من بريدك.
                </div>
              ) : (
                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-200 text-sm disabled:opacity-50"
                >
                  {resendLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
              <label className="block text-sm font-bold text-slate-600 mb-2">البريد الإلكتروني</label>
              <div className="relative group">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pr-12 pl-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 text-sm transition-all duration-200 placeholder:text-slate-400"
                  placeholder="example@email.com"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">كلمة المرور</label>
              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pr-12 pl-12 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 text-sm transition-all duration-200 placeholder:text-slate-400"
                  placeholder="••••••••"
                  dir="ltr"
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
            </div>

            <div className="text-left pt-0.5">
              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                className="text-[13px] text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
              >
                نسيت كلمة المرور؟
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-l from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold py-3.5 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-[18px] h-[18px]" />
                  تسجيل الدخول
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm">
              ليس لديك حساب؟{' '}
              <button
                onClick={() => onNavigate('register')}
                className="text-indigo-600 hover:text-indigo-800 font-extrabold transition-colors"
              >
                سجّل الآن
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-indigo-400/30 text-xs mt-6 font-medium">
          منصة المحاضرات الصوتية — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
