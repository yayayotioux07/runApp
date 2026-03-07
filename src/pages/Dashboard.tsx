import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgress, WorkoutRecord } from '../hooks/useProgress'
import { GoalKey, goalMeta } from '../data/index'

// ─── Helpers ────────────────────────────────────────────────────────
function fmt(n: number, dec = 1) { return n.toFixed(dec) }
function fmtMins(m: number) {
  if (m < 60) return `${Math.round(m)}m`
  return `${Math.floor(m / 60)}h ${Math.round(m % 60)}m`
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function dayName(daysAgo: number) {
  const d = new Date(); d.setDate(d.getDate() - daysAgo)
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

const goalColors: Record<GoalKey, string> = {
  '5k': '#2ECC71', '10k': '#3498DB', '21k': '#9B59B6'
}
const sourceColors = { app: '#2ECC71', apple: '#FF6B6B' }

// ─── Apple Import Form ───────────────────────────────────────────────
function AppleImportPanel({ onAdd, onClose }: { onAdd: (r: Omit<WorkoutRecord, 'id' | 'source'>) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    goal: '10k' as GoalKey, week: '', day: '',
    date: new Date().toISOString().slice(0, 10),
    distanceKm: '', heartRateAvg: '', heartRateMax: '',
    calories: '', pace: '', totalMinutes: '',
    runMinutes: '', walkMinutes: '',
  })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = () => {
    if (!form.week || !form.day || !form.totalMinutes) return
    onAdd({
      goal: form.goal,
      week: parseInt(form.week),
      day: parseInt(form.day),
      date: new Date(form.date).toISOString(),
      totalSeconds: parseFloat(form.totalMinutes) * 60,
      totalMinutes: parseFloat(form.totalMinutes),
      runMinutes: parseFloat(form.runMinutes || form.totalMinutes),
      walkMinutes: parseFloat(form.walkMinutes || '0'),
      segments: 3,
      distanceKm: form.distanceKm ? parseFloat(form.distanceKm) : undefined,
      heartRateAvg: form.heartRateAvg ? parseInt(form.heartRateAvg) : undefined,
      heartRateMax: form.heartRateMax ? parseInt(form.heartRateMax) : undefined,
      calories: form.calories ? parseInt(form.calories) : undefined,
      pace: form.pace || undefined,
    })
    onClose()
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.panelHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🍎</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>Import Apple Activity</span>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>
        <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>
          Manually enter your Apple Health workout data to track it alongside your RunUp progress.
        </p>
        <div style={styles.formGrid}>
          <label style={styles.label}>Program
            <select value={form.goal} onChange={set('goal')} style={styles.input}>
              <option value="5k">5K</option>
              <option value="10k">10K</option>
              <option value="21k">Half Marathon</option>
            </select>
          </label>
          <label style={styles.label}>Date
            <input type="date" value={form.date} onChange={set('date')} style={styles.input} />
          </label>
          <label style={styles.label}>Week #
            <input type="number" placeholder="e.g. 6" value={form.week} onChange={set('week')} style={styles.input} min="1" max="20" />
          </label>
          <label style={styles.label}>Day #
            <input type="number" placeholder="1–3" value={form.day} onChange={set('day')} style={styles.input} min="1" max="3" />
          </label>
          <label style={styles.label}>Total Duration (min) *
            <input type="number" placeholder="e.g. 35" value={form.totalMinutes} onChange={set('totalMinutes')} style={styles.input} />
          </label>
          <label style={styles.label}>Run Time (min)
            <input type="number" placeholder="e.g. 25" value={form.runMinutes} onChange={set('runMinutes')} style={styles.input} />
          </label>
          <label style={styles.label}>Distance (km)
            <input type="number" placeholder="e.g. 4.2" value={form.distanceKm} onChange={set('distanceKm')} style={styles.input} step="0.1" />
          </label>
          <label style={styles.label}>Avg Heart Rate (bpm)
            <input type="number" placeholder="e.g. 148" value={form.heartRateAvg} onChange={set('heartRateAvg')} style={styles.input} />
          </label>
          <label style={styles.label}>Max Heart Rate (bpm)
            <input type="number" placeholder="e.g. 172" value={form.heartRateMax} onChange={set('heartRateMax')} style={styles.input} />
          </label>
          <label style={styles.label}>Calories
            <input type="number" placeholder="e.g. 320" value={form.calories} onChange={set('calories')} style={styles.input} />
          </label>
          <label style={styles.label}>Avg Pace (min/km)
            <input type="text" placeholder="e.g. 5:30" value={form.pace} onChange={set('pace')} style={styles.input} />
          </label>
          <label style={styles.label}>Walk Time (min)
            <input type="number" placeholder="e.g. 5" value={form.walkMinutes} onChange={set('walkMinutes')} style={styles.input} />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ ...styles.btn, background: '#222', flex: 1 }}>Cancel</button>
          <button onClick={submit} style={{ ...styles.btn, background: '#FF6B6B', flex: 2 }}>
            🍎 Add Workout
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, icon }: { label: string; value: string; sub?: string; accent: string; icon: string }) {
  return (
    <div style={{ ...styles.statCard, borderTop: `3px solid ${accent}` }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: accent, fontWeight: 600, marginTop: 3 }}>{sub}</div>}
      <div style={{ fontSize: 11, color: '#666', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    </div>
  )
}

