'use client';

import React, { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type View = 'builder' | 'clients' | 'programs' | 'calendar' | 'settings';

type Client = {
  id: string;
  name: string;
  goal: string;
  email: string;
  phone: string;
  sessionsPerWeek: number;
  totalSessions: number;
  nextSession: string;
  status: 'active' | 'inactive';
  notes: string;
  avatar: string;
};

type SetType = 'working' | 'warmup' | 'dropset' | 'failure';

type SetRow = {
  id: string;
  type: SetType;
  reps: string;
  weight: string;
  rpe: string;
};

type Exercise = {
  id: string;
  name: string;
  setRows: SetRow[];
  tempo: string;
  rest: string;
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

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_CLIENTS_KEY = 'apex_pt_clients';
const LS_PROGRAMS_KEY = 'apex_pt_programs';

const SET_TYPE_LABELS: Record<SetType, string> = {
  working: 'Working',
  warmup: 'Warm Up',
  dropset: 'Drop Set',
  failure: 'Failure',
};

const SET_TYPE_TITLES: Record<SetType, string> = {
  working: 'Working set',
  warmup: 'Warm-up set',
  dropset: 'Drop set',
  failure: 'Failure set',
};

const SET_TYPE_COLORS: Record<SetType, string> = {
  working:  'bg-stone-100 text-stone-600 hover:bg-stone-200',
  warmup:   'bg-blue-50 text-blue-600 hover:bg-blue-100',
  dropset:  'bg-purple-50 text-purple-600 hover:bg-purple-100',
  failure:  'bg-red-50 text-red-500 hover:bg-red-100',
};

const SET_TYPE_CYCLE: SetType[] = ['working', 'warmup', 'dropset', 'failure'];

const EXERCISE_LIBRARY: Record<string, string[]> = {
  Chest: ['Bench Press', 'Incline Bench Press', 'Decline Bench Press', 'Dumbbell Fly', 'Cable Crossover', 'Push Up'],
  Back: ['Pull Up', 'Lat Pulldown', 'Barbell Row', 'Dumbbell Row', 'Cable Row', 'Deadlift', 'T-Bar Row'],
  Shoulders: ['Overhead Press', 'Arnold Press', 'Lateral Raise', 'Front Raise', 'Face Pull', 'Rear Delt Fly'],
  Legs: ['Squat', 'Front Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Extension', 'Leg Curl', 'Hip Thrust', 'Walking Lunges', 'Calf Raise'],
  Arms: ['Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Tricep Pushdown', 'Skull Crusher', 'Dips', 'Preacher Curl'],
  Core: ['Plank', 'Cable Crunch', 'Hanging Leg Raise', 'Ab Wheel', 'Russian Twist', 'Dead Bug'],
};

function makeAvatar(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const DEMO_CLIENTS: Client[] = [
  { id: 'c1', name: 'Sarah Mitchell', goal: 'Fat loss + toning', email: 'sarah@example.com', phone: '', sessionsPerWeek: 3, totalSessions: 24, nextSession: 'Mon 9am', status: 'active', notes: '', avatar: 'SM' },
  { id: 'c2', name: 'James Okafor',   goal: 'Muscle gain',       email: 'james@example.com',  phone: '', sessionsPerWeek: 3, totalSessions: 12, nextSession: 'Tue 6pm', status: 'active', notes: '', avatar: 'JO' },
  { id: 'c3', name: 'Priya Sharma',   goal: 'General fitness',   email: 'priya@example.com',  phone: '', sessionsPerWeek: 2, totalSessions: 8,  nextSession: 'Wed 7am', status: 'active', notes: '', avatar: 'PS' },
  { id: 'c4', name: 'Tom Bradley',    goal: 'Powerlifting prep', email: 'tom@example.com',    phone: '', sessionsPerWeek: 4, totalSessions: 36, nextSession: 'Thu 5pm', status: 'active', notes: '', avatar: 'TB' },
  { id: 'c5', name: 'Emma Walsh',     goal: 'Post-natal rehab',  email: 'emma@example.com',   phone: '', sessionsPerWeek: 2, totalSessions: 6,  nextSession: '—',       status: 'inactive', notes: '', avatar: 'EW' },
];

function blankClient(): Omit<Client, 'id' | 'avatar'> {
  return { name: '', goal: '', email: '', phone: '', sessionsPerWeek: 2, totalSessions: 0, nextSession: '—', status: 'active', notes: '' };
}

const newSetRow = (type: SetType = 'working'): SetRow => ({
  id: `set-${Date.now()}-${Math.random()}`,
  type,
  reps: '',
  weight: '',
  rpe: '',
});

const newExercise = (): Exercise => ({
  id: `ex-${Date.now()}-${Math.random()}`,
  name: '',
  setRows: [newSetRow(), newSetRow(), newSetRow()],
  tempo: '',
  rest: '',
  notes: '',
});

const newDay = (n: number): WorkoutDay => ({
  id: `day-${Date.now()}-${Math.random()}`,
  name: `Day ${n}`,
  exercises: [newExercise()],
});

function blankProgram(): Program {
  return {
    id: `prog-${Date.now()}`,
    name: '',
    clientId: '',
    weeks: 4,
    days: [newDay(1)],
    createdAt: new Date().toISOString(),
    notes: '',
  };
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IconChevronLeft({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="10 4 6 8 10 12" />
    </svg>
  );
}

function IconChevronRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 4 10 8 6 12" />
    </svg>
  );
}

function IconCheck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 8 6.5 12 13 4" />
    </svg>
  );
}

