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
    { day: 3, segments: [warmup, run(8), walk(5), run(8), cooldown] },
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

// ─── 10K PROGRAM (14 weeks) — sourced from 10K Runner app ───────────
// Pages 1-2:   W5/D3  = 8R + 5W + 8R           = 21 min running
// Page 3:      W6/D1  = 10R + 5W + 10R          = 25 min running
// Page 4:      W6/D2  = 12R + 3W + 8R           = 23 min running
// Page 5:      W6/D3  = 15R + 3W + 5R           = 23 min running
// Page 6:      W7/D1  = 18R + 3W + 3R           = 24 min running
// Page 7:      W7/D2  = 20R                      = 20 min running
// Page 8:      W7/D3  = 20R + 3W + 5R           = 28 min running
// Page 9:      W8/D1  = 23R + 3W + 5R           = 31 min running
// Page 10:     W8/D2  = 25R + 2W + 7R           = 34 min running
// Page 11:     W8/D3  = 30R + 2W + 5R           = 37 min running
// Page 12:     W9/D1  = 35R                      = 35 min running
// Page 13:     W9/D2  = 20R + 3W + 20R          = 43 min running
// Page 14:     W9/D3  = 20R + 3W + 20R          = 43 min running
// Page 15:     W10/D1 = 20R + 2W + 20R          = 42 min running
// Page 16:     W10/D2 = 10R+1W + 10R+2W + 10R+3W + 10R+4W + 10R = 60 min (intervals)
// Page 17:     W10/D3 = same as W10/D2
// Page 18:     W11/D1 = 12R+1W + 12R+2W + 12R+3W + 12R+4W + 12R = 70 min (intervals)
// Page 19:     W11/D2 = 15R+2W + 15R+3W + 15R  = 50 min running
// Page 20:     W11/D3 = 25R + 5W + 15R          = 45 min running
// Page 21:     W12/D1 = 25R + 3W + 15R          = 43 min running
// Page 22:     W12/D2 = 30R + 5W + 15R          = 50 min running
// Page 23:     W12/D3 = 30R + 3W + 15R          = 48 min running
// Page 24:     W13/D1 = 30R + 2W + 15R          = 47 min running
// Page 25:     W13/D2 = 35R + 2W + 10R          = 47 min running
// Page 26:     W13/D3 = 40R + 2W + 10R          = 52 min running
// Page 27:     W14/D1 = 50R                      = 50 min running
// Page 28:     W14/D2 = 55R                      = 55 min running
// Page 29:     W14/D3 = 60R                      = 60 min running

