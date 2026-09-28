import React, { useState } from 'react';
import {
  Sparkles, Check, ChevronRight, ChevronLeft, Loader2, Plus, X,
  BookOpen, Target, GraduationCap, Brain, Clock, FileText,
  Monitor, Landmark, HeartPulse, Scale, Briefcase, Settings,
  Megaphone, Microscope, Palette, Globe, Code, TrendingUp,
  Calculator, Lightbulb, LineChart, Users, Bot, Rocket, BookMarked
} from 'lucide-react';
import { logInterests } from '../api/client';

// ─── Step 1: Academic / Professional Background ───────────────────────────────
const BACKGROUNDS = [
  { id: 'student_undergrad', label: 'Undergraduate Student',     desc: "Currently pursuing a bachelor's degree" },
  { id: 'student_postgrad',  label: 'Postgraduate / Researcher', desc: "Master's, PhD or active academic research" },
  { id: 'professional',      label: 'Working Professional',      desc: 'Employed and seeking to upskill or stay informed' },
  { id: 'educator',          label: 'Educator / Academic',       desc: 'Teaching or mentoring in an academic setting' },
  { id: 'self_learner',      label: 'Self-Directed Learner',     desc: 'Learning independently out of curiosity or passion' },
  { id: 'entrepreneur',      label: 'Entrepreneur / Founder',    desc: 'Building or running a business and seeking strategic insight' },
  { id: 'executive',         label: 'Executive / Manager',       desc: 'Leading teams and driving organisational strategy' },
];

// ─── Step 2: Industry / Domain ───────────────────────────────────────────────
const INDUSTRIES = [
  { id: 'tech',        label: 'Technology & Software',     icon: <Monitor size={20} /> },
  { id: 'finance',     label: 'Finance & Banking',         icon: <Landmark size={20} /> },
  { id: 'healthcare',  label: 'Healthcare & Medicine',     icon: <HeartPulse size={20} /> },
  { id: 'law',         label: 'Law & Compliance',          icon: <Scale size={20} /> },
  { id: 'education',   label: 'Education & Academia',      icon: <GraduationCap size={20} /> },
  { id: 'consulting',  label: 'Consulting & Strategy',     icon: <Briefcase size={20} /> },
  { id: 'engineering', label: 'Engineering & R&D',         icon: <Settings size={20} /> },
  { id: 'marketing',   label: 'Marketing & Media',         icon: <Megaphone size={20} /> },
  { id: 'public',      label: 'Public Sector & Policy',    icon: <Landmark size={20} /> },
  { id: 'sciences',    label: 'Natural & Life Sciences',   icon: <Microscope size={20} /> },
  { id: 'arts',        label: 'Arts, Design & Humanities', icon: <Palette size={20} /> },
  { id: 'other',       label: 'Other / Independent',       icon: <Globe size={20} /> },
];

// ─── Step 3: Fields of Interest ──────────────────────────────────────────────
const SUGGESTED_TOPICS = [
  { label: 'Computer Science',     icon: <Code size={16} /> },
  { label: 'Business & Finance',   icon: <TrendingUp size={16} /> },
  { label: 'Medicine & Health',    icon: <HeartPulse size={16} /> },
  { label: 'Psychology',           icon: <Brain size={16} /> },
  { label: 'Engineering',          icon: <Settings size={16} /> },
  { label: 'Law & Political Sci.', icon: <Scale size={16} /> },
  { label: 'Literature & Arts',    icon: <Palette size={16} /> },
  { label: 'Mathematics',          icon: <Calculator size={16} /> },
  { label: 'Natural Sciences',     icon: <Microscope size={16} /> },
  { label: 'World History',        icon: <Globe size={16} /> },
  { label: 'Philosophy',           icon: <Lightbulb size={16} /> },
  { label: 'Economics',            icon: <LineChart size={16} /> },
  { label: 'Education',            icon: <BookMarked size={16} /> },
  { label: 'Sociology',            icon: <Users size={16} /> },
  { label: 'Data Science & AI',    icon: <Bot size={16} /> },
  { label: 'Leadership & Mgmt',    icon: <Target size={16} /> },
  { label: 'Entrepreneurship',     icon: <Rocket size={16} /> },
  { label: 'Ethics & Governance',  icon: <Landmark size={16} /> },
];

