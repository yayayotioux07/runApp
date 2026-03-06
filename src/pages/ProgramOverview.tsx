import { useNavigate, useParams } from 'react-router-dom'
import { GoalKey, goalMeta, programs } from '../data/index'
import { useProgress } from '../hooks/useProgress'

export default function ProgramOverview() {
  const { goal } = useParams<{ goal: GoalKey }>()
  const navigate = useNavigate()
  const { isComplete, profileName } = useProgress()

  const key = goal as GoalKey
  const meta = goalMeta[key]
  const program = programs[key]

  if (!meta || !program) {
    navigate('/')
    return null
  }

  const totalDays = program.length * 3
  const completedDays = program.flatMap(w =>
    w.days.filter(d => isComplete(key, w.week, d.day))
  ).length

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={{ ...styles.header, borderBottomColor: meta.color + '44' }}>
        <button style={styles.backBtn} onClick={() => navigate('/')}>← Back</button>
        <div style={styles.headerCenter}>
          <span style={styles.goalEmoji}>{meta.emoji}</span>
          <span style={styles.goalLabel}>{meta.label}</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.progressText}>{completedDays}/{totalDays}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={styles.progressBarWrap}>
        <div
          style={{
            ...styles.progressBarFill,
            width: `${(completedDays / totalDays) * 100}%`,
            background: meta.color,
          }}
        />
      </div>

      {/* Greeting */}
      {profileName && (
        <p style={styles.greeting}>
          {completedDays === 0
            ? `Ready to start, ${profileName}?`
            : completedDays === totalDays
            ? `You've completed the ${meta.label}! 🎉`
            : `Keep it up, ${profileName}! ${totalDays - completedDays} sessions left.`}
        </p>
      )}

      {/* Week grid */}
      <div style={styles.weeks}>
        {program.map(week => (
          <div key={week.week} style={styles.weekBlock}>
            <div style={styles.weekHeader}>
              <span style={{ ...styles.weekLabel, color: meta.color }}>Week {week.week}</span>
            </div>
            <div style={styles.dayRow}>
              {week.days.map(d => {
                const done = isComplete(key, week.week, d.day)
                const totalMins = Math.round(d.segments.reduce((a, s) => a + s.duration, 0) / 60)
                return (
                  <button
                    key={d.day}
                    style={{
                      ...styles.dayCard,
                      borderColor: done ? meta.color : 'rgba(255,255,255,0.12)',
                      background: done ? meta.color + '22' : 'rgba(255,255,255,0.04)',
                    }}
                    onClick={() => navigate(`/workout/${key}/${week.week}/${d.day}`)}
                  >
                    <span style={styles.dayCheck}>{done ? '✓' : `D${d.day}`}</span>
                    <span style={styles.dayMins}>{totalMins}m</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100dvh',
    background: 'linear-gradient(160deg, #0f0c29, #302b63, #24243e)',
    fontFamily: "'DM Sans', sans-serif",
    color: '#fff',
    paddingBottom: '40px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid',
  },
  backBtn: {
    background: 'transparent',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '15px',
    padding: '6px 0',
  },
  headerCenter: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '20px',
    fontWeight: '700',
  },
  goalEmoji: { fontSize: '22px' },
  goalLabel: { fontSize: '20px', fontWeight: '700' },
  headerRight: {},
  progressText: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.5)',
  },
  progressBarWrap: {
    height: '3px',
    background: 'rgba(255,255,255,0.08)',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.4s ease',
  },
  greeting: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    padding: '16px 20px 4px',
  },
  weeks: {
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxWidth: '480px',
    margin: '0 auto',
  },
  weekBlock: {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '14px',
    padding: '14px 16px',
    border: '1px solid rgba(255,255,255,0.07)',
  },
  weekHeader: {
    marginBottom: '10px',
  },
  weekLabel: {
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  dayRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  dayCard: {
    borderRadius: '10px',
    border: '1.5px solid',
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
    transition: 'transform 0.15s',
  },
  dayCheck: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#fff',
  },
  dayMins: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
  },
}
