// ─── TYPES ──────────────────────────────────────────────────────────
export type SegmentType = 'warmup' | 'run' | 'walk' | 'cooldown'

export interface Segment {
  type: SegmentType
  duration: number
  label: string
}

export interface WorkoutDay {
  day: number
  segments: Segment[]
}

export interface ProgramWeek {
  week: number
  days: WorkoutDay[]
}

export type GoalKey = '5k' | '10k' | '21k'

// ─── HELPERS ────────────────────────────────────────────────────────
function mins(m: number): number { return Math.round(m * 60) }

const warmup:   Segment = { type: 'warmup',   duration: mins(5), label: 'Warm Up' }
const cooldown: Segment = { type: 'cooldown', duration: mins(5), label: 'Cool Down' }
const run  = (m: number): Segment => ({ type: 'run',  duration: mins(m), label: 'Run' })
const walk = (m: number): Segment => ({ type: 'walk', duration: mins(m), label: 'Walk' })

// ─── 5K PROGRAM (9 weeks) ───────────────────────────────────────────
export const program5k: ProgramWeek[] = [
  { week: 1, days: [
    { day: 1, segments: [warmup, run(1), walk(1.5), run(1), walk(1.5), run(1), walk(1.5), run(1), walk(1.5), run(1), walk(1.5), run(1), walk(1.5), run(1), cooldown] },
    { day: 2, segments: [warmup, run(1), walk(1.5), run(1), walk(1.5), run(1), walk(1.5), run(1), walk(1.5), run(1), walk(1.5), run(1), walk(1.5), run(1), cooldown] },
    { day: 3, segments: [warmup, run(1), walk(1.5), run(1), walk(1.5), run(1), walk(1.5), run(1), walk(1.5), run(1), walk(1.5), run(1), walk(1.5), run(1), cooldown] },
  ]},
  { week: 2, days: [
    { day: 1, segments: [warmup, run(1.5), walk(2), run(1.5), walk(2), run(1.5), walk(2), run(1.5), walk(2), run(1.5), walk(2), run(1.5), cooldown] },
    { day: 2, segments: [warmup, run(1.5), walk(2), run(1.5), walk(2), run(1.5), walk(2), run(1.5), walk(2), run(1.5), walk(2), run(1.5), cooldown] },
    { day: 3, segments: [warmup, run(1.5), walk(2), run(1.5), walk(2), run(1.5), walk(2), run(1.5), walk(2), run(1.5), walk(2), run(1.5), cooldown] },
  ]},
  { week: 3, days: [
    { day: 1, segments: [warmup, run(1.5), walk(1.5), run(3), walk(3), run(1.5), walk(1.5), run(3), cooldown] },
    { day: 2, segments: [warmup, run(1.5), walk(1.5), run(3), walk(3), run(1.5), walk(1.5), run(3), cooldown] },
    { day: 3, segments: [warmup, run(1.5), walk(1.5), run(3), walk(3), run(1.5), walk(1.5), run(3), cooldown] },
  ]},
  { week: 4, days: [
    { day: 1, segments: [warmup, run(3), walk(1.5), run(5), walk(2.5), run(3), walk(1.5), run(5), cooldown] },
    { day: 2, segments: [warmup, run(3), walk(1.5), run(5), walk(2.5), run(3), walk(1.5), run(5), cooldown] },
    { day: 3, segments: [warmup, run(3), walk(1.5), run(5), walk(2.5), run(3), walk(1.5), run(5), cooldown] },
  ]},
  { week: 5, days: [
    { day: 1, segments: [warmup, run(5), walk(3), run(5), walk(3), run(5), cooldown] },
    { day: 2, segments: [warmup, run(8), walk(5), run(8), cooldown] },
    { day: 3, segments: [warmup, run(20), cooldown] },
  ]},
  { week: 6, days: [
    { day: 1, segments: [warmup, run(5), walk(3), run(8), walk(3), run(5), cooldown] },
    { day: 2, segments: [warmup, run(10), walk(3), run(10), cooldown] },
    { day: 3, segments: [warmup, run(22), cooldown] },
  ]},
  { week: 7, days: [
    { day: 1, segments: [warmup, run(25), cooldown] },
    { day: 2, segments: [warmup, run(25), cooldown] },
    { day: 3, segments: [warmup, run(25), cooldown] },
  ]},
  { week: 8, days: [
    { day: 1, segments: [warmup, run(28), cooldown] },
    { day: 2, segments: [warmup, run(28), cooldown] },
    { day: 3, segments: [warmup, run(28), cooldown] },
  ]},
  { week: 9, days: [
    { day: 1, segments: [warmup, run(30), cooldown] },
    { day: 2, segments: [warmup, run(30), cooldown] },
    { day: 3, segments: [warmup, run(30), cooldown] },
  ]},
]

