'use client';

import React, { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type View = 'builder' | 'clients' | 'programs' | 'calendar' | 'settings';

type Client = {
  id: string;
  name: string;
  goal: string;
  sessions: number;
  nextSession: string;
  status: 'active' | 'inactive';
  avatar: string;
};

type Exercise = {
  id: string;
  name: string;
  sets: string;
  reps: string;
  weight: string;
  rpe: string;
  tempo: string;
  notes: string;
};

type WorkoutDay = {
  id: string;
  name: string;
  exercises: Exercise[];
};

type Program = {
  id: string;
  name: string;
  clientId: string;
  weeks: number;
  days: WorkoutDay[];
  createdAt: string;
  notes: string;
};

// ─── Exercise Library ─────────────────────────────────────────────────────────

const EXERCISE_LIBRARY: Record<string, string[]> = {
  Chest: ['Bench Press', 'Incline Bench Press', 'Decline Bench Press', 'Dumbbell Fly', 'Cable Crossover', 'Push Up'],
  Back: ['Pull Up', 'Lat Pulldown', 'Barbell Row', 'Dumbbell Row', 'Cable Row', 'Deadlift', 'T-Bar Row'],
  Shoulders: ['Overhead Press', 'Arnold Press', 'Lateral Raise', 'Front Raise', 'Face Pull', 'Rear Delt Fly'],
  Legs: ['Squat', 'Front Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Extension', 'Leg Curl', 'Hip Thrust', 'Walking Lunges', 'Calf Raise'],
  Arms: ['Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Tricep Pushdown', 'Skull Crusher', 'Dips', 'Preacher Curl'],
  Core: ['Plank', 'Cable Crunch', 'Hanging Leg Raise', 'Ab Wheel', 'Russian Twist', 'Dead Bug'],
};

const DEMO_CLIENTS: Client[] = [
  { id: 'c1', name: 'Sarah Mitchell', goal: 'Fat loss + toning', sessions: 24, nextSession: 'Mon 9am', status: 'active', avatar: 'SM' },
  { id: 'c2', name: 'James Okafor', goal: 'Muscle gain', sessions: 12, nextSession: 'Tue 6pm', status: 'active', avatar: 'JO' },
  { id: 'c3', name: 'Priya Sharma', goal: 'General fitness', sessions: 8, nextSession: 'Wed 7am', status: 'active', avatar: 'PS' },
  { id: 'c4', name: 'Tom Bradley', goal: 'Powerlifting prep', sessions: 36, nextSession: 'Thu 5pm', status: 'active', avatar: 'TB' },
  { id: 'c5', name: 'Emma Walsh', goal: 'Post-natal rehab', sessions: 6, nextSession: '—', status: 'inactive', avatar: 'EW' },
];

const newExercise = (): Exercise => ({
  id: `ex-${Date.now()}-${Math.random()}`,
  name: '', sets: '3', reps: '10', weight: '', rpe: '', tempo: '', notes: '',
});

const newDay = (n: number): WorkoutDay => ({
  id: `day-${Date.now()}-${Math.random()}`,
  name: `Day ${n}`,
  exercises: [newExercise()],
});

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV_ICONS: Record<View, React.ReactNode> = {
  builder: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="14" height="11" rx="1.5"/><line x1="1" y1="6.5" x2="15" y2="6.5"/><line x1="5" y1="1" x2="5" y2="5"/><line x1="11" y1="1" x2="11" y2="5"/>
      <line x1="4" y1="10" x2="7" y2="10"/><line x1="4" y1="12.5" x2="9" y2="12.5"/>
    </svg>
  ),
  programs: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="1" width="10" height="14" rx="1.5"/><line x1="5.5" y1="5" x2="10.5" y2="5"/><line x1="5.5" y1="8" x2="10.5" y2="8"/><line x1="5.5" y1="11" x2="8.5" y2="11"/>
    </svg>
  ),
  clients: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="5" r="2.5"/><path d="M1 14c0-3 2-4.5 5-4.5s5 1.5 5 4.5"/><circle cx="12" cy="5" r="2"/><path d="M14.5 13.5c0-2-1.2-3.5-3-3.8"/>
    </svg>
  ),
  calendar: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="14" height="11" rx="1.5"/><line x1="1" y1="6.5" x2="15" y2="6.5"/><line x1="5" y1="1" x2="5" y2="5"/><line x1="11" y1="1" x2="11" y2="5"/>
      <rect x="4.5" y="9" width="2" height="2" rx="0.5"/>
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M2.9 2.9l1.1 1.1M12 12l1.1 1.1M2.9 13.1l1.1-1.1M12 4l1.1-1.1"/>
    </svg>
  ),
};

