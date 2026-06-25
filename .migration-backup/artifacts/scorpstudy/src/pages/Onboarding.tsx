import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UserProfileData } from "@/contexts/UserProfileContext";
import { Check, ChevronRight, ChevronLeft, Search, Globe, GraduationCap, Sparkles } from "lucide-react";

const STUDY_LEVELS = [
  { value: "SEE",            label: "SEE",            emoji: "🏫", desc: "Secondary Education Exam" },
  { value: "+2 Science",     label: "+2 Science",     emoji: "🔬", desc: "Physics, Chemistry, Biology, Math" },
  { value: "+2 Management",  label: "+2 Management",  emoji: "💼", desc: "Business, Economics, Accounts" },
  { value: "Bachelor",       label: "Bachelor",       emoji: "🎓", desc: "University undergraduate level" },
  { value: "Master",         label: "Master",         emoji: "🔬", desc: "Postgraduate / research level" },
  { value: "Other",          label: "Other",          emoji: "✨", desc: "Self-learning or other level" },
];

const LEARNING_GOALS = [
  { value: "Exam Preparation",  label: "Exam Preparation",  emoji: "📋", desc: "Ace upcoming tests & exams" },
  { value: "Homework Help",     label: "Homework Help",     emoji: "📚", desc: "Get step-by-step help" },
  { value: "Programming",       label: "Programming",       emoji: "💻", desc: "Learn to code & build" },
  { value: "Skill Development", label: "Skill Development", emoji: "🚀", desc: "Build new abilities" },
  { value: "General Learning",  label: "General Learning",  emoji: "🌍", desc: "Explore and stay curious" },
];

const INTERACTION_STYLES = [
  { value: "Friendly Tutor",     label: "Friendly Tutor",     emoji: "😊", desc: "Warm, encouraging & relatable" },
  { value: "Strict Teacher",     label: "Strict Teacher",     emoji: "📐", desc: "Direct, rigorous, precise" },
  { value: "Study Buddy",        label: "Study Buddy",        emoji: "🤝", desc: "Casual and fun learning" },
  { value: "Motivational Coach", label: "Motivational Coach", emoji: "🔥", desc: "Inspiring and energizing" },
  { value: "Professional Tutor", label: "Professional Tutor", emoji: "🎩", desc: "Formal, structured, academic" },
];

const WORLD_LANGUAGES = [
  "English","Nepali","Hindi","Chinese (Simplified)","Chinese (Traditional)",
  "Japanese","Korean","Spanish","French","German","Arabic","Russian","Portuguese",
  "Bengali","Urdu","Italian","Turkish","Vietnamese","Thai","Indonesian","Malay",
  "Tamil","Telugu","Marathi","Gujarati","Punjabi","Malayalam","Kannada","Odia",
  "Swahili","Dutch","Polish","Swedish","Norwegian","Danish","Finnish","Czech",
  "Slovak","Hungarian","Romanian","Bulgarian","Ukrainian","Hebrew","Persian/Farsi",
  "Amharic","Yoruba","Igbo","Hausa","Zulu","Sinhala","Burmese","Khmer","Lao",
  "Georgian","Armenian","Azerbaijani","Kazakh","Uzbek","Mongolian",
];

const TOTAL_STEPS = 6;