export const program10k: ProgramWeek[] = [
  // Weeks 1-4: Build base (inferred from app progression leading to W5)
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
  // Week 5: From PDF pages 1-2 (W5/D3 confirmed = 8R+5W+8R)
  { week: 5, days: [
    { day: 1, segments: [warmup, run(5), walk(3), run(5), walk(3), run(5), cooldown] },
    { day: 2, segments: [warmup, run(8), walk(5), run(8), cooldown] },
    { day: 3, segments: [warmup, run(8), walk(5), run(8), cooldown] },
  ]},
  // Week 6: PDF pages 3-5
  { week: 6, days: [
    { day: 1, segments: [warmup, run(10), walk(5), run(10), cooldown] },          // page 3: 10R+5W+10R
    { day: 2, segments: [warmup, run(12), walk(3), run(8), cooldown] },           // page 4: 12R+3W+8R
    { day: 3, segments: [warmup, run(15), walk(3), run(5), cooldown] },           // page 5: 15R+3W+5R
  ]},
  // Week 7: PDF pages 6-8
  { week: 7, days: [
    { day: 1, segments: [warmup, run(18), walk(3), run(3), cooldown] },           // page 6: 18R+3W+3R
    { day: 2, segments: [warmup, run(20), cooldown] },                            // page 7: 20R
    { day: 3, segments: [warmup, run(20), walk(3), run(5), cooldown] },           // page 8: 20R+3W+5R
  ]},
  // Week 8: PDF pages 9-11
  { week: 8, days: [
    { day: 1, segments: [warmup, run(23), walk(3), run(5), cooldown] },           // page 9:  23R+3W+5R
    { day: 2, segments: [warmup, run(25), walk(2), run(7), cooldown] },           // page 10: 25R+2W+7R
    { day: 3, segments: [warmup, run(30), walk(2), run(5), cooldown] },           // page 11: 30R+2W+5R
  ]},
  // Week 9: PDF pages 12-14
  { week: 9, days: [
    { day: 1, segments: [warmup, run(35), cooldown] },                            // page 12: 35R
    { day: 2, segments: [warmup, run(20), walk(3), run(20), cooldown] },          // page 13: 20R+3W+20R
    { day: 3, segments: [warmup, run(20), walk(3), run(20), cooldown] },          // page 14: 20R+3W+20R
  ]},
  // Week 10: PDF pages 15-17
  { week: 10, days: [
    { day: 1, segments: [warmup, run(20), walk(2), run(20), cooldown] },          // page 15: 20R+2W+20R
    // page 16: 10R+1W+10R+2W+10R+3W+10R+4W+10R (5 intervals with increasing walk)
    { day: 2, segments: [warmup, run(10), walk(1), run(10), walk(2), run(10), walk(3), run(10), walk(4), run(10), cooldown] },
    { day: 3, segments: [warmup, run(10), walk(1), run(10), walk(2), run(10), walk(3), run(10), walk(4), run(10), cooldown] },
  ]},
  // Week 11: PDF pages 18-20
  { week: 11, days: [
    // page 18: 12R+1W+12R+2W+12R+3W+12R+4W+12R
    { day: 1, segments: [warmup, run(12), walk(1), run(12), walk(2), run(12), walk(3), run(12), walk(4), run(12), cooldown] },
    { day: 2, segments: [warmup, run(15), walk(2), run(15), walk(3), run(15), cooldown] },  // page 19: 15R+2W+15R+3W+15R
    { day: 3, segments: [warmup, run(25), walk(5), run(15), cooldown] },          // page 20: 25R+5W+15R
  ]},
  // Week 12: PDF pages 21-23
  { week: 12, days: [
    { day: 1, segments: [warmup, run(25), walk(3), run(15), cooldown] },          // page 21: 25R+3W+15R
    { day: 2, segments: [warmup, run(30), walk(5), run(15), cooldown] },          // page 22: 30R+5W+15R
    { day: 3, segments: [warmup, run(30), walk(3), run(15), cooldown] },          // page 23: 30R+3W+15R
  ]},
  // Week 13: PDF pages 24-26
  { week: 13, days: [
    { day: 1, segments: [warmup, run(30), walk(2), run(15), cooldown] },          // page 24: 30R+2W+15R
    { day: 2, segments: [warmup, run(35), walk(2), run(10), cooldown] },          // page 25: 35R+2W+10R
    { day: 3, segments: [warmup, run(40), walk(2), run(10), cooldown] },          // page 26: 40R+2W+10R
  ]},
  // Week 14: PDF pages 27-29
  { week: 14, days: [
    { day: 1, segments: [warmup, run(50), cooldown] },                            // page 27: 50R
    { day: 2, segments: [warmup, run(55), cooldown] },                            // page 28: 55R
    { day: 3, segments: [warmup, run(60), cooldown] },                            // page 29: 60R
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
    { day: 1, segments: [warmup, run(20), cooldown] }, // recovery
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
    { day: 1, segments: [warmup, run(30), cooldown] }, // recovery
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
    { day: 1, segments: [warmup, run(40), cooldown] }, // taper
    { day: 2, segments: [warmup, run(30), cooldown] },
    { day: 3, segments: [warmup, run(20), cooldown] },
  ]},
  { week: 20, days: [
    { day: 1, segments: [warmup, run(20), cooldown] }, // race week
    { day: 2, segments: [warmup, run(15), cooldown] },
    { day: 3, segments: [warmup, run(110), cooldown] }, // ~half marathon
  ]},
]

// ─── EXPORTS ────────────────────────────────────────────────────────
export const programs: Record<GoalKey, ProgramWeek[]> = {
  '5k': program5k,
  '10k': program10k,
  '21k': program21k,
}

export const goalMeta: Record<GoalKey, { label: string; weeks: number; color: string; emoji: string; description: string }> = {
  '5k':  { label: '5K',            weeks: 9,  color: '#2ECC71', emoji: '🟢', description: 'Run your first 5K in 9 weeks' },
  '10k': { label: '10K',           weeks: 14, color: '#3498DB', emoji: '🔵', description: 'Build to 10K in 14 weeks' },
  '21k': { label: 'Half Marathon', weeks: 20, color: '#9B59B6', emoji: '🟣', description: 'Conquer 21K in 20 weeks' },
}