const NAV: { id: View; label: string }[] = [
  { id: 'builder',  label: 'Workout Builder' },
  { id: 'programs', label: 'Programs' },
  { id: 'clients',  label: 'Clients' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'settings', label: 'Settings' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PTDashboard() {
  const [view, setView] = useState<View>('builder');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Builder state
  const [program, setProgram] = useState<Program>({
    id: `prog-${Date.now()}`,
    name: '',
    clientId: '',
    weeks: 4,
    days: [newDay(1)],
    createdAt: new Date().toISOString(),
    notes: '',
  });
  const [activeDay, setActiveDay] = useState(0);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryTarget, setLibraryTarget] = useState<string | null>(null);
  const [expandedMuscle, setExpandedMuscle] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  const day = program.days[activeDay];

  const updateDay = (updated: WorkoutDay) => {
    setProgram(p => ({ ...p, days: p.days.map((d, i) => i === activeDay ? updated : d) }));
  };

  const updateExercise = (exId: string, field: keyof Exercise, value: string) => {
    updateDay({ ...day, exercises: day.exercises.map(e => e.id === exId ? { ...e, [field]: value } : e) });
  };

  const addExercise = () => updateDay({ ...day, exercises: [...day.exercises, newExercise()] });

  const removeExercise = (exId: string) => {
    if (day.exercises.length === 1) return;
    updateDay({ ...day, exercises: day.exercises.filter(e => e.id !== exId) });
  };

  const addDay = () => {
    const next = newDay(program.days.length + 1);
    setProgram(p => ({ ...p, days: [...p.days, next] }));
    setActiveDay(program.days.length);
  };

  const removeDay = (i: number) => {
    if (program.days.length === 1) return;
    setProgram(p => ({ ...p, days: p.days.filter((_, idx) => idx !== i) }));
    setActiveDay(Math.min(activeDay, program.days.length - 2));
  };

  const handleSaveProgram = () => {
    if (!program.name.trim()) return;
    const updated = [{ ...program, id: `prog-${Date.now()}` }, ...programs];
    setPrograms(updated);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const insertFromLibrary = (exName: string) => {
    if (libraryTarget) {
      updateDay({ ...day, exercises: day.exercises.map(e => e.id === libraryTarget ? { ...e, name: exName } : e) });
    } else {
      updateDay({ ...day, exercises: [...day.exercises, { ...newExercise(), name: exName }] });
    }
    setShowLibrary(false);
    setLibraryTarget(null);
  };

  return (
    <div className="flex h-screen bg-stone-100 overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className={`${sidebarOpen ? 'w-56' : 'w-16'} flex-shrink-0 bg-white border-r border-stone-200 flex flex-col transition-all duration-200`}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-stone-200">
          <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">A</div>
          {sidebarOpen && <span className="font-bold text-stone-900 text-sm">ApexFlow</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-0.5 px-2">
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                view === n.id
                  ? 'bg-green-50 text-green-700 font-semibold'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <span className="shrink-0">{NAV_ICONS[n.id]}</span>
              {sidebarOpen && <span>{n.label}</span>}
            </button>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarOpen(o => !o)}
          className="m-3 p-2 rounded-xl text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-all text-xs"
        >
          {sidebarOpen ? '← Collapse' : '→'}
        </button>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto">

        {/* ══ WORKOUT BUILDER ══ */}
        {view === 'builder' && (
          <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-stone-900">Workout Builder</h1>
                <p className="text-sm text-stone-600 mt-0.5">Build and assign training programs to clients</p>
              </div>
              <button
                onClick={handleSaveProgram}
                disabled={!program.name.trim()}
                className="px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {savedMsg ? '✓ Saved' : 'Save Program'}
              </button>
            </div>

            {/* Program meta */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="text-[10px] text-stone-500 uppercase tracking-widest font-medium mb-1.5 block">Program Name</label>
                  <input
                    value={program.name}
                    onChange={e => setProgram(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. 8 Week Strength Block"
                    className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-green-400 placeholder-stone-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-500 uppercase tracking-widest font-medium mb-1.5 block">Assign to Client</label>
                  <select
                    value={program.clientId}
                    onChange={e => setProgram(p => ({ ...p, clientId: e.target.value }))}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-green-400 bg-white"
                  >
                    <option value="">— No client —</option>
                    {DEMO_CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-stone-500 uppercase tracking-widest font-medium mb-1.5 block">Duration (weeks)</label>
                  <input
                    type="number"
                    value={program.weeks}
                    onChange={e => setProgram(p => ({ ...p, weeks: parseInt(e.target.value) || 1 }))}
                    min={1} max={52}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-green-400 [appearance:textfield]"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="text-[10px] text-stone-500 uppercase tracking-widest font-medium mb-1.5 block">Program Notes</label>
                <textarea
                  value={program.notes}
                  onChange={e => setProgram(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Goals, periodisation notes, client context..."
                  rows={2}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-green-400 placeholder-stone-400 resize-none"
                />
              </div>
            </div>

            {/* Day tabs */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
              {program.days.map((d, i) => (
                <div key={d.id} className="flex items-center shrink-0">
                  <button
                    onClick={() => setActiveDay(i)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      activeDay === i
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'bg-white border border-stone-200 text-stone-700 hover:border-green-400'
                    }`}
                  >
                    {d.name}
                  </button>
                  {program.days.length > 1 && (
                    <button
                      onClick={() => removeDay(i)}
                      className="ml-1 w-4 h-4 rounded-full text-stone-400 hover:text-red-500 text-xs flex items-center justify-center transition-colors"
                    >×</button>
                  )}
                </div>
              ))}
              <button
                onClick={addDay}
                className="shrink-0 px-3 py-2 rounded-xl text-sm text-stone-500 border border-dashed border-stone-300 hover:border-green-400 hover:text-green-600 transition-all"
              >+ Day</button>
            </div>

            {/* Day name */}
            <div className="flex items-center gap-3 mb-4">
              <input
                value={day.name}
                onChange={e => updateDay({ ...day, name: e.target.value })}
                placeholder="Day name (e.g. Push / Upper / Leg Day)"
                className="flex-1 border border-stone-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-900 focus:outline-none focus:border-green-400 placeholder-stone-400"
              />
              <button
                onClick={() => { setLibraryTarget(null); setShowLibrary(s => !s); }}
                className="px-4 py-2.5 bg-stone-100 border border-stone-200 text-stone-700 text-sm rounded-xl hover:bg-stone-200 transition-all"
              >
                {showLibrary ? 'Close Library' : 'Exercise Library'}
              </button>
            </div>

            {/* Exercise library panel */}
            {showLibrary && (
              <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-4">
                <p className="text-xs font-semibold text-stone-700 uppercase tracking-widest mb-3">Exercise Library</p>
                <div className="space-y-2">
                  {Object.entries(EXERCISE_LIBRARY).map(([muscle, exs]) => (
                    <div key={muscle}>
                      <button
                        onClick={() => setExpandedMuscle(expandedMuscle === muscle ? null : muscle)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-stone-50 hover:bg-stone-100 transition-all text-sm font-medium text-stone-700"
                      >
                        <span>{muscle}</span>
                        <span className="text-stone-400">{expandedMuscle === muscle ? '▲' : '▼'}</span>
                      </button>
                      {expandedMuscle === muscle && (
                        <div className="flex flex-wrap gap-1.5 mt-2 px-1">
                          {exs.map(ex => (
                            <button
                              key={ex}
                              onClick={() => insertFromLibrary(ex)}
                              className="text-xs px-3 py-1.5 bg-white border border-stone-200 text-stone-700 rounded-lg hover:border-green-400 hover:text-green-700 transition-all"
                            >
                              {ex}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exercise table */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-4">
              {/* Table header */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_2fr_2rem] gap-2 px-4 py-2.5 bg-stone-50 border-b border-stone-200 text-[10px] text-stone-500 uppercase tracking-widest font-medium">
                <span>Exercise</span>
                <span className="text-center">Sets</span>
                <span className="text-center">Reps</span>
                <span className="text-center">Weight</span>
                <span className="text-center">RPE</span>
                <span className="text-center">Tempo</span>
                <span>Notes</span>
                <span />
              </div>

              {/* Exercise rows */}
              <div className="divide-y divide-stone-100">
                {day.exercises.map((ex, ei) => (
                  <div key={ex.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_2fr_2rem] gap-2 px-4 py-3 items-center hover:bg-stone-50 transition-colors group">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-400 tabular-nums w-4 shrink-0">{ei + 1}</span>
                      <input
                        value={ex.name}
                        onChange={e => updateExercise(ex.id, 'name', e.target.value)}
                        placeholder="Exercise name"
                        className="flex-1 text-sm text-stone-900 font-medium focus:outline-none placeholder-stone-400 bg-transparent border-b border-transparent focus:border-green-400 pb-0.5 transition-colors"
                      />
                      <button
                        onClick={() => { setLibraryTarget(ex.id); setShowLibrary(true); }}
                        className="text-stone-400 hover:text-green-600 text-xs opacity-0 group-hover:opacity-100 transition-all shrink-0"
                        title="Pick from library"
                      >+</button>
                    </div>
                    {(['sets','reps','weight','rpe','tempo'] as (keyof Exercise)[]).map(field => (
                      <input
                        key={field}
                        value={ex[field]}
                        onChange={e => updateExercise(ex.id, field, e.target.value)}
                        placeholder={field === 'weight' ? 'kg' : field === 'rpe' ? '1–10' : field === 'tempo' ? '3-1-2' : '—'}
                        className="w-full text-sm text-stone-900 text-center focus:outline-none placeholder-stone-400 bg-transparent border-b border-transparent focus:border-green-400 pb-0.5 transition-colors [appearance:textfield]"
                        type={['sets','reps','weight','rpe'].includes(field) ? 'number' : 'text'}
                      />
                    ))}
                    <input
                      value={ex.notes}
                      onChange={e => updateExercise(ex.id, 'notes', e.target.value)}
                      placeholder="Notes..."
                      className="w-full text-sm text-stone-700 focus:outline-none placeholder-stone-400 bg-transparent border-b border-transparent focus:border-green-400 pb-0.5 transition-colors"
                    />
                    <button
                      onClick={() => removeExercise(ex.id)}
                      disabled={day.exercises.length === 1}
                      className="text-stone-300 hover:text-red-400 transition-colors disabled:opacity-0 text-sm"
                    >✕</button>
                  </div>
                ))}
              </div>

              {/* Add exercise */}
              <div className="px-4 py-3 border-t border-stone-100">
                <button
                  onClick={addExercise}
                  className="text-sm text-stone-500 hover:text-green-600 transition-colors"
                >
                  + Add exercise
                </button>
              </div>
            </div>

            {/* Day summary */}
            <p className="text-xs text-stone-500 text-right">
              {day.exercises.filter(e => e.name.trim()).length} exercise{day.exercises.filter(e => e.name.trim()).length !== 1 ? 's' : ''} · {day.exercises.reduce((sum, e) => sum + (parseInt(e.sets) || 0), 0)} total sets
            </p>
          </div>
        )}

        {/* ══ PROGRAMS ══ */}
        {view === 'programs' && (
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-stone-900">Programs</h1>
                <p className="text-sm text-stone-600 mt-0.5">All saved training programs</p>
              </div>
              <button onClick={() => setView('builder')} className="px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-500 transition-all shadow-sm">
                + New Program
              </button>
            </div>

            {programs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-16 text-center">
                <p className="text-stone-700 font-medium mb-1">No programs yet</p>
                <p className="text-stone-500 text-sm mb-5">Build your first program in the Workout Builder</p>
                <button onClick={() => setView('builder')} className="px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-500 transition-all">
                  Open Builder
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {programs.map(p => {
                  const client = DEMO_CLIENTS.find(c => c.id === p.clientId);
                  return (
                    <div key={p.id} className="bg-white rounded-2xl border border-stone-200 p-5 flex items-center justify-between hover:border-green-300 transition-all">
                      <div>
                        <h3 className="font-semibold text-stone-900">{p.name}</h3>
                        <p className="text-sm text-stone-500 mt-0.5">
                          {client ? client.name : 'Unassigned'} · {p.weeks} weeks · {p.days.length} days · {p.days.reduce((s, d) => s + d.exercises.filter(e => e.name.trim()).length, 0)} exercises
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setProgram(p); setActiveDay(0); setView('builder'); }} className="px-4 py-2 text-sm border border-stone-200 rounded-xl text-stone-700 hover:border-green-400 hover:text-green-700 transition-all">Edit</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ CLIENTS ══ */}
        {view === 'clients' && (
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-stone-900">Clients</h1>
                <p className="text-sm text-stone-600 mt-0.5">{DEMO_CLIENTS.filter(c => c.status === 'active').length} active clients</p>
              </div>
              <button className="px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-500 transition-all shadow-sm">+ Add Client</button>
            </div>

            <div className="space-y-3">
              {DEMO_CLIENTS.map(c => (
                <div key={c.id} className="bg-white rounded-2xl border border-stone-200 p-5 flex items-center gap-4 hover:border-green-300 transition-all">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 font-bold text-sm flex items-center justify-center shrink-0">{c.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-stone-900">{c.name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-sm text-stone-500 mt-0.5">{c.goal} · {c.sessions} sessions</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-stone-500">Next session</p>
                    <p className="text-sm font-medium text-stone-700">{c.nextSession}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setProgram(p => ({ ...p, clientId: c.id })); setView('builder'); }} className="px-3 py-1.5 text-xs border border-stone-200 rounded-lg text-stone-600 hover:border-green-400 hover:text-green-700 transition-all">Build Program</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ CALENDAR ══ */}
        {view === 'calendar' && (
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-stone-900">Calendar</h1>
                <p className="text-sm text-stone-600 mt-0.5">Schedule and manage sessions</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-16 text-center">
              <p className="text-stone-700 font-medium mb-1">Calendar coming soon</p>
              <p className="text-stone-500 text-sm">Session scheduling, reminders, and availability management</p>
            </div>
          </div>
        )}

        {/* ══ SETTINGS ══ */}
        {view === 'settings' && (
          <div className="max-w-2xl mx-auto px-6 py-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-stone-900">Settings</h1>
              <p className="text-sm text-stone-600 mt-0.5">Your profile and preferences</p>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
              {[
                { label: 'Full Name', placeholder: 'Jakob Pace', type: 'text' },
                { label: 'Email', placeholder: 'jakob@apexflow.com', type: 'email' },
                { label: 'Business Name', placeholder: 'Apex Performance', type: 'text' },
                { label: 'Default Weight Unit', placeholder: 'kg', type: 'text' },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-[10px] text-stone-500 uppercase tracking-widest font-medium mb-1.5 block">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-green-400 placeholder-stone-400" />
                </div>
              ))}
              <button className="w-full py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-500 transition-all mt-2">Save Changes</button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
