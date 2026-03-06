import { useNavigate, useParams } from 'react-router-dom'
import { GoalKey, goalMeta, programs } from '../data/index'
import { useProgress } from '../hooks/useProgress'

const segmentColors: Record<string, string> = {
  warmup:   '#C0392B',
  run:      '#27AE60',
  walk:     '#D4AC0D',
  cooldown: '#2471A3',
}

const segmentDim: Record<string, string> = {
  warmup:   '#7B241C',
  run:      '#1D6A3A',
  walk:     '#7D6608',
  cooldown: '#154360',
}

function formatMins(secs: number): string {
  const m = Math.round(secs / 60)
  return `${m}m`
}

function mergeSegments(segments: { type: string; duration: number; label: string }[]) {
  const merged: { type: string; duration: number; label: string }[] = []
  for (const seg of segments) {
    const last = merged[merged.length - 1]
    if (last && last.type === seg.type) last.duration += seg.duration
    else merged.push({ ...seg })
  }
  return merged
}

export default function WorkoutPreview() {
  const { goal, week, day } = useParams<{ goal: GoalKey; week: string; day: string }>()
  const navigate = useNavigate()
  const { isComplete } = useProgress()

  const key = goal as GoalKey
  const weekNum = parseInt(week ?? '1')
  const dayNum  = parseInt(day  ?? '1')
  const meta    = goalMeta[key]
  const program = programs[key]
  const weekData = program?.find(w => w.week === weekNum)
  const dayData  = weekData?.days.find(d => d.day === dayNum)

  if (!meta || !dayData) { navigate('/'); return null }

  const merged    = mergeSegments(dayData.segments)
  const totalSecs = dayData.segments.reduce((a, s) => a + s.duration, 0)
  const totalMins = Math.round(totalSecs / 60)
  const runMins   = Math.round(dayData.segments.filter(s => s.type === 'run').reduce((a, s) => a + s.duration, 0) / 60)
  const intervals = dayData.segments.filter(s => s.type === 'run').length
  const done      = isComplete(key, weekNum, dayNum)

  // Build day nav: show surrounding days
  const allDays: { week: number; day: number }[] = []
  program.forEach(w => w.days.forEach(d => allDays.push({ week: w.week, day: d.day })))
  const currentIdx = allDays.findIndex(d => d.week === weekNum && d.day === dayNum)
  const navDays = allDays.slice(Math.max(0, currentIdx - 2), currentIdx + 5)

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(`/program/${key}`)}>← Back</button>
        <span style={styles.headerTitle}>
          <span style={{ color: meta.color }}>Week {weekNum}</span>
          <span style={styles.headerSep}> · </span>
          Day {dayNum} / {totalMins} Min
        </span>
        <div style={{ width: 60 }} />
      </div>

      {/* Segment bar */}
      <div style={styles.segBar}>
        {merged.map((seg, i) => {
          const pct = (seg.duration / totalSecs) * 100
          const color = segmentColors[seg.type] ?? '#555'
          const dim   = segmentDim[seg.type]   ?? '#333'
          return (
            <div key={i} style={{ ...styles.segCell, width: `${pct}%`, background: color, borderRight: i < merged.length - 1 ? '1px solid rgba(0,0,0,0.3)' : 'none' }}>
              <span style={styles.segDuration}>{formatMins(seg.duration)}</span>
              <span style={styles.segLabel}>{seg.label}</span>
            </div>
          )
        })}
      </div>

      {/* Color strip */}
      <div style={styles.colorStrip}>
        {merged.map((seg, i) => {
          const pct = (seg.duration / totalSecs) * 100
          const dim = segmentDim[seg.type] ?? '#333'
          return <div key={i} style={{ width: `${pct}%`, background: dim, height: '100%' }} />
        })}
      </div>

      {/* Main content area */}
      <div style={styles.body}>
        {/* Big workout label */}
        <div style={styles.workoutLabel}>
          <span style={styles.weekTag}>WEEK {weekNum} — DAY {dayNum}</span>
          <div style={styles.totalTime}>{totalMins}<span style={styles.totalTimeUnit}> min</span></div>
          {done && <div style={styles.doneBadge}>✓ Completed</div>}
        </div>

        {/* Stats row */}
        <div style={styles.statsCard}>
          <div style={styles.statItem}>
            <span style={styles.statVal}>{totalMins}</span>
            <span style={styles.statLbl}>Total min</span>
          </div>
          <div style={styles.statDiv} />
          <div style={styles.statItem}>
            <span style={styles.statVal}>{runMins}</span>
            <span style={styles.statLbl}>Running min</span>
          </div>
          <div style={styles.statDiv} />
          <div style={styles.statItem}>
            <span style={styles.statVal}>{intervals}</span>
            <span style={styles.statLbl}>Intervals</span>
          </div>
        </div>

        {/* Segment breakdown */}
        <div style={styles.breakdown}>
          {merged.map((seg, i) => {
            const color = segmentColors[seg.type] ?? '#555'
            return (
              <div key={i} style={styles.breakdownRow}>
                <div style={{ ...styles.breakdownDot, background: color }} />
                <span style={styles.breakdownLabel}>{seg.label}</span>
                <span style={styles.breakdownTime}>{formatMins(seg.duration)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* LET'S GO button */}
      <div style={styles.footer}>
        <button
          style={{ ...styles.goBtn, background: meta.color }}
          onClick={() => navigate(`/active/${key}/${weekNum}/${dayNum}`)}
        >
          {done ? 'RUN AGAIN' : "LET'S GO"}
        </button>
      </div>

      {/* Day navigator */}
      <div style={styles.dayNav}>
        {navDays.map((d) => {
          const isCurrent = d.week === weekNum && d.day === dayNum
          const isDone    = isComplete(key, d.week, d.day)
          return (
            <button
              key={`${d.week}-${d.day}`}
              style={{
                ...styles.dayBtn,
                borderColor: isCurrent ? meta.color : 'rgba(255,255,255,0.1)',
                background:  isCurrent ? meta.color + '22' : 'transparent',
              }}
              onClick={() => navigate(`/workout/${key}/${d.week}/${d.day}`)}
            >
              <span style={{ ...styles.dayBtnDot, opacity: isDone ? 1 : 0, background: meta.color }} />
              <span style={{ ...styles.dayBtnText, color: isCurrent ? meta.color : 'rgba(255,255,255,0.5)' }}>
                W{d.week}/D{d.day}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh',
    background: '#0D0D0D',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'DM Sans', sans-serif",
    color: '#fff',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    background: '#111',
    borderBottom: '1px solid #1e1e1e',
  },
  backBtn: {
    background: 'transparent',
    color: 'rgba(255,255,255,0.45)',
    fontSize: '14px',
    width: 60,
    textAlign: 'left',
  },
  headerTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
    letterSpacing: '0.3px',
  },
  headerSep: { color: 'rgba(255,255,255,0.25)' },
  segBar: {
    display: 'flex',
    height: '70px',
    width: '100%',
  },
  segCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
    overflow: 'hidden',
  },
  segDuration: {
    fontSize: '17px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    color: '#fff',
    lineHeight: 1,
  },
  segLabel: {
    fontSize: '9px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: 'rgba(255,255,255,0.75)',
  },
  colorStrip: {
    height: '4px',
    display: 'flex',
    width: '100%',
  },
  body: {
    flex: 1,
    padding: '28px 20px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  workoutLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  weekTag: {
    fontSize: '11px',
    letterSpacing: '3px',
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '600',
  },
  totalTime: {
    fontSize: '56px',
    fontWeight: '800',
    letterSpacing: '-2px',
    lineHeight: 1,
    color: '#fff',
  },
  totalTimeUnit: {
    fontSize: '24px',
    fontWeight: '400',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0,
  },
  doneBadge: {
    display: 'inline-block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#27AE60',
    background: '#27AE6018',
    border: '1px solid #27AE6044',
    borderRadius: '20px',
    padding: '4px 12px',
    alignSelf: 'flex-start',
  },
  statsCard: {
    display: 'flex',
    background: '#161616',
    border: '1px solid #222',
    borderRadius: '14px',
    padding: '18px 0',
  },
  statItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  statVal: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#fff',
    lineHeight: 1,
  },
  statLbl: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  statDiv: {
    width: '1px',
    background: '#222',
    margin: '4px 0',
  },
  breakdown: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    background: '#161616',
    border: '1px solid #222',
    borderRadius: '14px',
    overflow: 'hidden',
  },
  breakdownRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderBottom: '1px solid #1e1e1e',
  },
  breakdownDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: '14px',
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  breakdownTime: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#fff',
  },
  footer: {
    padding: '20px',
  },
  goBtn: {
    width: '100%',
    padding: '18px',
    borderRadius: '14px',
    fontSize: '16px',
    fontWeight: '800',
    letterSpacing: '3px',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
  },
  dayNav: {
    display: 'flex',
    gap: '8px',
    padding: '0 20px 24px',
    overflowX: 'auto',
  },
  dayBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 12px',
    borderRadius: '10px',
    border: '1px solid',
    background: 'transparent',
    cursor: 'pointer',
    flexShrink: 0,
    position: 'relative',
  },
  dayBtnDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  dayBtnText: {
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.5px',
  },
}