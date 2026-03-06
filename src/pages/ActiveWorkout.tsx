import { useNavigate, useParams } from 'react-router-dom'
import { GoalKey, goalMeta, programs } from '../data/index'
import { useTimer } from '../hooks/useTimer'
import { useProgress } from '../hooks/useProgress'
import SegmentBar from '../components/SegmentBar'
import { useCallback } from 'react'

const segmentColors: Record<string, string> = {
  warmup:   '#E84545',
  run:      '#2ECC71',
  walk:     '#F4D03F',
  cooldown: '#3498DB',
}

const segmentEmoji: Record<string, string> = {
  warmup:   '🚶',
  run:      '🏃',
  walk:     '🚶',
  cooldown: '😮‍💨',
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function ActiveWorkout() {
  const { goal, week, day } = useParams<{ goal: GoalKey; week: string; day: string }>()
  const navigate = useNavigate()
  const { markComplete } = useProgress()

  const key = goal as GoalKey
  const weekNum = parseInt(week ?? '1')
  const dayNum = parseInt(day ?? '1')
  const meta = goalMeta[key]
  const program = programs[key]

  const weekData = program?.find(w => w.week === weekNum)
  const dayData = weekData?.days.find(d => d.day === dayNum)

  const handleComplete = useCallback(() => {
    markComplete(key, weekNum, dayNum)
  }, [key, weekNum, dayNum, markComplete])

  const { currentSegment, segmentIndex, timeLeft, isRunning, isFinished, progress, start, pause, resume, reset } =
    useTimer(dayData?.segments ?? [], handleComplete)

  if (!meta || !dayData) {
    navigate('/')
    return null
  }

  const segColor = segmentColors[currentSegment?.type ?? 'run'] ?? '#2ECC71'
  const emoji = segmentEmoji[currentSegment?.type ?? 'run'] ?? '🏃'

  return (
    <div style={{ ...styles.container, background: `linear-gradient(160deg, ${segColor}22, #0f0c29 60%)` }}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(`/workout/${key}/${weekNum}/${dayNum}`)}>✕</button>
        <span style={styles.headerTitle}>Week {weekNum} · Day {dayNum}</span>
        <button style={styles.resetBtn} onClick={reset}>↺</button>
      </div>

      {/* Segment bar */}
      <SegmentBar segments={dayData.segments} activeIndex={segmentIndex} />

      {/* Overall progress bar */}
      <div style={styles.overallBarWrap}>
        <div style={{ ...styles.overallBarFill, width: `${progress * 100}%`, background: segColor }} />
      </div>

      {/* Main display */}
      <div style={styles.main}>
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
          <>
            {/* Segment label */}
            <div style={styles.segmentLabel}>
              <span style={{ ...styles.segmentDot, background: segColor }} />
              <span style={{ ...styles.segmentName, color: segColor }}>
                {currentSegment?.label?.toUpperCase()}
              </span>
            </div>

            {/* Runner emoji */}
            <div style={{
              ...styles.runnerEmoji,
              animationName: isRunning ? (currentSegment?.type === 'run' ? 'bob' : 'sway') : 'none',
            }}>
              {emoji}
            </div>

            {/* Timer */}
            <div style={styles.timer}>{formatTime(timeLeft)}</div>

            {/* Segment count */}
            <div style={styles.segCount}>
              Segment {segmentIndex + 1} of {dayData.segments.length}
            </div>

            {/* Controls */}
            <div style={styles.controls}>
              {!isRunning && segmentIndex === 0 && timeLeft === (dayData.segments[0]?.duration ?? 0) ? (
                <button style={{ ...styles.mainBtn, background: segColor }} onClick={start}>
                  START
                </button>
              ) : isRunning ? (
                <button style={{ ...styles.mainBtn, background: 'rgba(255,255,255,0.15)' }} onClick={pause}>
                  PAUSE
                </button>
              ) : (
                <button style={{ ...styles.mainBtn, background: segColor }} onClick={resume}>
                  RESUME
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes sway {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-4px) rotate(2deg); }
        }
      `}</style>
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
    transition: 'background 1s ease',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
  },
  backBtn: {
    background: 'transparent',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '20px',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  resetBtn: {
    background: 'transparent',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '20px',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overallBarWrap: {
    height: '3px',
    background: 'rgba(255,255,255,0.1)',
    width: '100%',
  },
  overallBarFill: {
    height: '100%',
    transition: 'width 1s linear, background 1s ease',
    borderRadius: '2px',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    gap: '16px',
  },
  segmentLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  segmentDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  segmentName: {
    fontSize: '14px',
    fontWeight: '700',
    letterSpacing: '3px',
  },
  runnerEmoji: {
    fontSize: '72px',
    animationDuration: '0.5s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
    lineHeight: 1,
  },
  timer: {
    fontSize: '80px',
    fontWeight: '800',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-2px',
    lineHeight: 1,
  },
  segCount: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: '0.5px',
  },
  controls: {
    marginTop: '12px',
  },
  mainBtn: {
    padding: '18px 60px',
    borderRadius: '50px',
    fontSize: '18px',
    fontWeight: '800',
    letterSpacing: '3px',
    color: '#fff',
    border: 'none',
    transition: 'transform 0.15s',
  },
  finishedWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  finishedEmoji: {
    fontSize: '72px',
  },
  finishedTitle: {
    fontSize: '32px',
    fontWeight: '800',
  },
  finishedSub: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.5)',
  },
  finishBtn: {
    marginTop: '16px',
    padding: '16px 40px',
    borderRadius: '50px',
    fontSize: '16px',
    fontWeight: '700',
    color: '#fff',
    letterSpacing: '1px',
  },
}
