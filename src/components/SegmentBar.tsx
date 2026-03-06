import { Segment } from '../data/index'

interface Props {
  segments: Segment[]
  activeIndex: number
}

const segmentColors: Record<string, string> = {
  warmup:   '#E84545',
  run:      '#2ECC71',
  walk:     '#F4D03F',
  cooldown: '#3498DB',
}

const segmentTextColors: Record<string, string> = {
  walk: '#333',
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  if (m === 0) return `${s}s`
  if (s === 0) return `${m}m`
  return `${m}m${s}s`
}

// Merge consecutive same-type segments for display
function mergeSegments(segments: Segment[]): Array<Segment & { spanCount: number; originalIndices: number[] }> {
  const merged: Array<Segment & { spanCount: number; originalIndices: number[] }> = []
  segments.forEach((seg, i) => {
    const last = merged[merged.length - 1]
    if (last && last.type === seg.type) {
      last.duration += seg.duration
      last.spanCount++
      last.originalIndices.push(i)
    } else {
      merged.push({ ...seg, spanCount: 1, originalIndices: [i] })
    }
  })
  return merged
}

export default function SegmentBar({ segments, activeIndex }: Props) {
  const merged = mergeSegments(segments)
  const totalDuration = segments.reduce((a, s) => a + s.duration, 0)

  return (
    <div style={styles.bar}>
      {merged.map((seg) => {
        const isActive = seg.originalIndices.includes(activeIndex)
        const widthPct = (seg.duration / totalDuration) * 100
        const bg = segmentColors[seg.type] ?? '#888'
        const textColor = segmentTextColors[seg.type] ?? '#fff'

        return (
          <div
            key={seg.originalIndices[0]}
            style={{
              ...styles.segment,
              width: `${widthPct}%`,
              background: bg,
              opacity: isActive ? 1 : 0.55,
              transform: isActive ? 'scaleY(1.08)' : 'scaleY(1)',
              color: textColor,
              boxShadow: isActive ? `0 0 12px ${bg}88` : 'none',
            }}
          >
            <span style={styles.segDuration}>{formatDuration(seg.duration)}</span>
            <span style={styles.segLabel}>{seg.label}</span>
          </div>
        )
      })}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    display: 'flex',
    height: '72px',
    width: '100%',
    overflow: 'hidden',
  },
  segment: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    transition: 'opacity 0.3s, transform 0.3s, box-shadow 0.3s',
    transformOrigin: 'bottom',
    borderRight: '1px solid rgba(255,255,255,0.2)',
    minWidth: '0',
    overflow: 'hidden',
  },
  segDuration: {
    fontSize: '15px',
    fontWeight: '700',
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
  segLabel: {
    fontSize: '10px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
  },
}