interface Props {
  onComplete: (profile: UserProfileData) => void;
}

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [nickname, setNickname] = useState("");
  const [studyLevel, setStudyLevel] = useState("");
  const [learningGoal, setLearningGoal] = useState("");
  const [language, setLanguage] = useState("English");
  const [langSearch, setLangSearch] = useState("");
  const [interactionStyle, setInteractionStyle] = useState("");
  const [completing, setCompleting] = useState(false);

  const filteredLangs = langSearch
    ? WORLD_LANGUAGES.filter(l => l.toLowerCase().includes(langSearch.toLowerCase()))
    : WORLD_LANGUAGES;

  const canContinue = () => {
    if (step === 1) return true;
    if (step === 2) return firstName.trim().length > 0;
    if (step === 3) return studyLevel !== "";
    if (step === 4) return learningGoal !== "";
    if (step === 5) return language !== "";
    if (step === 6) return interactionStyle !== "";
    return true;
  };

  const next = () => {
    if (!canContinue()) return;
    if (step === TOTAL_STEPS) { handleComplete(); return; }
    setStep(s => s + 1);
  };

  const back = () => {
    if (step === 1) return;
    setStep(s => s - 1);
  };

  const handleSkip = () => {
    onComplete({
      firstName: firstName.trim() || "Student",
      nickname: nickname.trim() || undefined,
      studyLevel: studyLevel || "Other",
      learningGoal: learningGoal || "General Learning",
      preferredLanguage: language || "English",
      interactionStyle: interactionStyle || "Friendly Tutor",
      onboardingCompleted: true,
    });
  };

  const handleComplete = () => {
    setCompleting(true);
    onComplete({
      firstName: firstName.trim(),
      nickname: nickname.trim() || undefined,
      studyLevel,
      learningGoal,
      preferredLanguage: language,
      interactionStyle,
      onboardingCompleted: true,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-violet-500 via-blue-500 to-indigo-500" />

          <div className="p-6 md:p-8">
            {/* Logo + title + skip */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-violet-600 leading-none">ScorpStudy</p>
                  <p className="text-[10px] text-slate-400 leading-tight">by Bishal</p>
                </div>
              </div>
              <button
                onClick={handleSkip}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
              >
                Skip →
              </button>
            </div>

            {/* Step indicators */}
            {step > 1 && (
              <div className="flex items-center gap-1.5 mb-6">
                {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(s => (
                  <div key={s} className="flex items-center gap-1.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      s < step ? "bg-violet-500 text-white" :
                      s === step ? "bg-violet-600 text-white ring-3 ring-violet-100" :
                      "bg-slate-100 text-slate-400"
                    }`}>
                      {s < step ? <Check className="w-3 h-3" /> : s}
                    </div>
                    {s < TOTAL_STEPS && <div className={`h-0.5 w-3 rounded ${s < step ? "bg-violet-400" : "bg-slate-100"}`} />}
                  </div>
                ))}
              </div>
            )}

            {/* Step content */}
            <div className="min-h-[300px] flex flex-col">
              {step === 1 && (
                <div className="flex flex-col items-center text-center flex-1 justify-center py-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mb-5 shadow-inner">
                    <GraduationCap className="w-10 h-10 text-violet-500" />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
                    Welcome to <span className="text-violet-600">ScorpStudy</span>!
                  </h1>
                  <p className="text-slate-500 leading-relaxed max-w-sm text-sm">
                    Your personal AI study companion — built for students by Bishal. Let's set up your profile so I can personalize your entire learning experience.
                  </p>
                  <div className="mt-5 grid grid-cols-3 gap-3 w-full max-w-xs">
                    {[["🤖","AI Tutor"],["📝","Smart Notes"],["🧠","Quizzes"]].map(([e, l]) => (
                      <div key={l} className="bg-violet-50 rounded-xl p-3 text-center border border-violet-100">
                        <span className="text-xl">{e}</span>
                        <p className="text-[11px] font-semibold text-violet-700 mt-1">{l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="flex-1">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-1">What's your name?</h2>
                    <p className="text-sm text-slate-500">I'll use this to personalise your experience.</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        className="h-11 text-base"
                        autoFocus
                        onKeyDown={e => e.key === "Enter" && canContinue() && next()}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                        Nickname <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <Input
                        value={nickname}
                        onChange={e => setNickname(e.target.value)}
                        className="h-11 text-base"
                        onKeyDown={e => e.key === "Enter" && canContinue() && next()}
                      />
                      <p className="text-xs text-slate-400 mt-1.5">If set, I'll call you by your nickname instead.</p>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="flex-1">
                  <div className="mb-5">
                    <h2 className="text-xl font-bold text-slate-900 mb-1">What's your study level?</h2>
                    <p className="text-sm text-slate-500">I'll adjust explanations to match your level.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {STUDY_LEVELS.map(opt => (
                      <button key={opt.value} onClick={() => setStudyLevel(opt.value)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                          studyLevel === opt.value
                            ? "border-violet-500 bg-violet-50 shadow-sm"
                            : "border-slate-100 hover:border-violet-200 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-xl shrink-0">{opt.emoji}</span>
                        <div className="min-w-0">
                          <p className={`text-sm font-bold truncate ${studyLevel === opt.value ? "text-violet-700" : "text-slate-800"}`}>{opt.label}</p>
                          <p className="text-[10px] text-slate-400 truncate">{opt.desc}</p>
                        </div>
                        {studyLevel === opt.value && <Check className="w-3.5 h-3.5 text-violet-500 shrink-0 ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="flex-1">
                  <div className="mb-5">
                    <h2 className="text-xl font-bold text-slate-900 mb-1">What's your main goal?</h2>
                    <p className="text-sm text-slate-500">I'll tailor every response to help you reach it.</p>
                  </div>
                  <div className="space-y-2">
                    {LEARNING_GOALS.map(opt => (
                      <button key={opt.value} onClick={() => setLearningGoal(opt.value)}
                        className={`w-full flex items-center gap-4 p-3 rounded-xl border-2 text-left transition-all ${
                          learningGoal === opt.value
                            ? "border-violet-500 bg-violet-50"
                            : "border-slate-100 hover:border-violet-200 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-xl shrink-0">{opt.emoji}</span>
                        <div>
                          <p className={`text-sm font-bold ${learningGoal === opt.value ? "text-violet-700" : "text-slate-800"}`}>{opt.label}</p>
                          <p className="text-xs text-slate-400">{opt.desc}</p>
                        </div>
                        {learningGoal === opt.value && <Check className="w-4 h-4 text-violet-500 shrink-0 ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="flex-1 flex flex-col">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-violet-500" /> Preferred Language
                    </h2>
                    <p className="text-sm text-slate-500">I'll respond in this language by default.</p>
                  </div>
                  <div className="relative mb-3">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={langSearch}
                      onChange={e => setLangSearch(e.target.value)}
                      className="pl-9 h-10"
                      autoFocus
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-48 space-y-1 rounded-xl border border-slate-100 p-2">
                    {filteredLangs.map(lang => (
                      <button key={lang} onClick={() => setLanguage(lang)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                          language === lang ? "bg-violet-50 text-violet-700 font-semibold" : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        {lang}
                        {language === lang && <Check className="w-3.5 h-3.5 text-violet-500" />}
                      </button>
                    ))}
                    {filteredLangs.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-4">No language found.</p>
                    )}
                  </div>
                  {language && <p className="text-xs text-violet-600 font-semibold mt-2">✓ Selected: {language}</p>}
                </div>
              )}

              {step === 6 && (
                <div className="flex-1">
                  <div className="mb-5">
                    <h2 className="text-xl font-bold text-slate-900 mb-1">How should I talk to you?</h2>
                    <p className="text-sm text-slate-500">Choose the tone that works best for you.</p>
                  </div>
                  <div className="space-y-2">
                    {INTERACTION_STYLES.map(opt => (
                      <button key={opt.value} onClick={() => setInteractionStyle(opt.value)}
                        className={`w-full flex items-center gap-4 p-3 rounded-xl border-2 text-left transition-all ${
                          interactionStyle === opt.value
                            ? "border-violet-500 bg-violet-50"
                            : "border-slate-100 hover:border-violet-200 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-xl shrink-0">{opt.emoji}</span>
                        <div>
                          <p className={`text-sm font-bold ${interactionStyle === opt.value ? "text-violet-700" : "text-slate-800"}`}>{opt.label}</p>
                          <p className="text-xs text-slate-400">{opt.desc}</p>
                        </div>
                        {interactionStyle === opt.value && <Check className="w-4 h-4 text-violet-500 shrink-0 ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
              {step > 1 ? (
                <Button variant="ghost" onClick={back} className="gap-1 text-slate-500">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
              ) : <div />}

              <Button
                onClick={next}
                disabled={!canContinue() || completing}
                className="gap-2 px-6 bg-violet-600 hover:bg-violet-700"
              >
                {completing ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Setting up...</>
                ) : step === 1 ? (
                  <>Get Started <ChevronRight className="w-4 h-4" /></>
                ) : step === TOTAL_STEPS ? (
                  <>🚀 Start Learning!</>
                ) : (
                  <>Continue <ChevronRight className="w-4 h-4" /></>
                )}
              </Button>
            </div>
          </div>
        </div>

        {step > 1 && (
          <p className="text-center text-slate-400 text-xs mt-4">
            Step {step} of {TOTAL_STEPS} • You can change all of this later in Settings
          </p>
        )}
      </div>
    </div>
  );
}