// ─── 10K PROGRAM (14 weeks) ─────────────────────────────────────────
export const program10k: ProgramWeek[] = [
  { week: 1, days: [
    { day: 1, segments: [warmup, run(1), walk(2), run(1), walk(2), run(1), walk(2), run(1), walk(2), run(1), cooldown] },
    { day: 2, segments: [warmup, run(1), walk(2), run(1), walk(2), run(1), walk(2), run(1), walk(2), run(1), cooldown] },
    { day: 3, segments: [warmup, run(1), walk(2), run(1), walk(2), run(1), walk(2), run(1), walk(2), run(1), cooldown] },
  ]},
  { week: 2, days: [
    { day: 1, segments: [warmup, run(2), walk(2), run(2), walk(2), run(2), walk(2), run(2), cooldown] },
    { day: 2, segments: [warmup, run(2), walk(2), run(2), walk(2), run(2), walk(2), run(2), cooldown] },
    { day: 3, segments: [warmup, run(2), walk(2), run(2), walk(2), run(2), walk(2), run(2), cooldown] },
  ]},
  { week: 3, days: [
    { day: 1, segments: [warmup, run(3), walk(2), run(3), walk(2), run(3), walk(2), run(3), cooldown] },
    { day: 2, segments: [warmup, run(3), walk(2), run(3), walk(2), run(3), walk(2), run(3), cooldown] },
    { day: 3, segments: [warmup, run(3), walk(2), run(3), walk(2), run(3), walk(2), run(3), cooldown] },
  ]},
  { week: 4, days: [
    { day: 1, segments: [warmup, run(5), walk(2), run(5), walk(2), run(5), cooldown] },
    { day: 2, segments: [warmup, run(5), walk(2), run(5), walk(2), run(5), cooldown] },
    { day: 3, segments: [warmup, run(5), walk(2), run(5), walk(2), run(5), cooldown] },
  ]},
  { week: 5, days: [
    { day: 1, segments: [warmup, run(8), walk(2), run(8), walk(2), run(5), cooldown] },
    { day: 2, segments: [warmup, run(8), walk(2), run(8), walk(2), run(5), cooldown] },
    { day: 3, segments: [warmup, run(10), walk(2), run(10), cooldown] },
  ]},
  { week: 6, days: [
    { day: 1, segments: [warmup, run(10), walk(2), run(10), cooldown] },
    { day: 2, segments: [warmup, run(12), walk(2), run(8), cooldown] },
    { day: 3, segments: [warmup, run(15), cooldown] },
  ]},
  { week: 7, days: [
    { day: 1, segments: [warmup, run(15), cooldown] },
    { day: 2, segments: [warmup, run(18), cooldown] },
    { day: 3, segments: [warmup, run(20), cooldown] },
  ]},
  { week: 8, days: [
    { day: 1, segments: [warmup, run(20), cooldown] },
    { day: 2, segments: [warmup, run(22), cooldown] },
    { day: 3, segments: [warmup, run(25), cooldown] },
  ]},
  { week: 9, days: [
    { day: 1, segments: [warmup, run(25), cooldown] },
    { day: 2, segments: [warmup, run(25), cooldown] },
    { day: 3, segments: [warmup, run(28), cooldown] },
  ]},
  { week: 10, days: [
    { day: 1, segments: [warmup, run(28), cooldown] },
    { day: 2, segments: [warmup, run(30), cooldown] },
    { day: 3, segments: [warmup, run(30), cooldown] },
  ]},
  { week: 11, days: [
    { day: 1, segments: [warmup, run(30), cooldown] },
    { day: 2, segments: [warmup, run(33), cooldown] },
    { day: 3, segments: [warmup, run(35), cooldown] },
  ]},
  { week: 12, days: [
    { day: 1, segments: [warmup, run(35), cooldown] },
    { day: 2, segments: [warmup, run(38), cooldown] },
    { day: 3, segments: [warmup, run(40), cooldown] },
  ]},
  { week: 13, days: [
    { day: 1, segments: [warmup, run(40), cooldown] },
    { day: 2, segments: [warmup, run(43), cooldown] },
    { day: 3, segments: [warmup, run(45), cooldown] },
  ]},
  { week: 14, days: [
    { day: 1, segments: [warmup, run(45), cooldown] },
    { day: 2, segments: [warmup, run(48), cooldown] },
    { day: 3, segments: [warmup, run(50), cooldown] },
  ]},
]

