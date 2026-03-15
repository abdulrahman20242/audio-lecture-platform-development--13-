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
    <header className="glass border-b border-slate-200/60 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors duration-200">
              <ArrowRight className="w-5 h-5 text-slate-600" />
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-base font-extrabold text-slate-800">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 hidden sm:flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl">
            <User className="w-3.5 h-3.5" />
            {userData?.name}
          </span>
          <button
            onClick={signOut}
            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all duration-200"
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
      <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm text-center font-medium border border-red-100">
        رابط الصوت غير صالح
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Volume2 className="w-4 h-4 text-indigo-500" />
        <span>اضغط ▶ للاستماع</span>
      </div>
      <div className="rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-b from-slate-50 to-white shadow-inner">
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
    <div className="bg-white rounded-2xl p-6 border border-slate-100">
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

// ===== SUBJECT COLORS (hoisted to avoid per-render allocation) =====
const SUBJECT_COLORS = [
  'from-indigo-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white page-transition">
      <StudentHeader title="المواد الدراسية" />
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-l from-indigo-600 via-indigo-700 to-purple-700 rounded-3xl p-6 md:p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black">مرحباً {userData?.name} 👋</h2>
                <p className="text-indigo-200 text-sm font-medium">اختر المادة للوصول إلى المحاضرات</p>
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
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <BookOpen className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-500">لا توجد مواد حالياً</h3>
            <p className="text-slate-400 text-sm mt-1">سيتم إضافة المواد قريباً</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {subjects.map((subject, i) => (
              <button
                key={subject.id}
                onClick={() => onSelectSubject(subject)}
                className={`animate-fade-in stagger-${Math.min(i + 1, 6)} bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg border border-slate-100 hover:border-indigo-200 transition-all duration-300 text-right group card-hover`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-13 h-13 bg-gradient-to-br ${SUBJECT_COLORS[i % SUBJECT_COLORS.length]} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300 p-3`}>
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                      {subject.name}
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">{subject.doctorName}</p>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:-translate-x-1 transition-all duration-300 flex-shrink-0" />
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white page-transition">
      <StudentHeader title={subject.name} onBack={onBack} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Subject Info */}
        <div className="bg-white rounded-2xl p-4 mb-6 border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">{subject.name}</h3>
            <p className="text-xs text-slate-500">{subject.doctorName}</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : lectures.length === 0 ? (
          <div className="text-center py-24 animate-fade-in">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <Headphones className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-500">لا توجد محاضرات حالياً</h3>
            <p className="text-slate-400 text-sm mt-1">سيتم إضافة المحاضرات قريباً</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lectures.map((lecture, i) => (
              <button
                key={lecture.id}
                onClick={() => onSelectLecture(lecture)}
                className={`animate-fade-in stagger-${Math.min(i + 1, 6)} w-full bg-white rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-lg border border-slate-100 hover:border-indigo-200 transition-all duration-300 text-right group card-hover`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {lecture.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      {lecture.audioUrl && (
                        <span className="text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                          <Headphones className="w-3 h-3" /> صوت
                        </span>
                      )}
                      {lecture.pdfUrl && (
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                          <FileText className="w-3 h-3" /> PDF
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:-translate-x-1 transition-all duration-300 flex-shrink-0" />
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white page-transition">
      <StudentHeader title={lecture.title} onBack={onBack} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Lecture Header */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-100 mb-5 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Headphones className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">{lecture.title}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{subject.name} — {subject.doctorName}</p>
            </div>
          </div>
        </div>

        {/* Audio Section */}
        {lecture.audioUrl && (
          <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-100 mb-5 animate-fade-in stagger-1">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Headphones className="w-[18px] h-[18px] text-indigo-600" />
                </div>
                <h3 className="font-extrabold text-slate-800">المحاضرة الصوتية</h3>
              </div>
            </div>
            
            <DriveAudioPlayer audioUrl={lecture.audioUrl} />

            <div className="mt-5 pt-4 border-t border-slate-100">
              {canDownloadAudio ? (
                <button
                  onClick={handleAudioDownload}
                  disabled={downloadingAudio}
                  className="inline-flex items-center gap-2.5 bg-gradient-to-l from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 text-sm disabled:opacity-50 shadow-lg shadow-indigo-600/20 hover:shadow-xl"
                >
                  {downloadingAudio ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {downloadingAudio ? 'جاري التحميل...' : 'تحميل الملف الصوتي'}
                </button>
              ) : (
                <div className="flex items-center gap-2.5 text-sm text-amber-700 bg-amber-50 px-4 py-3 rounded-xl border border-amber-200/60">
                  <Lock className="w-4 h-4 flex-shrink-0" />
                  <span className="font-semibold">تحميل الصوت غير مسموح على هذا الجهاز — للاستماع فقط</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PDF Section */}
        {lecture.pdfUrl && (
          <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-100 mb-5 animate-fade-in stagger-2">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-[18px] h-[18px] text-emerald-600" />
                </div>
                <h3 className="font-extrabold text-slate-800">ملف PDF</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPdf(!showPdf)}
                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition-all duration-200 text-sm"
                >
                  {showPdf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPdf ? 'إخفاء' : 'معاينة'}
                </button>
                <button
                  onClick={handlePdfDownload}
                  disabled={downloadingPdf}
                  className="inline-flex items-center gap-2 bg-gradient-to-l from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-200 text-sm disabled:opacity-50 shadow-lg shadow-emerald-600/20"
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
              <div className="rounded-2xl overflow-hidden border border-slate-200 animate-fade-in" style={{ height: '600px' }}>
                <iframe
                  src={getDrivePdfPreviewUrl(lecture.pdfUrl)}
                  className="w-full h-full"
                  title="PDF Preview"
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            ) : (
              <div className="bg-gradient-to-b from-slate-50 to-slate-100/50 rounded-2xl p-10 text-center border border-slate-200/50">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <FileText className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500 text-sm font-medium">اضغط "معاينة" لعرض الملف أو "تحميل" لتنزيله</p>
              </div>
            )}
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-4 bg-slate-50 rounded-2xl p-4 border border-slate-100 animate-fade-in stagger-3">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <Shield className="w-3.5 h-3.5" />
            <span>المحتوى محمي — يُرجى عدم مشاركة الحساب</span>
          </div>
        </div>
      </main>
    </div>
  );
}
