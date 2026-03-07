import { useState, useEffect } from 'react'
import { GoalKey } from '../data/index'

export interface WorkoutRecord {
  id: string
  goal: GoalKey
  week: number
  day: number
  date: string            // ISO date string
  totalSeconds: number    // actual time spent (from elapsed timer)
  totalMinutes: number    // program duration
  runMinutes: number      // sum of run segments
  walkMinutes: number     // sum of walk segments
  segments: number        // number of segments completed
  source: 'app' | 'apple' // app = completed in RunUp, apple = imported
  // Apple Health extras
  heartRateAvg?: number
  heartRateMax?: number
  calories?: number
  distanceKm?: number
  pace?: string           // e.g. "5:30/km"
}

interface ProgressStore {
  profileName: string
  activeGoal: GoalKey | null
  completed: {
    '5k': string[]
    '10k': string[]
    '21k': string[]
  }
  workouts: WorkoutRecord[]
}

const DEFAULT_STORE: ProgressStore = {
  profileName: '',
  activeGoal: null,
  completed: { '5k': [], '10k': [], '21k': [] },
  workouts: [],
}

function loadStore(): ProgressStore {
  try {
    const raw = localStorage.getItem('runup_progress')
    if (!raw) return DEFAULT_STORE
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_STORE, ...parsed, workouts: parsed.workouts ?? [] }
  } catch {
    return DEFAULT_STORE
  }
}

function saveStore(store: ProgressStore) {
  localStorage.setItem('runup_progress', JSON.stringify(store))
}

export function dayKey(week: number, day: number) {
  return `w${week}d${day}`
}

export function useProgress() {
  const [store, setStore] = useState<ProgressStore>(loadStore)

  useEffect(() => {
    saveStore(store)
  }, [store])

  const setProfileName = (name: string) => {
    setStore(s => ({ ...s, profileName: name }))
  }

  const setActiveGoal = (goal: GoalKey) => {
    setStore(s => ({ ...s, activeGoal: goal }))
  }

  const markComplete = (
    goal: GoalKey,
    week: number,
    day: number,
    record?: Omit<WorkoutRecord, 'id' | 'goal' | 'week' | 'day' | 'date' | 'source'>
  ) => {
    const key = dayKey(week, day)
    const newRecord: WorkoutRecord = {
      id: `${goal}-${key}-${Date.now()}`,
      goal,
      week,
      day,
      date: new Date().toISOString(),
      source: 'app',
      totalSeconds: record?.totalSeconds ?? 0,
      totalMinutes: record?.totalMinutes ?? 0,
      runMinutes: record?.runMinutes ?? 0,
      walkMinutes: record?.walkMinutes ?? 0,
      segments: record?.segments ?? 0,
    }
    setStore(s => ({
      ...s,
      completed: {
        ...s.completed,
        [goal]: s.completed[goal].includes(key)
          ? s.completed[goal]
          : [...s.completed[goal], key],
      },
      workouts: [
        ...s.workouts.filter(w => !(w.goal === goal && w.week === week && w.day === day && w.source === 'app')),
        newRecord,
      ],
    }))
  }

  const addAppleWorkout = (record: Omit<WorkoutRecord, 'id' | 'source'>) => {
    const newRecord: WorkoutRecord = {
      ...record,
      id: `apple-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      source: 'apple',
    }
    setStore(s => ({ ...s, workouts: [...s.workouts, newRecord] }))
  }

  const removeWorkout = (id: string) => {
    setStore(s => ({ ...s, workouts: s.workouts.filter(w => w.id !== id) }))
  }

  const isComplete = (goal: GoalKey, week: number, day: number) => {
    return store.completed[goal].includes(dayKey(week, day))
  }

  const getNextWorkout = (goal: GoalKey, totalWeeks: number) => {
    for (let w = 1; w <= totalWeeks; w++) {
      for (let d = 1; d <= 3; d++) {
        if (!isComplete(goal, w, d)) return { week: w, day: d }
      }
    }
    return null
  }

  const resetGoal = (goal: GoalKey) => {
    setStore(s => ({
      ...s,
      completed: { ...s.completed, [goal]: [] },
    }))
  }

  // ─── Dashboard helpers ───────────────────────────────────────────
  const getRecentWorkouts = (limit = 10): WorkoutRecord[] => {
    return [...store.workouts]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)
  }

  const getWeeklyWorkouts = (): WorkoutRecord[][] => {
    const weeks: WorkoutRecord[][] = Array.from({ length: 7 }, () => [])
    const now = new Date()
    store.workouts.forEach(w => {
      const d = new Date(w.date)
      const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
      if (diffDays >= 0 && diffDays < 7) {
        const dayIdx = 6 - diffDays
        weeks[dayIdx].push(w)
      }
    })
    return weeks
  }

  const getTotalStats = () => {
    const all = store.workouts
    const totalWorkouts = all.length
    const totalRunMins = all.reduce((a, w) => a + w.runMinutes, 0)
    const totalDistKm = all.reduce((a, w) => a + (w.distanceKm ?? w.runMinutes * 0.13), 0)
    const avgHeartRate = all.filter(w => w.heartRateAvg).length > 0
      ? Math.round(all.filter(w => w.heartRateAvg).reduce((a, w) => a + (w.heartRateAvg ?? 0), 0) / all.filter(w => w.heartRateAvg).length)
      : null
    const totalCalories = all.reduce((a, w) => a + (w.calories ?? 0), 0)
    const currentStreak = calcStreak(all)
    return { totalWorkouts, totalRunMins, totalDistKm, avgHeartRate, totalCalories, currentStreak }
  }

  return {
    profileName: store.profileName,
    activeGoal: store.activeGoal,
    workouts: store.workouts,
    setProfileName,
    setActiveGoal,
    markComplete,
    addAppleWorkout,
    removeWorkout,
    isComplete,
    getNextWorkout,
    resetGoal,
    getRecentWorkouts,
    getWeeklyWorkouts,
    getTotalStats,
  }
}

function calcStreak(workouts: WorkoutRecord[]): number {
  if (!workouts.length) return 0
  const days = new Set(workouts.map(w => w.date.slice(0, 10)))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    if (days.has(d.toISOString().slice(0, 10))) {
      streak++
    } else if (i > 0) {
      break
    }
  }
  return streak
}