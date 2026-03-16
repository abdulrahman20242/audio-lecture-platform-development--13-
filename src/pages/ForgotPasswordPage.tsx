import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Mail from 'lucide-react/dist/esm/icons/mail';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import KeyRound from 'lucide-react/dist/esm/icons/key-round';

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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden grain-overlay" dir="rtl"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, #1b2641 0%, #0a0f1c 50%, #050810 100%)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-navy-500/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 -left-32 w-[500px] h-[500px] bg-navy-400/10 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #d4a853, #a37a2e)', boxShadow: '0 0 35px rgba(212, 168, 83, 0.2)' }}>
            <BookOpen className="w-8 h-8 text-navy-950" />
          </div>
          <h1 className="text-2xl font-black text-white font-display">استعادة كلمة المرور</h1>
          <p className="text-gold-400/70 text-sm mt-1 font-medium">سنرسل لك رابط لإعادة تعيين كلمة المرور</p>
        </div>

        <div className="glass-card rounded-[28px] shadow-2xl shadow-black/30 p-7 animate-border-glow">
          {success ? (
            <div className="text-center py-4 animate-fade-in-scale">
              <div className="w-18 h-18 bg-emerald-500/15 rounded-3xl flex items-center justify-center mx-auto mb-5 p-4 border border-emerald-500/20">
                <CheckCircle className="w-9 h-9 text-emerald-400" />
              </div>
              <h2 className="text-xl font-black text-white mb-2 font-display">تم الإرسال! ✉️</h2>
              <p className="text-slate-400 text-sm mb-2">تم إرسال رابط إعادة تعيين كلمة المرور إلى</p>
              <p className="text-gold-400 font-bold text-sm mb-5" dir="ltr">{email}</p>
              <p className="text-navy-400 text-xs mb-6">تحقق من بريدك الإلكتروني (ومجلد الـ Spam)</p>
              <button
                onClick={() => onNavigate('login')}
                className="w-full btn-gold py-3.5 px-6 rounded-2xl transition-all text-navy-950 font-bold"
              >
                العودة لتسجيل الدخول
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-5 flex items-center gap-3 animate-fade-in-scale">
                  <div className="w-9 h-9 bg-red-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <p className="text-red-300 text-sm font-semibold">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-gold-400/10 rounded-2xl flex items-center justify-center border border-gold-400/15">
                  <KeyRound className="w-8 h-8 text-gold-400" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gold-300/80 mb-2">البريد الإلكتروني</label>
                  <div className="relative group">
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-navy-400 group-focus-within:text-gold-400 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pr-12 pl-4 py-3.5 bg-navy-750/60 border border-navy-500/30 rounded-2xl focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400/50 text-sm text-white transition-all duration-200 placeholder:text-navy-300"
                      placeholder="أدخل إيميلك المسجل"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-gold py-3.5 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-gold-500/20 disabled:opacity-50 text-navy-950 font-bold"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-[2.5px] border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
                  ) : (
                    'إرسال رابط الاستعادة'
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-navy-500/20 text-center">
                <button
                  onClick={() => onNavigate('login')}
                  className="text-gold-400 hover:text-gold-300 font-bold text-sm flex items-center justify-center gap-1.5 mx-auto transition-colors"
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