function IconCopy({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="5" width="9" height="9" rx="1.5"/>
      <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-7A1.5 1.5 0 0 0 1 3.5v7A1.5 1.5 0 0 0 2.5 12H4"/>
    </svg>
  );
}

function IconTrash({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2 4 4 4 14 4"/><path d="M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><path d="M6 7v5M8 7v5M10 7v5"/><path d="M13 4l-.8 9.6A1.5 1.5 0 0 1 10.7 15H5.3a1.5 1.5 0 0 1-1.5-1.4L3 4"/>
    </svg>
  );
}

function IconEdit({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.5 2.5a2.12 2.12 0 0 1 3 3L5 15H1v-4L11.5 2.5z"/>
    </svg>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

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

// ─── Client Form Modal ────────────────────────────────────────────────────────

type ClientFormProps = {
  initial?: Client;
  onSave: (c: Client) => void;
  onCancel: () => void;
};

function ClientForm({ initial, onSave, onCancel }: ClientFormProps) {
  const [form, setForm] = useState<Omit<Client, 'id' | 'avatar'>>(
    initial
      ? { name: initial.name, goal: initial.goal, email: initial.email, phone: initial.phone, sessionsPerWeek: initial.sessionsPerWeek, totalSessions: initial.totalSessions, nextSession: initial.nextSession, status: initial.status, notes: initial.notes }
      : blankClient()
  );

  const set = (field: keyof typeof form, value: string | number) =>
    setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const id = initial?.id ?? `c-${Date.now()}`;
    const avatar = makeAvatar(form.name);
    onSave({ ...form, id, avatar });
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xl w-full max-w-lg">
        <div className="px-6 py-5 border-b border-stone-200">
          <h2 className="text-lg font-bold text-stone-900">{initial ? 'Edit Client' : 'Add Client'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[10px] text-stone-500 uppercase tracking-widest font-medium mb-1.5 block">Full Name *</label>
              <input
                required
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Sarah Mitchell"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-green-400 placeholder-stone-400"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-stone-500 uppercase tracking-widest font-medium mb-1.5 block">Goal</label>
              <input
                value={form.goal}
                onChange={e => set('goal', e.target.value)}
                placeholder="e.g. Fat loss + toning"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-green-400 placeholder-stone-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-500 uppercase tracking-widest font-medium mb-1.5 block">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="client@email.com"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-green-400 placeholder-stone-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-500 uppercase tracking-widest font-medium mb-1.5 block">Phone</label>
              <input
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="+61 400 000 000"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-green-400 placeholder-stone-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-500 uppercase tracking-widest font-medium mb-1.5 block">Sessions / Week</label>
              <input
                type="number"
                min={1}
                max={14}
                value={form.sessionsPerWeek}
                onChange={e => set('sessionsPerWeek', parseInt(e.target.value) || 1)}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-green-400 [appearance:textfield]"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-500 uppercase tracking-widest font-medium mb-1.5 block">Status</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-green-400 bg-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-stone-500 uppercase tracking-widest font-medium mb-1.5 block">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Injury history, preferences, context..."
                rows={2}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-green-400 placeholder-stone-400 resize-none"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 bg-white border border-stone-200 text-stone-900 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-500 transition-all"
            >
              {initial ? 'Save Changes' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PTDashboard() {
  const [view, setView] = useState<View>('builder');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ── Clients state ──
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoaded, setClientsLoaded] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Load clients from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_CLIENTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Client[];
        setClients(parsed.length > 0 ? parsed : DEMO_CLIENTS);
      } else {
        setClients(DEMO_CLIENTS);
      }
    } catch {
      setClients(DEMO_CLIENTS);
    }
    setClientsLoaded(true);
  }, []);

  // Persist clients to localStorage whenever they change
  useEffect(() => {
    if (!clientsLoaded) return;
    localStorage.setItem(LS_CLIENTS_KEY, JSON.stringify(clients));
  }, [clients, clientsLoaded]);

  const saveClient = useCallback((c: Client) => {
    setClients(prev => {
      const existing = prev.find(x => x.id === c.id);
      return existing ? prev.map(x => x.id === c.id ? c : x) : [c, ...prev];
    });
    setShowClientForm(false);
    setEditingClient(null);
  }, []);

  const deleteClient = useCallback((id: string) => {
    if (!window.confirm('Delete this client? This action cannot be undone.')) return;
    setClients(prev => prev.filter(c => c.id !== id));
  }, []);

  // ── Programs state ──
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programsLoaded, setProgramsLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_PROGRAMS_KEY);
      if (raw) setPrograms(JSON.parse(raw) as Program[]);
    } catch { /* ignore */ }
    setProgramsLoaded(true);
  }, []);

  useEffect(() => {
    if (!programsLoaded) return;
    localStorage.setItem(LS_PROGRAMS_KEY, JSON.stringify(programs));
  }, [programs, programsLoaded]);

  // ── Builder state ──
  const [program, setProgram] = useState<Program>(blankProgram());
  const [activeDay, setActiveDay] = useState(0);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryTarget, setLibraryTarget] = useState<string | null>(null);
  const [expandedMuscle, setExpandedMuscle] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');

  const day = program.days[activeDay] ?? program.days[0];

  const updateDay = (updated: WorkoutDay) => {
    setProgram(p => ({ ...p, days: p.days.map((d, i) => i === activeDay ? updated : d) }));
  };

  const updateExercise = (exId: string, field: 'name' | 'tempo' | 'rest' | 'notes', value: string) => {
    updateDay({ ...day, exercises: day.exercises.map(e => e.id === exId ? { ...e, [field]: value } : e) });
  };

  const updateSetRow = (exId: string, setId: string, field: 'reps' | 'weight' | 'rpe', value: string) => {
    updateDay({
      ...day,
      exercises: day.exercises.map(e =>
        e.id === exId
          ? { ...e, setRows: e.setRows.map(s => s.id === setId ? { ...s, [field]: value } : s) }
          : e
      ),
    });
  };

  const cycleSetType = (exId: string, setId: string) => {
    updateDay({
      ...day,
      exercises: day.exercises.map(e =>
        e.id === exId
          ? {
              ...e,
              setRows: e.setRows.map(s => {
                if (s.id !== setId) return s;
                const next = SET_TYPE_CYCLE[(SET_TYPE_CYCLE.indexOf(s.type) + 1) % SET_TYPE_CYCLE.length];
                return { ...s, type: next };
              }),
            }
          : e
      ),
    });
  };

  const addSetRow = (exId: string) => {
    updateDay({
      ...day,
      exercises: day.exercises.map(e =>
        e.id === exId ? { ...e, setRows: [...e.setRows, newSetRow()] } : e
      ),
    });
  };

  const removeSetRow = (exId: string, setId: string) => {
    updateDay({
      ...day,
      exercises: day.exercises.map(e =>
        e.id === exId && e.setRows.length > 1
          ? { ...e, setRows: e.setRows.filter(s => s.id !== setId) }
          : e
      ),
    });
  };

  const addExercise = () => updateDay({ ...day, exercises: [...day.exercises, newExercise()] });

  const removeExercise = (exId: string) => {
    if (day.exercises.length === 1) return;
    updateDay({ ...day, exercises: day.exercises.filter(e => e.id !== exId) });
  };

  const clearDay = () => {
    updateDay({ ...day, exercises: [newExercise()] });
  };

  const addDay = () => {
    const next = newDay(program.days.length + 1);
    setProgram(p => ({ ...p, days: [...p.days, next] }));
    setActiveDay(program.days.length);
  };

  const duplicateDay = (i: number) => {
    const source = program.days[i];
    const copy: WorkoutDay = {
      id: `day-${Date.now()}-${Math.random()}`,
      name: `${source.name} (copy)`,
      exercises: source.exercises.map(e => ({ ...e, id: `ex-${Date.now()}-${Math.random()}` })),
    };
    setProgram(p => {
      const days = [...p.days];
      days.splice(i + 1, 0, copy);
      return { ...p, days };
    });
    setActiveDay(i + 1);
  };

  const removeDay = (i: number) => {
    if (program.days.length === 1) return;
    setProgram(p => ({ ...p, days: p.days.filter((_, idx) => idx !== i) }));
    setActiveDay(Math.min(activeDay, program.days.length - 2));
  };

  const handleSaveProgram = () => {
    if (!program.name.trim()) return;
    const saved = { ...program, id: `prog-${Date.now()}` };
    setPrograms(prev => [saved, ...prev]);
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 2000);
  };

  const startNewProgram = () => {
    setProgram(blankProgram());
    setActiveDay(0);
    setSaveState('idle');
    setShowLibrary(false);
  };

  const insertFromLibrary = (exName: string) => {
    if (libraryTarget) {
      updateDay({ ...day, exercises: day.exercises.map(e => e.id === libraryTarget ? { ...e, name: exName } : e) });
    } else {
      updateDay({ ...day, exercises: [...day.exercises, { ...newExercise(), name: exName }] });
    }
    setShowLibrary(false);
    setLibraryTarget(null);
    setExpandedMuscle(null);
  };

  const duplicateProgram = (prog: Program) => {
    const copy: Program = {
      ...prog,
      id: `prog-${Date.now()}`,
      name: `${prog.name} (copy)`,
      createdAt: new Date().toISOString(),
      days: prog.days.map(d => ({
        ...d,
        id: `day-${Date.now()}-${Math.random()}`,
        exercises: d.exercises.map(e => ({ ...e, id: `ex-${Date.now()}-${Math.random()}` })),
      })),
    };
    setPrograms(prev => [copy, ...prev]);
  };

  const deleteProgram = (id: string) => {
    if (!window.confirm('Delete this program? This action cannot be undone.')) return;
    setPrograms(prev => prev.filter(p => p.id !== id));
  };

  const openBuilderWithClient = (clientId: string) => {
    setProgram(p => ({ ...p, clientId }));
    setSaveState('idle');
    setView('builder');
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-stone-100 overflow-hidden">

      {/* ── Client form modal ── */}
      {(showClientForm || editingClient) && (
        <ClientForm
          initial={editingClient ?? undefined}
          onSave={saveClient}
          onCancel={() => { setShowClientForm(false); setEditingClient(null); }}
        />
      )}


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
          className="m-3 p-2 rounded-xl text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-all flex items-center justify-center"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <IconChevronLeft /> : <IconChevronRight />}
        </button>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto">

        {/* ══ WORKOUT BUILDER ══ */}
        {view === 'builder' && (
          <div className="max-w-5xl mx-auto px-6 py-8">

            {/* ── Save success state ── */}
            {saveState === 'saved' ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-16 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 text-green-600">
                  <IconCheck size={24} />
                </div>
                <h2 className="text-xl font-bold text-stone-900 mb-1">Program saved</h2>
                <p className="text-stone-500 text-sm mb-8">&ldquo;{program.name}&rdquo; has been added to your library</p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={startNewProgram}
                    className="px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-500 transition-all shadow-sm"
                  >
                    Build another
                  </button>
                  <button
                    onClick={() => setView('programs')}
                    className="px-5 py-2.5 bg-white border border-stone-200 text-stone-900 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-all"
                  >
                    View Programs
                  </button>
                </div>
              </div>
            ) : (
              <>
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
                    Save Program
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
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                    <div key={d.id} className="flex items-center shrink-0 gap-0.5">
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
                      {/* Duplicate day */}
                      <button
                        onClick={() => duplicateDay(i)}
                        className="ml-0.5 w-6 h-6 rounded-lg text-stone-400 hover:text-green-600 hover:bg-green-50 flex items-center justify-center transition-colors"
                        title="Duplicate day"
                      >
                        <IconCopy size={12} />
                      </button>
                      {program.days.length > 1 && (
                        <button
                          onClick={() => removeDay(i)}
                          className="w-5 h-5 rounded-full text-stone-400 hover:text-red-500 text-xs flex items-center justify-center transition-colors"
                          title="Remove day"
                        >×</button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addDay}
                    className="shrink-0 px-3 py-2 rounded-xl text-sm text-stone-500 border border-dashed border-stone-300 hover:border-green-400 hover:text-green-600 transition-all"
                  >+ Day</button>
                </div>

                {/* Day name + actions */}
                <div className="flex items-center gap-3 mb-4">
                  <input
                    value={day.name}
                    onChange={e => updateDay({ ...day, name: e.target.value })}
                    placeholder="Day name (e.g. Push / Upper / Leg Day)"
                    className="flex-1 border border-stone-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-900 focus:outline-none focus:border-green-400 placeholder-stone-400"
                  />
                  <button
                    onClick={clearDay}
                    className="px-4 py-2.5 bg-white border border-stone-200 text-stone-700 text-sm rounded-xl hover:bg-stone-50 hover:border-stone-300 transition-all"
                  >
                    Clear day
                  </button>
                  <button
                    onClick={() => { setLibraryTarget(null); setShowLibrary(s => !s); }}
                    className="px-4 py-2.5 bg-white border border-stone-200 text-stone-700 text-sm rounded-xl hover:bg-stone-100 transition-all"
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
                  <div className="grid grid-cols-[1.75rem_1fr_6rem_6rem_1fr_1.5rem] gap-3 px-4 py-2.5 bg-stone-50 border-b border-stone-200 text-[10px] text-stone-500 uppercase tracking-widest font-medium">
                    <span>#</span>
                    <span>Exercise</span>
                    <span>Tempo</span>
                    <span>Rest</span>
                    <span>Notes</span>
                    <span />
                  </div>

                  {/* Exercise rows */}
                  <div className="divide-y divide-stone-100">
                    {day.exercises.map((ex, ei) => (
                      <div key={ex.id} className="group">
                        {/* Exercise header */}
                        <div className="grid grid-cols-[1.75rem_1fr_6rem_6rem_1fr_1.5rem] gap-3 px-4 pt-3 pb-2 items-start">
                          <span className="w-5 h-5 rounded bg-stone-100 text-stone-500 text-[11px] font-semibold flex items-center justify-center mt-0.5 shrink-0">
                            {ei + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              value={ex.name}
                              onChange={e => updateExercise(ex.id, 'name', e.target.value)}
                              placeholder="Exercise name"
                              className="flex-1 text-sm text-stone-900 font-semibold focus:outline-none placeholder-stone-400 bg-transparent border-b border-transparent focus:border-green-400 pb-0.5 transition-colors"
                            />
                            <button
                              onClick={() => { setLibraryTarget(ex.id); setShowLibrary(true); }}
                              className="text-stone-400 hover:text-green-600 text-xs opacity-0 group-hover:opacity-100 transition-all shrink-0"
                              title="Pick from library"
                            >lib</button>
                          </div>
                          <input
                            value={ex.tempo}
                            onChange={e => updateExercise(ex.id, 'tempo', e.target.value)}
                            placeholder="3-1-2"
                            className="w-full text-sm text-stone-900 focus:outline-none placeholder-stone-400 bg-transparent border-b border-transparent focus:border-green-400 pb-0.5 transition-colors"
                          />
                          <input
                            value={ex.rest}
                            onChange={e => updateExercise(ex.id, 'rest', e.target.value)}
                            placeholder="90s"
                            className="w-full text-sm text-stone-900 focus:outline-none placeholder-stone-400 bg-transparent border-b border-transparent focus:border-green-400 pb-0.5 transition-colors"
                          />
                          <input
                            value={ex.notes}
                            onChange={e => updateExercise(ex.id, 'notes', e.target.value)}
                            placeholder="Notes..."
                            className="w-full text-sm text-stone-700 focus:outline-none placeholder-stone-400 bg-transparent border-b border-transparent focus:border-green-400 pb-0.5 transition-colors"
                          />
                          <button
                            onClick={() => removeExercise(ex.id)}
                            disabled={day.exercises.length === 1}
                            className="text-stone-300 hover:text-red-400 transition-colors disabled:opacity-0 mt-0.5"
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/>
                            </svg>
                          </button>
                        </div>

                        {/* Set rows */}
                        <div className="pl-11 pr-4 pb-3">
                          {/* Set sub-header */}
                          <div className="grid grid-cols-[6rem_4rem_4.5rem_3.5rem_1.5rem] gap-2 mb-1.5">
                            <span className="text-[9px] text-stone-400 uppercase tracking-widest">Type</span>
                            <span className="text-[9px] text-stone-400 uppercase tracking-widest text-center">Reps</span>
                            <span className="text-[9px] text-stone-400 uppercase tracking-widest text-center">Weight</span>
                            <span className="text-[9px] text-stone-400 uppercase tracking-widest text-center">RPE</span>
                            <span />
                          </div>
                          {ex.setRows.map((set) => (
                            <div key={set.id} className="grid grid-cols-[6rem_4rem_4.5rem_3.5rem_1.5rem] gap-2 mb-1.5 items-center group/set">
                              <button
                                onClick={() => cycleSetType(ex.id, set.id)}
                                title={SET_TYPE_TITLES[set.type]}
                                className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all text-left ${SET_TYPE_COLORS[set.type]}`}
                              >
                                {SET_TYPE_LABELS[set.type]}
                              </button>
                              <input
                                value={set.reps}
                                onChange={e => updateSetRow(ex.id, set.id, 'reps', e.target.value)}
                                placeholder="—"
                                type="number"
                                className="w-full text-sm text-stone-900 text-center focus:outline-none placeholder-stone-400 bg-transparent border-b border-transparent focus:border-green-400 pb-0.5 transition-colors [appearance:textfield]"
                              />
                              <input
                                value={set.weight}
                                onChange={e => updateSetRow(ex.id, set.id, 'weight', e.target.value)}
                                placeholder="kg"
                                type="number"
                                className="w-full text-sm text-stone-900 text-center focus:outline-none placeholder-stone-400 bg-transparent border-b border-transparent focus:border-green-400 pb-0.5 transition-colors [appearance:textfield]"
                              />
                              <input
                                value={set.rpe}
                                onChange={e => updateSetRow(ex.id, set.id, 'rpe', e.target.value)}
                                placeholder="—"
                                type="number"
                                min="1" max="10"
                                className="w-full text-sm text-stone-900 text-center focus:outline-none placeholder-stone-400 bg-transparent border-b border-transparent focus:border-green-400 pb-0.5 transition-colors [appearance:textfield]"
                              />
                              <button
                                onClick={() => removeSetRow(ex.id, set.id)}
                                disabled={ex.setRows.length === 1}
                                className="text-stone-300 hover:text-red-400 transition-colors disabled:opacity-0 opacity-0 group-hover/set:opacity-100 flex items-center justify-center"
                              >
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                  <line x1="2" y1="6" x2="10" y2="6"/>
                                </svg>
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => addSetRow(ex.id)}
                            className="text-xs text-stone-400 hover:text-green-600 transition-colors mt-0.5"
                          >
                            + set
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add exercise */}
                  <div className="px-4 py-3 border-t border-stone-100">
                    <button onClick={addExercise} className="text-sm text-stone-500 hover:text-green-600 transition-colors">
                      + Add exercise
                    </button>
                  </div>
                </div>

                {/* Day summary */}
                <p className="text-xs text-stone-500 text-right">
                  {day.exercises.filter(e => e.name.trim()).length} exercise{day.exercises.filter(e => e.name.trim()).length !== 1 ? 's' : ''} · {day.exercises.reduce((sum, e) => sum + e.setRows.length, 0)} total sets
                </p>
              </>
            )}
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
              <button
                onClick={() => { startNewProgram(); setView('builder'); }}
                className="px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-500 transition-all shadow-sm"
              >
                + New Program
              </button>
            </div>

            {programs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-16 text-center">
                <p className="text-stone-700 font-medium mb-1">No programs yet</p>
                <p className="text-stone-500 text-sm mb-5">Build your first program in the Workout Builder</p>
                <button
                  onClick={() => { startNewProgram(); setView('builder'); }}
                  className="px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-500 transition-all"
                >
                  Open Builder
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {programs.map(prog => {
                  const client = clients.find(c => c.id === prog.clientId);
                  const totalExercises = prog.days.reduce((s, d) => s + d.exercises.filter(e => e.name.trim()).length, 0);
                  const totalSets = prog.days.reduce((s, d) => s + d.exercises.reduce((ss, e) => ss + e.setRows.length, 0), 0);
                  return (
                    <div key={prog.id} className="bg-white rounded-2xl border border-stone-200 p-5 hover:border-green-300 transition-all">
                      <div className="flex items-start gap-4">
                        {/* Client avatar */}
                        <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 font-bold text-sm flex items-center justify-center shrink-0">
                          {client ? client.avatar : '—'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-semibold text-stone-900">{prog.name}</h3>
                              <p className="text-sm text-stone-500 mt-0.5">{client ? client.name : 'Unassigned'}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => duplicateProgram(prog)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-stone-200 rounded-lg text-stone-600 bg-white hover:border-green-400 hover:text-green-700 transition-all"
                                title="Duplicate program"
                              >
                                <IconCopy size={12} />
                                Duplicate
                              </button>
                              <button
                                onClick={() => { setProgram(prog); setActiveDay(0); setSaveState('idle'); setView('builder'); }}
                                className="px-3 py-1.5 text-xs border border-stone-200 rounded-lg text-stone-600 bg-white hover:border-green-400 hover:text-green-700 transition-all"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteProgram(prog.id)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-stone-200 rounded-lg text-stone-600 bg-white hover:border-red-300 hover:text-red-600 transition-all"
                                title="Delete program"
                              >
                                <IconTrash size={12} />
                              </button>
                            </div>
                          </div>
                          {/* Stats row */}
                          <div className="flex items-center gap-4 mt-3">
                            <span className="text-xs text-stone-500 bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-lg">{prog.weeks} weeks</span>
                            <span className="text-xs text-stone-500 bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-lg">{prog.days.length} day{prog.days.length !== 1 ? 's' : ''}</span>
                            <span className="text-xs text-stone-500 bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-lg">{totalExercises} exercise{totalExercises !== 1 ? 's' : ''}</span>
                            <span className="text-xs text-stone-500 bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-lg">{totalSets} sets</span>
                          </div>
                        </div>
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
                <p className="text-sm text-stone-600 mt-0.5">{clients.filter(c => c.status === 'active').length} active client{clients.filter(c => c.status === 'active').length !== 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={() => setShowClientForm(true)}
                className="px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-500 transition-all shadow-sm"
              >
                + Add Client
              </button>
            </div>

            {clients.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-16 text-center">
                <p className="text-stone-700 font-medium mb-1">No clients yet</p>
                <p className="text-stone-500 text-sm mb-5">Add your first client to get started</p>
                <button
                  onClick={() => setShowClientForm(true)}
                  className="px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-500 transition-all"
                >
                  Add Client
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {clients.map(c => (
                  <div key={c.id} className="bg-white rounded-2xl border border-stone-200 p-5 flex items-center gap-4 hover:border-green-300 transition-all">
                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 font-bold text-sm flex items-center justify-center shrink-0">{c.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-stone-900">{c.name}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                          {c.status}
                        </span>
                      </div>
                      <p className="text-sm text-stone-500 mt-0.5">{c.goal || '—'} · {c.totalSessions} sessions · {c.sessionsPerWeek}x/week</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-stone-500">Next session</p>
                      <p className="text-sm font-medium text-stone-700">{c.nextSession || '—'}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => openBuilderWithClient(c.id)}
                        className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-500 transition-all font-medium"
                      >
                        Build Program
                      </button>
                      <button
                        onClick={() => setEditingClient(c)}
                        className="p-1.5 text-stone-400 border border-stone-200 rounded-lg hover:border-green-400 hover:text-green-600 bg-white transition-all"
                        title="Edit client"
                      >
                        <IconEdit size={14} />
                      </button>
                      <button
                        onClick={() => deleteClient(c.id)}
                        className="p-1.5 text-stone-400 border border-stone-200 rounded-lg hover:border-red-300 hover:text-red-500 bg-white transition-all"
                        title="Delete client"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
