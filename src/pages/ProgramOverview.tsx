import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { GoalKey, goalMeta, programs } from '../data/index'
import { useProgress } from '../hooks/useProgress'

export default function ProgramOverview() {
  const { goal } = useParams<{ goal: GoalKey }>()
  const navigate  = useNavigate()
  const { isComplete, markComplete, profileName, getNextWorkout } = useProgress()
  const [tapped, setTapped] = useState<string | null>(null) // "w1d2" format

  const key     = goal as GoalKey
  const meta    = goalMeta[key]
  const program = programs[key]

  if (!meta || !program) { navigate('/'); return null }

  const totalDays     = program.length * 3
  const completedDays = program.flatMap(w => w.days.filter(d => isComplete(key, w.week, d.day))).length
  const pct           = Math.round((completedDays / totalDays) * 100)
  const next          = getNextWorkout(key, meta.weeks)

  const handleDayTap = (week: number, day: number, done: boolean) => {
    const k = `w${week}d${day}`
    if (done) return // already done — tapping does nothing
    if (tapped === k) {
      // Second tap — mark complete
      markComplete(key, week, day)
      setTapped(null)
    } else {
      // First tap — show confirm options
      setTapped(k)
    }
  }

  return (
    <div style={styles.page} onClick={() => setTapped(null)}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/')}>← Back</button>
        <span style={{ ...styles.goalBadge, color: meta.color }}>{meta.label}</span>
        <span style={styles.headerRight}>{pct}%</span>
      </div>

      {/* Progress bar */}
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${pct}%`, background: meta.color }} />
      </div>

      {/* Hero stats */}
      <div style={styles.hero}>
        <div style={styles.heroLeft}>
          <div style={styles.heroName}>{profileName || 'Your Program'}</div>
          <div style={styles.heroDesc}>{meta.description}</div>
          {next ? (
            <button
              style={{ ...styles.nextBtn, background: meta.color }}
              onClick={() => navigate(`/workout/${key}/${next.week}/${next.day}`)}
            >
              Continue → W{next.week}/D{next.day}
            </button>
          ) : (
            <div style={styles.completedBadge}>✓ Program Complete</div>
          )}
        </div>
        <div style={styles.heroStats}>
          <div style={styles.heroStat}>
            <span style={styles.heroStatVal}>{completedDays}</span>
            <span style={styles.heroStatLbl}>done</span>
          </div>
          <div style={styles.heroStat}>
            <span style={styles.heroStatVal}>{totalDays - completedDays}</span>
            <span style={styles.heroStatLbl}>left</span>
          </div>
        </div>
      </div>

      {/* Week list */}
      <div style={styles.weekList}>
        {program.map(week => {
          const weekDone = week.days.filter(d => isComplete(key, week.week, d.day)).length
          const weekAllDone = weekDone === week.days.length
          return (
            <div key={week.week} style={{
              ...styles.weekBlock,
              borderColor: weekAllDone ? meta.color + '33' : '#1e1e1e',
            }}>
              <div style={styles.weekHeader}>
                <span style={styles.weekLabel}>Week {week.week}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {!weekAllDone && (
                    <button
                      style={{
                        fontSize: 10, fontWeight: 700, padding: '3px 8px',
                        borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                        background: '#2ECC7118', color: '#2ECC71',
                        border: '1px solid #2ECC7133',
                      }}
                      onClick={e => {
                        e.stopPropagation()
                        week.days.forEach(d => {
                          if (!isComplete(key, week.week, d.day))
                            markComplete(key, week.week, d.day)
                        })
                      }}
                    >
                      ✓ Mark week done
                    </button>
                  )}
                  <span style={{
                    ...styles.weekProgress,
                    color: weekAllDone ? meta.color : 'rgba(255,255,255,0.2)'
                  }}>{weekDone}/3 {weekAllDone ? '✓' : ''}</span>
                </div>
              </div>
              <div style={styles.dayRow}>
                {week.days.map(d => {
                  const done    = isComplete(key, week.week, d.day)
                  const isNext  = next?.week === week.week && next?.day === d.day
                  const mins    = Math.round(d.segments.reduce((a, s) => a + s.duration, 0) / 60)
                  const tapKey  = `w${week.week}d${d.day}`
                  const isTapped = tapped === tapKey

                  return (
                    <div key={d.day} style={{ position: 'relative' }}>
                      <button
                        style={{
                          ...styles.dayCard,
                          borderColor: done ? '#2ECC71' : isTapped ? meta.color : isNext ? meta.color + '66' : '#222',
                          background:  done ? '#2ECC7118' : isTapped ? meta.color + '22' : isNext ? meta.color + '0D' : '#161616',
                          width: '100%',
                        }}
                        onClick={e => { e.stopPropagation(); handleDayTap(week.week, d.day, done) }}
                      >
                        {/* Icon */}
                        <span style={{
                          fontSize: done ? 18 : 15,
                          fontWeight: 700,
                          color: done ? '#2ECC71' : isTapped ? meta.color : isNext ? meta.color : 'rgba(255,255,255,0.2)'
                        }}>
                          {done ? '✓' : isNext ? '▶' : `D${d.day}`}
                        </span>

                        {/* Label */}
                        <span style={{
                          fontSize: 10,
                          fontWeight: done ? 700 : 400,
                          color: done ? '#2ECC71' : 'rgba(255,255,255,0.25)'
                        }}>
                          {done ? 'Done' : `${mins}m`}
                        </span>
                      </button>

                      {/* Confirm popup on first tap */}
                      {isTapped && (
                        <div style={styles.popup} onClick={e => e.stopPropagation()}>
                          <div style={{ fontSize: 11, color: '#888', marginBottom: 8, textAlign: 'center' }}>
                            Day {d.day} · {mins}m
                          </div>
                          <button
                            style={{ ...styles.popupBtn, background: meta.color + '22', color: meta.color, borderColor: meta.color + '44' }}
                            onClick={e => { e.stopPropagation(); navigate(`/workout/${key}/${week.week}/${d.day}`) }}
                          >
                            ▶ Start workout
                          </button>
                          <button
                            style={{ ...styles.popupBtn, background: '#2ECC7118', color: '#2ECC71', borderColor: '#2ECC7133' }}
                            onClick={e => { e.stopPropagation(); markComplete(key, week.week, d.day); setTapped(null) }}
                          >
                            ✓ Mark as done
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
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
    color: '#fff',
    fontFamily: "'DM Sans', sans-serif",
    paddingBottom: '40px',
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
    color: 'rgba(255,255,255,0.35)',
    fontSize: '14px',
  },
  goalBadge: {
    fontSize: '16px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
  },
  headerRight: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.3)',
    width: 40,
    textAlign: 'right',
  },
  progressTrack: {
    height: '2px',
    background: '#1e1e1e',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.5s ease',
  },
  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '24px 20px',
    borderBottom: '1px solid #1e1e1e',
    gap: '12px',
  },
  heroLeft: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  heroName: {
    fontSize: '22px',
    fontWeight: '700',
  },
  heroDesc: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.35)',
  },
  nextBtn: {
    alignSelf: 'flex-start',
    marginTop: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '0.3px',
  },
  completedBadge: {
    alignSelf: 'flex-start',
    marginTop: '8px',
    fontSize: '13px',
    color: '#27AE60',
    fontWeight: '600',
  },
  heroStats: {
    display: 'flex',
    gap: '16px',
  },
  heroStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  heroStatVal: {
    fontSize: '28px',
    fontWeight: '800',
    lineHeight: 1,
  },
  heroStatLbl: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  weekList: {
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxWidth: '480px',
    margin: '0 auto',
  },
  weekBlock: {
    background: '#161616',
    border: '1px solid',
    borderRadius: '12px',
    padding: '14px',
    transition: 'border-color 0.3s',
  },
  weekHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  weekLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
  },
  weekProgress: {
    fontSize: '11px',
    transition: 'color 0.3s',
  },
  dayRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  dayCard: {
    borderRadius: '8px',
    border: '1px solid',
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  popup: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 12,
    padding: '12px',
    zIndex: 100,
    width: 160,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  },
  popupBtn: {
    border: '1px solid',
    borderRadius: 8,
    padding: '8px 10px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'center',
  },
}