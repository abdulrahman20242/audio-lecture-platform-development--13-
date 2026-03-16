import { useState, useEffect, useCallback, memo } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { SubjectData, LectureData } from '../types';
import { getDriveEmbedUrl, getDrivePdfPreviewUrl, extractDriveFileId, triggerDriveDownload } from '../utils/driveLinks';
import { getOrCreateDeviceId } from '../utils/device';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import Play from 'lucide-react/dist/esm/icons/play';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Download from 'lucide-react/dist/esm/icons/download';
import Headphones from 'lucide-react/dist/esm/icons/headphones';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import GraduationCap from 'lucide-react/dist/esm/icons/graduation-cap';
import User from 'lucide-react/dist/esm/icons/user';
import Volume2 from 'lucide-react/dist/esm/icons/volume-2';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Shield from 'lucide-react/dist/esm/icons/shield';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';

// ===== STUDENT HEADER =====
const StudentHeader = memo(function StudentHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  const { signOut, userData } = useAuth();
  return (
    <header className="glass border-b border-navy-500/12 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-navy-700/50 rounded-xl transition-colors duration-200">
              <ArrowRight className="w-5 h-5 text-gold-400" />
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #d4a853, #a37a2e)' }}>
              <BookOpen className="w-4 h-4 text-navy-950" />
            </div>
            <h1 className="text-base font-extrabold text-white font-display">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:flex items-center gap-1.5 bg-navy-700/50 px-3 py-1.5 rounded-xl border border-navy-600/30">
            <User className="w-3.5 h-3.5" />
            {userData?.name}
          </span>
          <button
            onClick={signOut}
            className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl transition-all duration-200"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
});