// ─── Weekly Chart ────────────────────────────────────────────────────
function WeeklyChart({ data }: { data: WorkoutRecord[][] }) {
  const maxMins = Math.max(...data.map(d => d.reduce((a, w) => a + w.totalMinutes, 0)), 20)
  return (
    <div style={styles.chartWrap}>
      {data.map((day, i) => {
        const totalMins = day.reduce((a, w) => a + w.totalMinutes, 0)
        const heightPct = totalMins > 0 ? Math.max((totalMins / maxMins) * 100, 8) : 0
        const daysAgo = 6 - i
        const isToday = daysAgo === 0
        const hasApple = day.some(w => w.source === 'apple')
        const hasApp = day.some(w => w.source === 'app')
        return (
          <div key={i} style={styles.chartCol}>
            <div style={styles.chartBarWrap}>
              {totalMins > 0 && (
                <div style={{
                  ...styles.chartBar,
                  height: `${heightPct}%`,
                  background: hasApple && hasApp
                    ? 'linear-gradient(180deg, #FF6B6B, #2ECC71)'
                    : hasApple ? '#FF6B6B' : '#2ECC71',
                  boxShadow: `0 0 12px ${hasApple ? '#FF6B6B55' : '#2ECC7155'}`,
                }}>
                  <span style={styles.chartVal}>{Math.round(totalMins)}m</span>
                </div>
              )}
            </div>
            <div style={{ ...styles.chartDay, color: isToday ? '#2ECC71' : '#555' }}>
              {dayName(daysAgo)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Recent Workouts List ────────────────────────────────────────────
function RecentList({ workouts, onRemove }: { workouts: WorkoutRecord[]; onRemove: (id: string) => void }) {
  if (!workouts.length) return (
    <div style={{ color: '#444', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>
      No workouts yet. Complete a workout or import Apple Health data to get started.
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {workouts.map(w => {
        const color = goalColors[w.goal]
        return (
          <div key={w.id} style={styles.workoutRow}>
            <div style={{ ...styles.goalDot, background: color }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>
                  {goalMeta[w.goal].label} · W{w.week}/D{w.day}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: w.source === 'apple' ? '#FF6B6B' : '#2ECC71',
                  background: w.source === 'apple' ? '#FF6B6B18' : '#2ECC7118',
                  padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase'
                }}>
                  {w.source === 'apple' ? '🍎 Apple' : '▶ RunUp'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <span style={styles.metaChip}>⏱ {fmtMins(w.totalMinutes)}</span>
                {w.distanceKm && <span style={styles.metaChip}>📍 {fmt(w.distanceKm)}km</span>}
                {w.heartRateAvg && <span style={styles.metaChip}>❤️ {w.heartRateAvg}bpm</span>}
                {w.calories && <span style={styles.metaChip}>🔥 {w.calories}cal</span>}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#555' }}>{fmtDate(w.date)}</span>
              <button
                onClick={() => onRemove(w.id)}
                style={{ fontSize: 10, color: '#444', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
              >✕</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Training Zones (from heart rate data) ───────────────────────────
function TrainingZones({ workouts }: { workouts: WorkoutRecord[] }) {
  const withHR = workouts.filter(w => w.heartRateAvg)
  if (!withHR.length) return (
    <div style={{ color: '#444', fontSize: 13, padding: '16px 0' }}>
      No heart rate data. Import Apple Health workouts with HR data to see training zones.
    </div>
  )
  const zones = [
    { name: 'VO2 Max', range: '180–200 bpm', color: '#E74C3C', min: 180 },
    { name: 'Anaerobic', range: '160–180 bpm', color: '#E67E22', min: 160 },
    { name: 'Aerobic', range: '140–160 bpm', color: '#2ECC71', min: 140 },
    { name: 'Fat Burn', range: '120–140 bpm', color: '#3498DB', min: 120 },
    { name: 'Recovery', range: '< 120 bpm', color: '#9B59B6', min: 0 },
  ]
  const total = withHR.length
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {zones.map((z, i) => {
        const max = zones[i - 1]?.min ?? 999
        const count = withHR.filter(w => (w.heartRateAvg ?? 0) >= z.min && (w.heartRateAvg ?? 0) < max).length
        const pct = Math.round((count / total) * 100)
        return (
          <div key={z.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: z.color + '22', border: `1px solid ${z.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: z.color, fontWeight: 700 }}>{5 - i}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: '#ccc', fontWeight: 600 }}>{z.name}</span>
                <span style={{ fontSize: 11, color: '#555' }}>{z.range}</span>
              </div>
              <div style={{ height: 4, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: z.color, borderRadius: 2, transition: 'width 0.6s ease' }} />
              </div>
            </div>
            <span style={{ fontSize: 12, color: z.color, fontWeight: 700, width: 32, textAlign: 'right' }}>{pct}%</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Dashboard ──────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const { profileName, workouts, getTotalStats, getRecentWorkouts, getWeeklyWorkouts, removeWorkout, addAppleWorkout } = useProgress()
  const [showImport, setShowImport] = useState(false)
  const [tab, setTab] = useState<'recent' | 'zones'>('recent')

  const stats = useMemo(() => getTotalStats(), [workouts])
  const recent = useMemo(() => getRecentWorkouts(12), [workouts])
  const weekly = useMemo(() => getWeeklyWorkouts(), [workouts])

  const totalWorkoutsThisWeek = weekly.reduce((a, d) => a + d.length, 0)

  return (
    <div style={styles.page}>
      {/* Top nav */}
      <div style={styles.topNav}>
        <button onClick={() => navigate('/')} style={styles.backBtn}>← Home</button>
        <span style={styles.navTitle}>
          {profileName ? `${profileName}'s Dashboard` : 'Dashboard'}
        </span>
        <button onClick={() => setShowImport(true)} style={styles.importBtn}>
          🍎 Import Apple Health
        </button>
      </div>

      <div style={styles.content}>
        {/* ── Stat Cards ───────────────────── */}
        <div style={styles.statsRow}>
          <StatCard label="Total Workouts" value={String(stats.totalWorkouts)} sub={`${totalWorkoutsThisWeek} this week`} accent="#2ECC71" icon="🏃" />
          <StatCard label="Total Run Time" value={fmtMins(stats.totalRunMins)} accent="#3498DB" icon="⏱" />
          <StatCard label="Distance" value={`${fmt(stats.totalDistKm)}km`} accent="#9B59B6" icon="📍" />
          <StatCard label="Streak" value={`${stats.currentStreak}d`} sub="consecutive days" accent="#F39C12" icon="🔥" />
          {stats.avgHeartRate && <StatCard label="Avg Heart Rate" value={`${stats.avgHeartRate}`} sub="bpm" accent="#E74C3C" icon="❤️" />}
          {stats.totalCalories > 0 && <StatCard label="Calories Burned" value={String(Math.round(stats.totalCalories))} sub="kcal total" accent="#E67E22" icon="⚡" />}
        </div>

        {/* ── Main 2-col layout ─────────────── */}
        <div style={styles.mainGrid}>
          {/* Left column */}
          <div style={styles.leftCol}>
            {/* Weekly chart */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>Activity This Week</span>
                <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                  <span style={{ color: '#2ECC71' }}>● RunUp</span>
                  <span style={{ color: '#FF6B6B' }}>● Apple</span>
                </div>
              </div>
              <WeeklyChart data={weekly} />
            </div>

            {/* Recent workouts */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={{ display: 'flex', gap: 16 }}>
                  {(['recent', 'zones'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} style={{
                      ...styles.tabBtn,
                      color: tab === t ? '#fff' : '#555',
                      borderBottom: tab === t ? '2px solid #2ECC71' : '2px solid transparent',
                    }}>
                      {t === 'recent' ? 'Recent Workouts' : 'Heart Rate Zones'}
                    </button>
                  ))}
                </div>
                {tab === 'recent' && (
                  <button onClick={() => setShowImport(true)} style={{ ...styles.btn, fontSize: 11, padding: '5px 12px' }}>
                    + Add
                  </button>
                )}
              </div>
              <div style={{ marginTop: 16 }}>
                {tab === 'recent'
                  ? <RecentList workouts={recent} onRemove={removeWorkout} />
                  : <TrainingZones workouts={workouts} />
                }
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={styles.rightCol}>
            {/* Goal progress */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>My Goals</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
                {(['5k', '10k', '21k'] as GoalKey[]).map(goal => {
                  const meta = goalMeta[goal]
                  const done = workouts.filter(w => w.goal === goal).length
                  const total = meta.weeks * 3
                  const pct = Math.min((done / total) * 100, 100)
                  return (
                    <div key={goal} onClick={() => navigate(`/program/${goal}`)} style={{ cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{meta.label}</span>
                        <span style={{ fontSize: 12, color: '#555' }}>{done}/{total} workouts</span>
                      </div>
                      <div style={{ height: 8, background: '#1a1a1a', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background: `linear-gradient(90deg, ${meta.color}99, ${meta.color})`,
                          borderRadius: 4,
                          transition: 'width 0.6s ease',
                          boxShadow: pct > 0 ? `0 0 8px ${meta.color}66` : 'none',
                        }} />
                      </div>
                      <div style={{ fontSize: 11, color: meta.color, marginTop: 4, textAlign: 'right' }}>
                        {Math.round(pct)}% complete
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tips card */}
            <div style={{ ...styles.card, background: 'linear-gradient(135deg, #0f2027, #1a3a4a)', borderColor: '#3498DB33' }}>
              <div style={{ fontSize: 11, color: '#3498DB', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>
                Training Tip
              </div>
              <p style={{ fontSize: 14, color: '#ccc', lineHeight: 1.6, margin: 0 }}>
                {stats.currentStreak >= 7
                  ? '🔥 You\'re on a 7+ day streak! Remember recovery is part of training — rest days make you stronger.'
                  : stats.totalWorkouts === 0
                  ? '👟 Start your first workout today! Consistency beats intensity — even 20 minutes 3× a week transforms your fitness.'
                  : stats.totalWorkouts < 5
                  ? '💪 Great start! The first 2 weeks are the hardest. Your body is adapting — keep showing up.'
                  : '🏅 World-class athletes rest 80% of their training time. Aerobic base building at easy pace is the secret.'
                }
              </p>
            </div>

            {/* Apple import shortcut */}
            <div style={{ ...styles.card, cursor: 'pointer', border: '1px dashed #333' }} onClick={() => setShowImport(true)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 28 }}>🍎</div>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>Import Apple Health Data</div>
                  <div style={{ fontSize: 12, color: '#555', marginTop: 3 }}>
                    Add workouts from your Apple Watch or iPhone
                  </div>
                </div>
                <span style={{ marginLeft: 'auto', color: '#333', fontSize: 18 }}>→</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showImport && (
        <AppleImportPanel
          onAdd={addAppleWorkout}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  )
}

// ─── Styles ─────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0D0D0D',
    fontFamily: "'DM Sans', sans-serif",
    color: '#fff',
  },
  topNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderBottom: '1px solid #1a1a1a',
    background: '#0D0D0D',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  navTitle: {
    fontWeight: 800,
    fontSize: 16,
    color: '#fff',
    letterSpacing: '-0.3px',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#555',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  importBtn: {
    background: '#FF6B6B18',
    border: '1px solid #FF6B6B44',
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: 700,
    padding: '7px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  content: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '24px 24px 60px',
  },
  statsRow: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  statCard: {
    background: '#111',
    border: '1px solid #1f1f1f',
    borderRadius: 12,
    padding: '16px 20px',
    flex: '1 1 140px',
    minWidth: 120,
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 360px',
    gap: 20,
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    minWidth: 0,
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  card: {
    background: '#111',
    border: '1px solid #1f1f1f',
    borderRadius: 16,
    padding: '20px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontWeight: 700,
    fontSize: 15,
    color: '#fff',
  },
  // Chart
  chartWrap: {
    display: 'flex',
    gap: 8,
    height: 160,
    alignItems: 'flex-end',
    marginTop: 16,
  },
  chartCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
  },
  chartBarWrap: {
    flex: 1,
    width: '100%',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  chartBar: {
    width: '70%',
    borderRadius: '6px 6px 3px 3px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: 6,
    transition: 'height 0.6s ease',
  },
  chartVal: {
    fontSize: 10,
    fontWeight: 700,
    color: '#000',
  },
  chartDay: {
    fontSize: 11,
    marginTop: 6,
    fontWeight: 600,
  },
  // Workout row
  workoutRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '12px',
    background: '#0D0D0D',
    borderRadius: 10,
    border: '1px solid #1a1a1a',
  },
  goalDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
    marginTop: 5,
  },
  metaChip: {
    fontSize: 11,
    color: '#666',
  },
  // Tabs
  tabBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 14,
    fontWeight: 600,
    paddingBottom: 6,
  },
  // Import panel
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  panel: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 560,
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeBtn: {
    background: '#1a1a1a',
    border: 'none',
    color: '#666',
    width: 30,
    height: 30,
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: 14,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 14,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 12,
    color: '#777',
    fontWeight: 600,
  },
  input: {
    background: '#0D0D0D',
    border: '1px solid #2a2a2a',
    borderRadius: 8,
    color: '#fff',
    padding: '9px 12px',
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  btn: {
    background: '#2ECC71',
    border: 'none',
    borderRadius: 10,
    color: '#000',
    fontWeight: 700,
    fontSize: 14,
    padding: '10px 20px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
}