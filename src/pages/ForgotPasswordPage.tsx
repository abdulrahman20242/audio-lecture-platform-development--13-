import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, ArrowRight, BookOpen, AlertCircle, CheckCircle, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.code === 'auth/user-not-found' ? 'هذا الإيميل غير مسجل' : 'حدث خطأ. حاول مرة أخرى');
    }
    setLoading(false);
  }, [email, resetPassword]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-indigo-500/25">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">استعادة كلمة المرور</h1>
          <p className="text-indigo-300/70 text-sm mt-1 font-medium">سنرسل لك رابط لإعادة تعيين كلمة المرور</p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-[28px] shadow-2xl shadow-black/20 p-7">
          {success ? (
            <div className="text-center py-4 animate-fade-in-scale">
              <div className="w-18 h-18 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-5 p-4">
                <CheckCircle className="w-9 h-9 text-emerald-500" />
              </div>
              <h2 className="text-xl font-black text-slate-800 mb-2">تم الإرسال! ✉️</h2>
              <p className="text-slate-500 text-sm mb-2">تم إرسال رابط إعادة تعيين كلمة المرور إلى</p>
              <p className="text-indigo-600 font-bold text-sm mb-5" dir="ltr">{email}</p>
              <p className="text-slate-400 text-xs mb-6">تحقق من بريدك الإلكتروني (ومجلد الـ Spam)</p>
              <button
                onClick={() => onNavigate('login')}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 px-6 rounded-2xl transition-all"
              >
                العودة لتسجيل الدخول
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-5 flex items-center gap-3 animate-fade-in-scale">
                  <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-red-700 text-sm font-semibold">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center">
                  <KeyRound className="w-8 h-8 text-indigo-600" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">البريد الإلكتروني</label>
                  <div className="relative group">
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pr-12 pl-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 text-sm transition-all duration-200 placeholder:text-slate-400"
                      placeholder="أدخل إيميلك المسجل"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-l from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold py-3.5 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-600/25 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'إرسال رابط الاستعادة'
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <button
                  onClick={() => onNavigate('login')}
                  className="text-indigo-600 hover:text-indigo-800 font-bold text-sm flex items-center justify-center gap-1.5 mx-auto transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  العودة لتسجيل الدخول
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
