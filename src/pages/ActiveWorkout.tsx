import { useNavigate, useParams } from 'react-router-dom'
import { GoalKey, goalMeta, programs } from '../data/index'
import { useTimer } from '../hooks/useTimer'
import { useProgress } from '../hooks/useProgress'
import { useCallback, useState, useEffect, useRef } from 'react'

const segmentColors: Record<string, string> = {
  warmup:   '#E84545',
  run:      '#2ECC71',
  walk:     '#F4D03F',
  cooldown: '#3498DB',
}

const segmentTextColors: Record<string, string> = {
  walk: '#333',
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatMins(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  if (s === 0) return `${m}:00`
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function ActiveWorkout() {
  const { goal, week, day } = useParams<{ goal: GoalKey; week: string; day: string }>()
  const navigate = useNavigate()
  const { markComplete } = useProgress()
  const [locked, setLocked] = useState(false)
  const [elapsedTotal, setElapsedTotal] = useState(0)
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const key = goal as GoalKey
  const weekNum = parseInt(week ?? '1')
  const dayNum = parseInt(day ?? '1')
  const meta = goalMeta[key]
  const program = programs[key]

  const weekData = program?.find(w => w.week === weekNum)
  const dayData = weekData?.days.find(d => d.day === dayNum)

  const handleComplete = useCallback(() => {
    const segs = dayData?.segments ?? []
    const totalMins = Math.round(segs.reduce((a, s) => a + s.duration, 0) / 60)
    const runMins = Math.round(segs.filter(s => s.type === 'run').reduce((a, s) => a + s.duration, 0) / 60)
    const walkMins = Math.round(segs.filter(s => s.type === 'walk').reduce((a, s) => a + s.duration, 0) / 60)
    markComplete(key, weekNum, dayNum, {
      totalSeconds: elapsedTotal,
      totalMinutes: totalMins,
      runMinutes: runMins,
      walkMinutes: walkMins,
      segments: segs.length,
    })
  }, [key, weekNum, dayNum, markComplete, dayData, elapsedTotal])

  const {
    currentSegment,
    segmentIndex,
    timeLeft,
    isRunning,
    isFinished,
    start,
    pause,
    resume,
    reset,
    skipNext,
    skipPrev,
  } = useTimer(dayData?.segments ?? [], handleComplete)

  // Track total elapsed time
  useEffect(() => {
    if (isRunning) {
      elapsedRef.current = setInterval(() => setElapsedTotal(t => t + 1), 1000)
    } else {
      if (elapsedRef.current) clearInterval(elapsedRef.current)
    }
    return () => { if (elapsedRef.current) clearInterval(elapsedRef.current) }
  }, [isRunning])

  if (!meta || !dayData) { navigate('/'); return null }

  const segColor = segmentColors[currentSegment?.type ?? 'run'] ?? '#2ECC71'
  const segTextColor = segmentTextColors[currentSegment?.type ?? 'run'] ?? '#fff'
  const nextSeg = dayData.segments[segmentIndex + 1]
  const totalWorkoutSecs = dayData.segments.reduce((a, s) => a + s.duration, 0)
  const timeLeftTotal = totalWorkoutSecs - elapsedTotal

  const segDuration = currentSegment?.duration ?? 1
  const segElapsed = segDuration - timeLeft
  const segProgress = Math.min(segElapsed / segDuration, 1)

  const segMins = Math.ceil(segDuration / 60)
  const markers = Array.from({ length: segMins - 1 }, (_, i) => i + 1)

  const hasStarted = !(segmentIndex === 0 && timeLeft === (dayData.segments[0]?.duration ?? 0) && !isRunning)

  return (
    <div style={styles.container}>
      {/* Blurred scene background */}
      <div style={styles.sceneBg} />

      {/* Top bar */}
      <div style={styles.topBar}>
        <button style={styles.topBtn} onClick={() => navigate(`/workout/${key}/${weekNum}/${dayNum}`)}>✕</button>
        <button style={styles.topBtn} onClick={() => { reset(); setElapsedTotal(0) }}>↺</button>
        <button style={styles.topBtn}>♪</button>
      </div>

      {/* Segment name + countdown */}
      <div style={styles.segmentHeader}>
        <span style={styles.segmentTitle}>
          {currentSegment?.label?.toUpperCase()} {formatTime(timeLeft)}
        </span>
      </div>

      {/* Segment progress bar */}
      <div style={{ ...styles.segBarWrap, background: segColor }}>
        <div style={{ ...styles.segBarFill, width: `${segProgress * 100}%` }} />
        {markers.map(m => (
          <div key={m} style={{ ...styles.segMarker, left: `${(m / segMins) * 100}%` }}>
            <div style={styles.segMarkerLine} />
            <span style={{ ...styles.segMarkerLabel, color: segTextColor }}>{m}</span>
          </div>
        ))}
        <div style={{ ...styles.segDot, left: `${segProgress * 100}%` }} />
      </div>

      {/* Stats row: SINCE START · NEXT · TIME LEFT */}
      <div style={styles.statsRow}>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>{'SINCE\nSTART'}</span>
          <span style={styles.statValue}>{formatTime(elapsedTotal)}</span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.statItem}>
          <span style={styles.statLabel}>{`NEXT:\n${nextSeg ? nextSeg.label.toUpperCase() : 'DONE'}`}</span>
          <span style={styles.statValue}>{nextSeg ? formatMins(nextSeg.duration) : '—'}</span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.statItem}>
          <span style={styles.statLabel}>{'TIME\nLEFT'}</span>
          <span style={styles.statValue}>{formatTime(Math.max(0, timeLeftTotal))}</span>
        </div>
      </div>

      {/* Scene middle — lock button or finished */}
      <div style={styles.sceneMiddle}>
        {isFinished ? (
          <div style={styles.finishedWrap}>
            <div style={styles.finishedEmoji}>🎉</div>
            <div style={styles.finishedTitle}>Workout Complete!</div>
            <div style={styles.finishedSub}>Week {weekNum}, Day {dayNum} done</div>
            <button
              style={{ ...styles.finishBtn, background: meta.color }}
              onClick={() => navigate(`/program/${key}`)}
            >
              Back to Program
            </button>
          </div>
        ) : (
          <button
            style={{
              ...styles.lockBtn,
              background: locked ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)',
              borderColor: locked ? '#fff' : 'rgba(255,255,255,0.5)',
            }}
            onClick={() => setLocked(l => !l)}
            title={locked ? 'Tap to unlock' : 'Tap to lock screen'}
          >
            <span style={styles.lockIcon}>{locked ? '🔒' : '🔓'}</span>
          </button>
        )}
      </div>

      {/* Bottom controls: « PAUSE/RESUME » */}
      {!isFinished && (
        <div style={styles.bottomBar}>
          <button
            style={styles.skipBtn}
            onClick={() => { if (!locked) skipPrev() }}
            disabled={locked || segmentIndex === 0}
          >
            <span style={{ opacity: (locked || segmentIndex === 0) ? 0.25 : 1 }}>«</span>
          </button>

          <button
            style={styles.pauseBtn}
            onClick={() => {
              if (locked) return
              if (!hasStarted) start()
              else if (isRunning) pause()
              else resume()
            }}
          >
            <span style={{ opacity: locked ? 0.25 : 1 }}>
              {!hasStarted ? 'START' : isRunning ? 'PAUSE' : 'RESUME'}
            </span>
          </button>

          <button
            style={styles.skipBtn}
            onClick={() => { if (!locked) skipNext() }}
            disabled={locked || segmentIndex >= dayData.segments.length - 1}
          >
            <span style={{ opacity: (locked || segmentIndex >= dayData.segments.length - 1) ? 0.25 : 1 }}>»</span>
          </button>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'DM Sans', sans-serif",
    color: '#fff',
    position: 'relative',
    overflow: 'hidden',
  },
  sceneBg: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, #3a8fa8 0%, #87CEEB 30%, #5a9e3a 65%, #3a7020 100%)',
    filter: 'blur(3px)',
    transform: 'scale(1.05)',
    zIndex: 0,
  },
  topBar: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    background: 'rgba(58,143,168,0.55)',
  },
  topBtn: {
    background: 'transparent',
    color: 'rgba(255,255,255,0.8)',
    fontSize: '20px',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentHeader: {
    position: 'relative',
    zIndex: 2,
    padding: '20px 24px 14px',
    background: 'rgba(58,143,168,0.45)',
  },
  segmentTitle: {
    fontSize: '36px',
    fontWeight: '700',
    letterSpacing: '1px',
    color: '#fff',
  },
  segBarWrap: {
    position: 'relative',
    zIndex: 2,
    height: '80px',
    width: '100%',
    overflow: 'hidden',
    transition: 'background 0.6s ease',
  },
  segBarFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    background: 'rgba(0,0,0,0.18)',
    transition: 'width 1s linear',
  },
  segMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transform: 'translateX(-50%)',
    pointerEvents: 'none',
  },
  segMarkerLine: {
    width: '1px',
    flex: 1,
    background: 'rgba(255,255,255,0.35)',
  },
  segMarkerLabel: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '3px 0',
  },
  segDot: {
    position: 'absolute',
    bottom: 0,
    width: '4px',
    height: '22px',
    background: '#fff',
    borderRadius: '2px',
    transform: 'translateX(-50%)',
    transition: 'left 1s linear',
    boxShadow: '0 0 8px rgba(255,255,255,0.9)',
  },
  statsRow: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    background: 'rgba(0,0,0,0.38)',
    backdropFilter: 'blur(8px)',
    padding: '14px 0',
  },
  statItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5px',
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: '1px',
    textAlign: 'center',
    whiteSpace: 'pre',
    lineHeight: 1.3,
  },
  statValue: {
    fontSize: '26px',
    fontWeight: '700',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1,
  },
  statDivider: {
    width: '1px',
    background: 'rgba(255,255,255,0.12)',
    margin: '4px 0',
  },
  sceneMiddle: {
    flex: 1,
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBtn: {
    width: '76px',
    height: '76px',
    borderRadius: '50%',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(8px)',
    transition: 'background 0.2s, border-color 0.2s',
    cursor: 'pointer',
  },
  lockIcon: {
    fontSize: '30px',
  },
  bottomBar: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(10px)',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    height: '72px',
  },
  skipBtn: {
    flex: 1,
    height: '100%',
    background: 'transparent',
    color: '#fff',
    fontSize: '26px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRight: '1px solid rgba(255,255,255,0.1)',
  },
  pauseBtn: {
    flex: 2,
    height: '100%',
    background: 'transparent',
    color: '#fff',
    fontSize: '17px',
    fontWeight: '800',
    letterSpacing: '3px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRight: '1px solid rgba(255,255,255,0.1)',
  },
  finishedWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '20px',
  },
  finishedEmoji: { fontSize: '64px' },
  finishedTitle: { fontSize: '28px', fontWeight: '800' },
  finishedSub: { fontSize: '15px', color: 'rgba(255,255,255,0.5)' },
  finishBtn: {
    marginTop: '16px',
    padding: '16px 40px',
    borderRadius: '50px',
    fontSize: '16px',
    fontWeight: '700',
    color: '#fff',
    letterSpacing: '1px',
    border: 'none',
    cursor: 'pointer',
  },
}