// ─── 21K PROGRAM (20 weeks) ─────────────────────────────────────────
export const program21k: ProgramWeek[] = [
  { week: 1, days: [
    { day: 1, segments: [warmup, run(2), walk(2), run(2), walk(2), run(2), cooldown] },
    { day: 2, segments: [warmup, run(2), walk(2), run(2), walk(2), run(2), cooldown] },
    { day: 3, segments: [warmup, run(3), walk(2), run(3), walk(2), run(3), cooldown] },
  ]},
  { week: 2, days: [
    { day: 1, segments: [warmup, run(3), walk(2), run(3), walk(2), run(3), cooldown] },
    { day: 2, segments: [warmup, run(4), walk(2), run(4), walk(2), run(4), cooldown] },
    { day: 3, segments: [warmup, run(5), walk(2), run(5), cooldown] },
  ]},
  { week: 3, days: [
    { day: 1, segments: [warmup, run(5), walk(2), run(5), walk(2), run(5), cooldown] },
    { day: 2, segments: [warmup, run(8), walk(2), run(8), cooldown] },
    { day: 3, segments: [warmup, run(10), cooldown] },
  ]},
  { week: 4, days: [
    { day: 1, segments: [warmup, run(10), cooldown] },
    { day: 2, segments: [warmup, run(12), cooldown] },
    { day: 3, segments: [warmup, run(15), cooldown] },
  ]},
  { week: 5, days: [
    { day: 1, segments: [warmup, run(15), cooldown] },
    { day: 2, segments: [warmup, run(18), cooldown] },
    { day: 3, segments: [warmup, run(20), cooldown] },
  ]},
  { week: 6, days: [
    { day: 1, segments: [warmup, run(20), cooldown] },
    { day: 2, segments: [warmup, run(22), cooldown] },
    { day: 3, segments: [warmup, run(25), cooldown] },
  ]},
  { week: 7, days: [
    { day: 1, segments: [warmup, run(25), cooldown] },
    { day: 2, segments: [warmup, run(25), cooldown] },
    { day: 3, segments: [warmup, run(28), cooldown] },
  ]},
  { week: 8, days: [
    { day: 1, segments: [warmup, run(28), cooldown] },
    { day: 2, segments: [warmup, run(30), cooldown] },
    { day: 3, segments: [warmup, run(30), cooldown] },
  ]},
  { week: 9, days: [
    { day: 1, segments: [warmup, run(30), cooldown] },
    { day: 2, segments: [warmup, run(33), cooldown] },
    { day: 3, segments: [warmup, run(35), cooldown] },
  ]},
  { week: 10, days: [
    { day: 1, segments: [warmup, run(20), cooldown] },
    { day: 2, segments: [warmup, run(20), cooldown] },
    { day: 3, segments: [warmup, run(25), cooldown] },
  ]},
  { week: 11, days: [
    { day: 1, segments: [warmup, run(35), cooldown] },
    { day: 2, segments: [warmup, run(38), cooldown] },
    { day: 3, segments: [warmup, run(40), cooldown] },
  ]},
  { week: 12, days: [
    { day: 1, segments: [warmup, run(40), cooldown] },
    { day: 2, segments: [warmup, run(43), cooldown] },
    { day: 3, segments: [warmup, run(45), cooldown] },
  ]},
  { week: 13, days: [
    { day: 1, segments: [warmup, run(45), cooldown] },
    { day: 2, segments: [warmup, run(48), cooldown] },
    { day: 3, segments: [warmup, run(50), cooldown] },
  ]},
  { week: 14, days: [
    { day: 1, segments: [warmup, run(50), cooldown] },
    { day: 2, segments: [warmup, run(53), cooldown] },
    { day: 3, segments: [warmup, run(55), cooldown] },
  ]},
  { week: 15, days: [
    { day: 1, segments: [warmup, run(30), cooldown] },
    { day: 2, segments: [warmup, run(30), cooldown] },
    { day: 3, segments: [warmup, run(35), cooldown] },
  ]},
  { week: 16, days: [
    { day: 1, segments: [warmup, run(55), cooldown] },
    { day: 2, segments: [warmup, run(58), cooldown] },
    { day: 3, segments: [warmup, run(60), cooldown] },
  ]},
  { week: 17, days: [
    { day: 1, segments: [warmup, run(60), cooldown] },
    { day: 2, segments: [warmup, run(65), cooldown] },
    { day: 3, segments: [warmup, run(70), cooldown] },
  ]},
  { week: 18, days: [
    { day: 1, segments: [warmup, run(70), cooldown] },
    { day: 2, segments: [warmup, run(75), cooldown] },
    { day: 3, segments: [warmup, run(80), cooldown] },
  ]},
  { week: 19, days: [
    { day: 1, segments: [warmup, run(40), cooldown] },
    { day: 2, segments: [warmup, run(30), cooldown] },
    { day: 3, segments: [warmup, run(20), cooldown] },
  ]},
  { week: 20, days: [
    { day: 1, segments: [warmup, run(20), cooldown] },
    { day: 2, segments: [warmup, run(15), cooldown] },
    { day: 3, segments: [warmup, run(110), cooldown] },
  ]},
]

// ─── EXPORTS ────────────────────────────────────────────────────────
export const programs: Record<GoalKey, ProgramWeek[]> = {
  '5k': program5k,
  '10k': program10k,
  '21k': program21k,
}

export const goalMeta: Record<GoalKey, { label: string; weeks: number; color: string; emoji: string; description: string }> = {
  '5k':  { label: '5K',             weeks: 9,  color: '#2ECC71', emoji: '🟢', description: 'Run your first 5K in 9 weeks' },
  '10k': { label: '10K',            weeks: 14, color: '#3498DB', emoji: '🔵', description: 'Build to 10K in 14 weeks' },
  '21k': { label: 'Half Marathon',  weeks: 20, color: '#9B59B6', emoji: '🟣', description: 'Conquer 21K in 20 weeks' },
}