// ─── Step 4: Reading Goals ────────────────────────────────────────────────────
const READING_GOALS = [
  { id: 'exam',       label: 'Exam & Course Preparation',    desc: 'Textbooks and structured material aligned with my curriculum' },
  { id: 'career',     label: 'Career Advancement',           desc: 'Practical, industry-focused books to grow professionally' },
  { id: 'research',   label: 'Academic Research',            desc: 'Peer-level literature, theoretical foundations, and deep dives' },
  { id: 'leadership', label: 'Leadership Development',       desc: 'Strategy, management and executive decision-making frameworks' },
  { id: 'innovation', label: 'Innovation & Entrepreneurship',desc: 'Case studies, venture thinking and disruptive ideas' },
  { id: 'growth',     label: 'Personal Growth',              desc: 'Broaden my understanding and develop new perspectives' },
  { id: 'leisure',    label: 'Intellectual Leisure',         desc: 'Engaging, thought-provoking books for pleasure and curiosity' },
];

// ─── Step 5: Knowledge Depth ─────────────────────────────────────────────────
const SKILL_LEVELS = [
  { id: 'introductory', label: 'Introductory', desc: 'I am new to these subjects — start from the foundations' },
  { id: 'intermediate', label: 'Intermediate', desc: 'I have foundational knowledge and want to go deeper' },
  { id: 'advanced',     label: 'Advanced',      desc: 'I want cutting-edge, research-level or expert material' },
  { id: 'mixed',        label: 'Mixed Levels',  desc: 'Varies by subject — surface some beginner and some advanced' },
];

// ─── Step 6: Preferred Format / Style ────────────────────────────────────────
const FORMATS = [
  { id: 'textbook',  label: 'Structured Textbooks',    desc: 'Step-by-step, chapter-driven academic texts with exercises' },
  { id: 'casestudy', label: 'Case Studies & Analysis', desc: 'Real-world scenarios, decision-making and applied learning' },
  { id: 'biography', label: 'Biographies & Memoirs',   desc: 'Life stories of influential figures and thought leaders' },
  { id: 'essay',     label: 'Essays & Long-Form',       desc: 'Argument-driven, analytical and philosophical writing' },
  { id: 'practical', label: 'Practical Guides',         desc: 'How-to books, toolkits and actionable frameworks' },
  { id: 'narrative', label: 'Narrative Non-Fiction',    desc: 'Story-driven books that make complex topics accessible' },
  { id: 'any',       label: 'No Preference',            desc: "Surprise me — open to any format that fits my goals" },
];

const STEPS = [
  { num: 1, icon: <GraduationCap size={16} />, title: 'Background' },
  { num: 2, icon: <FileText size={16} />,       title: 'Industry'   },
  { num: 3, icon: <BookOpen size={16} />,       title: 'Interests'  },
  { num: 4, icon: <Target size={16} />,          title: 'Goals'     },
  { num: 5, icon: <Brain size={16} />,           title: 'Depth'     },
  { num: 6, icon: <Clock size={16} />,           title: 'Format'    },
];