// ===== GOOGLE DRIVE AUDIO PLAYER =====
const DriveAudioPlayer = memo(function DriveAudioPlayer({ audioUrl }: { audioUrl: string }) {
  const fileId = extractDriveFileId(audioUrl);
  if (!fileId) {
    return (
      <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-sm text-center font-medium border border-red-500/20">
        رابط الصوت غير صالح
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Volume2 className="w-4 h-4 text-teal-400" />
        <span>اضغط ▶ للاستماع</span>
      </div>
      <div className="rounded-2xl overflow-hidden border border-navy-600/50 bg-navy-800/50 shadow-inner">
        <iframe
          src={getDriveEmbedUrl(audioUrl)}
          className="w-full"
          style={{ height: '80px' }}
          allow="autoplay; encrypted-media"
          allowFullScreen
          title="Audio Player"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
});

// ===== LOADING SKELETON =====
function SkeletonCard() {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-4">
        <div className="skeleton w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
        </div>
      </div>
    </div>
  );
}

// ===== SUBJECT COLORS (warm gradients for dark theme) =====
const SUBJECT_COLORS = [
  'from-gold-400 to-gold-600',
  'from-teal-400 to-teal-600',
  'from-violet-400 to-purple-600',
  'from-amber-400 to-orange-600',
  'from-rose-400 to-pink-600',
  'from-cyan-400 to-sky-600',
];

// ===== SUBJECTS PAGE =====
export function SubjectsPage({ onSelectSubject }: { onSelectSubject: (subject: SubjectData) => void }) {
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const { userData, user } = useAuth();

  useEffect(() => {
    async function fetchSubjects() {
      try {
        const q = query(collection(db, 'subjects'), orderBy('order', 'asc'));
        const snap = await getDocs(q);
        setSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as SubjectData)));
        if (user) {
          const deviceId = getOrCreateDeviceId();
          updateDoc(doc(db, 'users', user.uid), {
            lastActiveAt: serverTimestamp(),
            lastActiveDevice: deviceId
          }).catch(() => {});
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
      }
      setLoading(false);
    }
    fetchSubjects();
  }, [user]);


  return (
    <div className="min-h-screen page-transition grain-overlay"
      style={{ background: 'linear-gradient(180deg, #0a0f1c 0%, #0e1425 50%, #0a0f1c 100%)' }}>
      <StudentHeader title="المواد الدراسية" />
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Welcome Banner */}
        <div className="rounded-3xl p-6 md:p-8 mb-8 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1a1508 0%, #1b2641 50%, #131a2e 100%)', border: '1px solid rgba(63, 85, 128, 0.2)' }}>
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_rgba(63,85,128,0.12),transparent_50%)]" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gold-400/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-gold-400/20">
                <GraduationCap className="w-6 h-6 text-gold-400" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black font-display">مرحباً {userData?.name} 👋</h2>
                <p className="text-gold-400/60 text-sm font-medium">اختر المادة للوصول إلى المحاضرات</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-24 animate-fade-in">
            <div className="w-20 h-20 bg-navy-700/50 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-navy-500/25">
              <BookOpen className="w-10 h-10 text-navy-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-400 font-display">لا توجد مواد حالياً</h3>
            <p className="text-navy-400 text-sm mt-1">سيتم إضافة المواد قريباً</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {subjects.map((subject, i) => (
              <button
                key={subject.id}
                onClick={() => onSelectSubject(subject)}
                className={`animate-fade-in stagger-${Math.min(i + 1, 6)} glass-card rounded-2xl p-5 hover:shadow-lg transition-all duration-300 text-right group card-hover`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-13 h-13 bg-gradient-to-br ${SUBJECT_COLORS[i % SUBJECT_COLORS.length]} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300 p-3`}>
                    <BookOpen className="w-6 h-6 text-navy-950" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-extrabold text-white group-hover:text-gold-400 transition-colors truncate font-display">
                      {subject.name}
                    </h3>
                    <p className="text-sm text-slate-400 mt-0.5">{subject.doctorName}</p>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-navy-500 group-hover:text-gold-400 group-hover:-translate-x-1 transition-all duration-300 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ===== LECTURES LIST =====
export function LecturesPage({
  subject, onBack, onSelectLecture
}: {
  subject: SubjectData;
  onBack: () => void;
  onSelectLecture: (lecture: LectureData) => void;
}) {
  const [lectures, setLectures] = useState<LectureData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLectures() {
      try {
        const q = query(collection(db, 'subjects', subject.id, 'lectures'), orderBy('order', 'asc'));
        const snap = await getDocs(q);
        setLectures(snap.docs.map(d => ({ id: d.id, ...d.data() } as LectureData)));
      } catch (error) {
        console.error('Error fetching lectures:', error);
      }
      setLoading(false);
    }
    fetchLectures();
  }, [subject.id]);

  return (
    <div className="min-h-screen page-transition grain-overlay"
      style={{ background: 'linear-gradient(180deg, #0a0f1c 0%, #0e1425 50%, #0a0f1c 100%)' }}>
      <StudentHeader title={subject.name} onBack={onBack} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Subject Info */}
        <div className="glass-card rounded-2xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-gold-400/15 rounded-xl flex items-center justify-center flex-shrink-0 border border-gold-400/15">
            <BookOpen className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm font-display">{subject.name}</h3>
            <p className="text-xs text-slate-400">{subject.doctorName}</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : lectures.length === 0 ? (
          <div className="text-center py-24 animate-fade-in">
            <div className="w-20 h-20 bg-navy-700/50 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-navy-500/25">
              <Headphones className="w-10 h-10 text-navy-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-400 font-display">لا توجد محاضرات حالياً</h3>
            <p className="text-navy-400 text-sm mt-1">سيتم إضافة المحاضرات قريباً</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lectures.map((lecture, i) => (
              <button
                key={lecture.id}
                onClick={() => onSelectLecture(lecture)}
                className={`animate-fade-in stagger-${Math.min(i + 1, 6)} w-full glass-card rounded-2xl p-4 md:p-5 hover:shadow-lg transition-all duration-300 text-right group card-hover`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300"
                    style={{ background: 'linear-gradient(135deg, #d4a853, #a37a2e)' }}>
                    <Play className="w-5 h-5 text-navy-950" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white group-hover:text-gold-400 transition-colors font-display">
                      {lecture.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      {lecture.audioUrl && (
                        <span className="text-xs text-teal-400 bg-teal-400/10 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 border border-teal-400/15">
                          <Headphones className="w-3 h-3" /> صوت
                        </span>
                      )}
                      {lecture.pdfUrl && (
                        <span className="text-xs text-gold-400 bg-gold-400/10 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 border border-gold-400/15">
                          <FileText className="w-3 h-3" /> PDF
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-navy-500 group-hover:text-gold-400 group-hover:-translate-x-1 transition-all duration-300 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ===== SINGLE LECTURE VIEW =====
export function LecturePage({
  lecture, subject, onBack
}: {
  lecture: LectureData;
  subject: SubjectData;
  onBack: () => void;
}) {
  const { deviceData, user } = useAuth();
  const [downloadingAudio, setDownloadingAudio] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showPdf, setShowPdf] = useState(false);

  useEffect(() => {
    if (user) {
      const deviceId = getOrCreateDeviceId();
      updateDoc(doc(db, 'users', user.uid), {
        lastActiveAt: serverTimestamp(),
        lastActiveDevice: deviceId
      }).catch(() => {});
    }
  }, [user]);

  const canDownloadAudio = deviceData?.canDownloadAudio === true && user?.emailVerified === true;

  const handleAudioDownload = useCallback(() => {
    if (!lecture.audioUrl || !canDownloadAudio || !user?.emailVerified) return;
    setDownloadingAudio(true);
    triggerDriveDownload(lecture.audioUrl);
    setTimeout(() => setDownloadingAudio(false), 2000);
  }, [lecture.audioUrl, canDownloadAudio, user?.emailVerified]);

  const handlePdfDownload = useCallback(() => {
    if (!lecture.pdfUrl || !user?.emailVerified) return;
    setDownloadingPdf(true);
    triggerDriveDownload(lecture.pdfUrl);
    setTimeout(() => setDownloadingPdf(false), 2000);
  }, [lecture.pdfUrl, user?.emailVerified]);

  return (
    <div className="min-h-screen page-transition grain-overlay"
      style={{ background: 'linear-gradient(180deg, #0a0f1c 0%, #0e1425 50%, #0a0f1c 100%)' }}>
      <StudentHeader title={lecture.title} onBack={onBack} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Lecture Header */}
        <div className="glass-card rounded-2xl p-5 md:p-6 mb-5 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #d4a853, #a37a2e)', boxShadow: '0 0 25px rgba(212, 168, 83, 0.15)' }}>
              <Headphones className="w-7 h-7 text-navy-950" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white font-display">{lecture.title}</h2>
              <p className="text-sm text-slate-400 mt-0.5">{subject.name} — {subject.doctorName}</p>
            </div>
          </div>
        </div>

        {/* Audio Section */}
        {lecture.audioUrl && (
          <div className="glass-card rounded-2xl p-5 md:p-6 mb-5 animate-fade-in stagger-1">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-teal-400/15 rounded-xl flex items-center justify-center border border-teal-400/15">
                  <Headphones className="w-[18px] h-[18px] text-teal-400" />
                </div>
                <h3 className="font-extrabold text-white font-display">المحاضرة الصوتية</h3>
              </div>
            </div>
            
            <DriveAudioPlayer audioUrl={lecture.audioUrl} />

            <div className="mt-5 pt-4 border-t border-navy-500/20">
              {canDownloadAudio ? (
                <button
                  onClick={handleAudioDownload}
                  disabled={downloadingAudio}
                  className="inline-flex items-center gap-2.5 btn-gold text-navy-950 font-bold py-3 px-6 rounded-xl transition-all duration-200 text-sm disabled:opacity-50 shadow-lg shadow-gold-500/15 hover:shadow-xl"
                >
                  {downloadingAudio ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {downloadingAudio ? 'جاري التحميل...' : 'تحميل الملف الصوتي'}
                </button>
              ) : (
                <div className="flex items-center gap-2.5 text-sm text-amber-300 bg-amber-500/10 px-4 py-3 rounded-xl border border-amber-500/15">
                  <Lock className="w-4 h-4 flex-shrink-0" />
                  <span className="font-semibold">تحميل الصوت غير مسموح على هذا الجهاز — للاستماع فقط</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PDF Section */}
        {lecture.pdfUrl && (
          <div className="glass-card rounded-2xl p-5 md:p-6 mb-5 animate-fade-in stagger-2">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gold-400/15 rounded-xl flex items-center justify-center border border-gold-400/15">
                  <FileText className="w-[18px] h-[18px] text-gold-400" />
                </div>
                <h3 className="font-extrabold text-white font-display">ملف PDF</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPdf(!showPdf)}
                  className="inline-flex items-center gap-1.5 bg-navy-700/50 hover:bg-navy-600/50 text-slate-300 font-bold py-2.5 px-4 rounded-xl transition-all duration-200 text-sm border border-navy-600/30"
                >
                  {showPdf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPdf ? 'إخفاء' : 'معاينة'}
                </button>
                <button
                  onClick={handlePdfDownload}
                  disabled={downloadingPdf}
                  className="inline-flex items-center gap-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-bold py-2.5 px-4 rounded-xl transition-all duration-200 text-sm disabled:opacity-50 border border-teal-500/20"
                >
                  {downloadingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {downloadingPdf ? 'تحميل...' : 'تحميل PDF'}
                </button>
              </div>
            </div>

            {showPdf ? (
              <div className="rounded-2xl overflow-hidden border border-navy-600/50 animate-fade-in" style={{ height: '600px' }}>
                <iframe
                  src={getDrivePdfPreviewUrl(lecture.pdfUrl)}
                  className="w-full h-full"
                  title="PDF Preview"
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            ) : (
              <div className="bg-navy-800/50 rounded-2xl p-10 text-center border border-navy-600/30">
                <div className="w-16 h-16 bg-navy-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-navy-600/30">
                  <FileText className="w-8 h-8 text-navy-500" />
                </div>
                <p className="text-slate-400 text-sm font-medium">اضغط "معاينة" لعرض الملف أو "تحميل" لتنزيله</p>
              </div>
            )}
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-4 bg-navy-750/30 rounded-2xl p-4 border border-navy-500/15 animate-fade-in stagger-3">
          <div className="flex items-center justify-center gap-2 text-xs text-navy-400">
            <Shield className="w-3.5 h-3.5" />
            <span>المحتوى محمي — يُرجى عدم مشاركة الحساب</span>
          </div>
        </div>
      </main>
    </div>
  );
}
