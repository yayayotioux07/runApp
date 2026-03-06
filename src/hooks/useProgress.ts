import { useState, useEffect } from 'react'
import { GoalKey } from '../data/index'

interface ProgressStore {
  profileName: string
  activeGoal: GoalKey | null
  completed: {
    '5k': string[]
    '10k': string[]
    '21k': string[]
  }
}

const DEFAULT_STORE: ProgressStore = {
  profileName: '',
  activeGoal: null,
  completed: { '5k': [], '10k': [], '21k': [] },
}

function loadStore(): ProgressStore {
  try {
    const raw = localStorage.getItem('runup_progress')
    return raw ? { ...DEFAULT_STORE, ...JSON.parse(raw) } : DEFAULT_STORE
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

  const markComplete = (goal: GoalKey, week: number, day: number) => {
    const key = dayKey(week, day)
    setStore(s => ({
      ...s,
      completed: {
        ...s.completed,
        [goal]: s.completed[goal].includes(key)
          ? s.completed[goal]
          : [...s.completed[goal], key],
      },
    }))
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

  return {
    profileName: store.profileName,
    activeGoal: store.activeGoal,
    setProfileName,
    setActiveGoal,
    markComplete,
    isComplete,
    getNextWorkout,
    resetGoal,
  }
}