export default function OnboardingModal({ onComplete }) {
  const [step, setStep]                     = useState(1);
  const [background, setBackground]         = useState(null);
  const [industry, setIndustry]             = useState(null);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [inputValue, setInputValue]         = useState('');
  const [readingGoal, setReadingGoal]       = useState(null);
  const [skillLevel, setSkillLevel]         = useState(null);
  const [format, setFormat]                 = useState(null);
  const [isSubmitting, setIsSubmitting]     = useState(false);

  const toggleTopic = (label) => {
    setSelectedTopics(prev =>
      prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label]
    );
  };

  const handleAddCustomTopic = (e) => {
    e.preventDefault();
    const val = inputValue.trim();
    if (val && !selectedTopics.includes(val)) {
      setSelectedTopics(prev => [...prev, val]);
    }
    setInputValue('');
  };

  const canAdvance = () => {
    if (step === 1) return !!background;
    if (step === 2) return !!industry;
    if (step === 3) return selectedTopics.length >= 2;
    if (step === 4) return !!readingGoal;
    if (step === 5) return !!skillLevel;
    if (step === 6) return !!format;
    return false;
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    const interestsToLog = [
      ...selectedTopics,
      readingGoal,
      `${skillLevel} level`,
      `${format} format`,
      industry,
    ].filter(Boolean);

    await logInterests(interestsToLog);
    localStorage.setItem('onboardingCompleted', 'true');
    localStorage.setItem('userProfile', JSON.stringify({
      background, industry, topics: selectedTopics,
      readingGoal, skillLevel, format,
    }));
    setIsSubmitting(false);
    onComplete(selectedTopics, { background, industry, readingGoal, skillLevel, format });
  };

  // ── Shared helpers ──
  const cardBtn = (isSelected) => ({
    width: '100%',
    padding: '0.9rem 1.15rem',
    borderRadius: 'var(--radius-md)',
    border: isSelected ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
    backgroundColor: isSelected ? 'rgba(99,102,241,0.06)' : 'var(--bg-surface-2)',
    textAlign: 'left', cursor: 'pointer',
    transition: 'all 0.18s',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '1rem',
  });

  const radioCircle = (isSelected) => ({
    width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
    border: isSelected ? 'none' : '2px solid var(--border-color)',
    backgroundColor: isSelected ? 'var(--accent-color)' : 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.18s',
  });

  const stepDotStyle = (s) => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
    color: step >= s ? 'var(--accent-color)' : 'var(--text-muted)',
    fontSize: '0.62rem', fontWeight: 600, transition: 'color 0.2s',
  });
  const stepLineStyle = (s) => ({
    flex: 1, height: '2px', borderRadius: '1px',
    backgroundColor: step > s ? 'var(--accent-color)' : 'var(--border-color)',
    transition: 'background-color 0.3s',
    marginBottom: '16px',
  });

  const SectionHeader = ({ title, subtitle }) => (
    <div style={{ marginBottom: '1.2rem' }}>
      <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.05rem', fontWeight: 700 }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>{subtitle}</p>
    </div>
  );

  const CardLabel = ({ label, desc, sel }) => (
    <div>
      <div style={{ fontWeight: 600, color: sel ? 'var(--accent-color)' : 'var(--text-primary)', marginBottom: '2px', fontSize: '0.875rem' }}>{label}</div>
      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{desc}</div>
    </div>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '1rem',
      animation: 'fadeIn 0.25s ease-out',
    }}>
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        width: '100%', maxWidth: '640px',
        maxHeight: '92vh',
        boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        border: '1px solid var(--border-color)',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '1.4rem 2rem 1rem',
          borderBottom: '1px solid var(--border-color)',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(168,85,247,0.06) 100%)',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1.1rem' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '50%',
              backgroundColor: 'var(--accent-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
              flexShrink: 0,
            }}>
              <Sparkles size={19} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                Build Your Reading Profile
              </h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                6 questions — we'll curate a precision-tailored library from millions of books.
              </p>
            </div>
          </div>

          {/* Step indicators */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.25rem' }}>
            {STEPS.map((s, idx) => (
              <React.Fragment key={s.num}>
                <div style={stepDotStyle(s.num)}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%',
                    backgroundColor: step >= s.num ? 'var(--accent-color)' : 'var(--bg-surface-2)',
                    border: `2px solid ${step >= s.num ? 'var(--accent-color)' : 'var(--border-color)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                    color: step >= s.num ? '#fff' : 'var(--text-muted)',
                  }}>
                    {step > s.num ? <Check size={12} /> : s.icon}
                  </div>
                  {s.title}
                </div>
                {idx < STEPS.length - 1 && <div style={stepLineStyle(s.num)} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ padding: '1.5rem 2rem', overflowY: 'auto', flex: 1 }}>

          {/* ── Step 1: Background ── */}
          {step === 1 && (
            <div>
              <SectionHeader
                title="What best describes your current role?"
                subtitle="This helps us match the right type and depth of material for you."
              />
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {BACKGROUNDS.map(bg => {
                  const sel = background === bg.id;
                  return (
                    <button key={bg.id} onClick={() => setBackground(bg.id)} style={cardBtn(sel)}>
                      <CardLabel label={bg.label} desc={bg.desc} sel={sel} />
                      <div style={radioCircle(sel)}>{sel && <Check size={12} color="#fff" />}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 2: Industry ── */}
          {step === 2 && (
            <div>
              <SectionHeader
                title="Which industry or domain are you most active in?"
                subtitle="We use this to surface professionally relevant, sector-specific literature."
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {INDUSTRIES.map(ind => {
                  const sel = industry === ind.id;
                  return (
                    <button key={ind.id} onClick={() => setIndustry(ind.id)} style={{
                      padding: '0.9rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: sel ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                      backgroundColor: sel ? 'rgba(99,102,241,0.06)' : 'var(--bg-surface-2)',
                      cursor: 'pointer', transition: 'all 0.18s',
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem',
                      textAlign: 'left',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ind.icon}</span>
                        <div style={radioCircle(sel)}>{sel && <Check size={11} color="#fff" />}</div>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem', color: sel ? 'var(--accent-color)' : 'var(--text-primary)', lineHeight: 1.35 }}>
                        {ind.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 3: Topics ── */}
          {step === 3 && (
            <div>
              <SectionHeader
                title="Which fields of knowledge do you want to explore?"
                subtitle="Select at least 2. You can also add a niche subject below."
              />

              <form onSubmit={handleAddCustomTopic} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder='e.g. "Astrophysics", "Forensic Science", "Islamic Finance"...'
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  style={{ flex: 1, fontSize: '0.875rem' }}
                />
                <button type="submit" className="btn btn-secondary" style={{ padding: '0 1rem', flexShrink: 0 }}>
                  <Plus size={15} /> Add
                </button>
              </form>

              {selectedTopics.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', width: '100%', marginBottom: '0.35rem' }}>Selected ({selectedTopics.length})</span>
                  {selectedTopics.map(t => (
                    <span key={t} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      padding: '0.3rem 0.7rem', borderRadius: '2rem',
                      backgroundColor: 'var(--accent-color)', color: '#fff',
                      fontSize: '0.8rem', fontWeight: 500,
                    }}>
                      {t}
                      <button onClick={() => setSelectedTopics(p => p.filter(x => x !== t))}
                        style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, display: 'flex', opacity: 0.8 }}>
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {SUGGESTED_TOPICS.map(({ label, icon }) => {
                  if (selectedTopics.includes(label)) return null;
                  return (
                    <button key={label} onClick={() => toggleTopic(label)} style={{
                      padding: '0.42rem 0.85rem', borderRadius: '2rem',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-surface-2)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer', fontSize: '0.8rem',
                      transition: 'all 0.18s',
                      display: 'flex', alignItems: 'center', gap: '0.35rem',
                    }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent-color)'; e.currentTarget.style.color = 'var(--accent-color)'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span> {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 4: Reading Goal ── */}
          {step === 4 && (
            <div>
              <SectionHeader
                title="What is your primary reading objective?"
                subtitle="We'll prioritise the type of books that best serve your ambitions."
              />
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {READING_GOALS.map(g => {
                  const sel = readingGoal === g.id;
                  return (
                    <button key={g.id} onClick={() => setReadingGoal(g.id)} style={cardBtn(sel)}>
                      <CardLabel label={g.label} desc={g.desc} sel={sel} />
                      <div style={radioCircle(sel)}>{sel && <Check size={12} color="#fff" />}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 5: Knowledge Depth ── */}
          {step === 5 && (
            <div>
              <SectionHeader
                title="How would you describe your existing knowledge level?"
                subtitle="This ensures we recommend books at exactly the right complexity for you."
              />
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {SKILL_LEVELS.map(l => {
                  const sel = skillLevel === l.id;
                  return (
                    <button key={l.id} onClick={() => setSkillLevel(l.id)} style={cardBtn(sel)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1 }}>
                        <div style={{
                          padding: '0.4rem 0.7rem', borderRadius: 'var(--radius-sm)',
                          backgroundColor: sel ? 'rgba(99,102,241,0.15)' : 'var(--bg-surface)',
                          border: `1px solid ${sel ? 'var(--accent-color)' : 'var(--border-color)'}`,
                          fontSize: '0.72rem', fontWeight: 700,
                          color: sel ? 'var(--accent-color)' : 'var(--text-muted)',
                          minWidth: '78px', textAlign: 'center',
                          transition: 'all 0.18s', flexShrink: 0,
                        }}>
                          {l.label}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{l.desc}</div>
                      </div>
                      <div style={radioCircle(sel)}>{sel && <Check size={12} color="#fff" />}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 6: Format Preference ── */}
          {step === 6 && (
            <div>
              <SectionHeader
                title="What type of books do you prefer reading?"
                subtitle="Choose the format that suits your learning style and schedule."
              />
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {FORMATS.map(f => {
                  const sel = format === f.id;
                  return (
                    <button key={f.id} onClick={() => setFormat(f.id)} style={cardBtn(sel)}>
                      <CardLabel label={f.label} desc={f.desc} sel={sel} />
                      <div style={radioCircle(sel)}>{sel && <Check size={12} color="#fff" />}</div>
                    </button>
                  );
                })}
              </div>

              {/* Profile preview card — shown when all prev steps completed */}
              {background && industry && selectedTopics.length > 0 && readingGoal && skillLevel && (
                <div style={{
                  marginTop: '1.5rem', padding: '1rem 1.2rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.07) 100%)',
                  border: '1px solid rgba(99,102,241,0.22)',
                }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.65rem' }}>
                    ✦ Your Profile Preview
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {[
                      BACKGROUNDS.find(b => b.id === background)?.label,
                      INDUSTRIES.find(i => i.id === industry)?.label,
                      ...selectedTopics.slice(0, 3),
                      READING_GOALS.find(g => g.id === readingGoal)?.label,
                      SKILL_LEVELS.find(s => s.id === skillLevel)?.label,
                    ].filter(Boolean).map((tag, i) => (
                      <span key={i} style={{
                        padding: '0.22rem 0.62rem', borderRadius: '2rem',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 500,
                      }}>{tag}</span>
                    ))}
                    {selectedTopics.length > 3 && (
                      <span style={{
                        padding: '0.22rem 0.62rem', borderRadius: '2rem',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 500,
                      }}>+{selectedTopics.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '0.9rem 2rem',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-surface-2)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
        }}>
          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
              {step} / {STEPS.length}
            </div>
            <div style={{
              width: '72px', height: '4px', borderRadius: '2px',
              backgroundColor: 'var(--border-color)', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: '2px',
                backgroundColor: 'var(--accent-color)',
                width: `${(step / STEPS.length) * 100}%`,
                transition: 'width 0.35s ease',
              }} />
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {step > 1 && (
              <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <ChevronLeft size={15} /> Back
              </button>
            )}
            {step < STEPS.length ? (
              <button className="btn btn-primary" disabled={!canAdvance()} onClick={() => setStep(s => s + 1)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                Continue <ChevronRight size={15} />
              </button>
            ) : (
              <button className="btn btn-primary" disabled={!canAdvance() || isSubmitting} onClick={handleFinish}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {isSubmitting
                  ? <><Loader2 size={15} className="animate-spin" /> Building Library...</>
                  : <><Sparkles size={15} /> Build My Library</>
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
