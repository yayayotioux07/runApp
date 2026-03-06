import { useNavigate, useParams } from 'react-router-dom'
import { GoalKey, goalMeta, programs } from '../data/index'
import SegmentBar from '../components/SegmentBar'

export default function WorkoutPreview() {
  const { goal, week, day } = useParams<{ goal: GoalKey; week: string; day: string }>()
  const navigate = useNavigate()

  const key = goal as GoalKey
  const weekNum = parseInt(week ?? '1')
  const dayNum = parseInt(day ?? '1')
  const meta = goalMeta[key]
  const program = programs[key]

  const weekData = program?.find(w => w.week === weekNum)
  const dayData = weekData?.days.find(d => d.day === dayNum)

  if (!meta || !dayData) {
    navigate('/')
    return null
  }

  const totalMins = Math.round(dayData.segments.reduce((a, s) => a + s.duration, 0) / 60)
  const runMins = Math.round(
    dayData.segments.filter(s => s.type === 'run').reduce((a, s) => a + s.duration, 0) / 60
  )

  return (
    <div style={styles.container}>
      {/* Scene background */}
      <div style={styles.scene}>
        <div style={styles.sky} />
        <div style={styles.sun} />
        <div style={styles.ground} />
        <div style={styles.runner}>🏃</div>
      </div>

      {/* Overlay content */}
      <div style={styles.overlay}>
        {/* Header */}
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate(`/program/${key}`)}>← Back</button>
          <div style={styles.headerInfo}>
            <span style={{ color: meta.color }}>{meta.label}</span>
            <span style={styles.headerSep}>·</span>
            <span>Week {weekNum} · Day {dayNum}</span>
          </div>
        </div>

        {/* Segment bar */}
        <SegmentBar segments={dayData.segments} activeIndex={-1} />

        {/* Spacer pushes button down */}
        <div style={{ flex: 1 }} />

        {/* Stats */}
        <div style={styles.stats}>
          <div style={styles.stat}>
            <span style={styles.statValue}>{totalMins}</span>
            <span style={styles.statLabel}>Total min</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.stat}>
            <span style={styles.statValue}>{runMins}</span>
            <span style={styles.statLabel}>Running min</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.stat}>
            <span style={styles.statValue}>{dayData.segments.filter(s => s.type === 'run').length}</span>
            <span style={styles.statLabel}>Run intervals</span>
          </div>
        </div>

        {/* LET'S GO button */}
        <button
          style={styles.goBtn}
          onClick={() => navigate(`/active/${key}/${weekNum}/${dayNum}`)}
        >
          LET'S GO
        </button>

        <div style={{ height: '32px' }} />
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100dvh',
    position: 'relative',
    fontFamily: "'DM Sans', sans-serif",
    color: '#fff',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  scene: {
    position: 'absolute',
    inset: 0,
  },
  sky: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '65%',
    background: 'linear-gradient(180deg, #87CEEB 0%, #c8e8f8 100%)',
  },
  sun: {
    position: 'absolute',
    top: '15%',
    right: '15%',
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, #FFE566 40%, rgba(255,215,0,0) 100%)',
    boxShadow: '0 0 40px 10px rgba(255,220,80,0.4)',
  },
  ground: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '40%',
    background: 'linear-gradient(180deg, #5a9e3a 0%, #3a7020 100%)',
  },
  runner: {
    position: 'absolute',
    bottom: '39%',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '52px',
    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
  },
  overlay: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100dvh',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    background: 'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(8px)',
  },
  backBtn: {
    background: 'transparent',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '15px',
  },
  headerInfo: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  headerSep: {
    color: 'rgba(255,255,255,0.3)',
  },
  stats: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '0',
    background: 'rgba(0,0,0,0.35)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    margin: '0 24px 24px',
    padding: '18px 0',
  },
  stat: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statDivider: {
    width: '1px',
    height: '36px',
    background: 'rgba(255,255,255,0.15)',
  },
  goBtn: {
    margin: '0 24px',
    padding: '20px',
    borderRadius: '50px',
    background: 'rgba(0,0,0,0.6)',
    border: '2px solid rgba(255,255,255,0.3)',
    color: '#fff',
    fontSize: '22px',
    fontWeight: '800',
    letterSpacing: '3px',
    backdropFilter: 'blur(10px)',
    transition: 'transform 0.15s, background 0.2s',
  },
}
