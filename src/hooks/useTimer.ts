import { useState, useEffect, useRef, useCallback } from 'react'
import { Segment } from '../data/index'
import { useAudio } from './useAudio'

export function useTimer(segments: Segment[], onComplete: () => void) {
  const [segmentIndex, setSegmentIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(segments[0]?.duration ?? 0)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const { announceSegment, announceCountdown, announceFinish } = useAudio()

  // Wall-clock refs — these never go stale in the interval callback
  const segmentIndexRef  = useRef(0)
  const segmentStartRef  = useRef<number | null>(null) // Date.now() when segment started
  const segmentDurRef    = useRef(segments[0]?.duration ?? 0) // full duration of current segment
  const isRunningRef     = useRef(false)
  const tickRef          = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownFiredRef = useRef(false) // prevent duplicate countdown beeps

  segmentIndexRef.current = segmentIndex
  isRunningRef.current = isRunning

  const clearTick = () => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null }
  }

  const goToSegment = useCallback((index: number, running: boolean) => {
    const next = segments[index]
    if (!next) {
      clearTick()
      setIsFinished(true)
      setIsRunning(false)
      isRunningRef.current = false
      announceFinish()
      onComplete()
      return
    }
    segmentIndexRef.current = index
    segmentDurRef.current = next.duration
    segmentStartRef.current = running ? Date.now() : null
    countdownFiredRef.current = false
    setSegmentIndex(index)
    setTimeLeft(next.duration)
    if (running) announceSegment(next.type, next.duration)
  }, [segments, announceSegment, announceFinish, onComplete])

  // Single interval — derives timeLeft from wall clock, never drifts
  useEffect(() => {
    if (!isRunning) { clearTick(); return }

    // Stamp start time when we begin/resume
    if (!segmentStartRef.current) {
      segmentStartRef.current = Date.now()
    }

    tickRef.current = setInterval(() => {
      if (!segmentStartRef.current) return

      const elapsedSecs = (Date.now() - segmentStartRef.current) / 1000
      const remaining = Math.max(0, segmentDurRef.current - elapsedSecs)
      const remainingInt = Math.ceil(remaining)

      // Countdown beeps (once, when crossing 4s)
      if (remainingInt <= 4 && remainingInt > 0 && !countdownFiredRef.current) {
        countdownFiredRef.current = true
        announceCountdown()
      }

      if (remaining <= 0) {
        // Advance to next segment
        goToSegment(segmentIndexRef.current + 1, true)
      } else {
        setTimeLeft(remainingInt)
      }
    }, 250) // tick every 250ms for snappier UI, still lightweight

    return clearTick
  }, [isRunning, goToSegment, announceCountdown])

  // Handle tab visibility — recalculate immediately when tab becomes visible
  useEffect(() => {
    const onVisible = () => {
      if (!isRunningRef.current || !segmentStartRef.current) return
      const elapsedSecs = (Date.now() - segmentStartRef.current) / 1000
      const remaining = Math.max(0, segmentDurRef.current - elapsedSecs)
      if (remaining <= 0) {
        goToSegment(segmentIndexRef.current + 1, true)
      } else {
        setTimeLeft(Math.ceil(remaining))
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [goToSegment])

  const start = () => {
    segmentStartRef.current = Date.now()
    countdownFiredRef.current = false
    announceSegment(segments[0].type, segments[0].duration)
    setIsRunning(true)
  }

  const pause = () => {
    // Save remaining time so resume picks up exactly here
    if (segmentStartRef.current) {
      const elapsed = (Date.now() - segmentStartRef.current) / 1000
      const remaining = Math.max(0, segmentDurRef.current - elapsed)
      segmentDurRef.current = remaining       // treat remaining as the new full duration
      segmentStartRef.current = null          // clear start so resume re-stamps it
      setTimeLeft(Math.ceil(remaining))
    }
    setIsRunning(false)
  }

  const resume = () => {
    segmentStartRef.current = Date.now()      // re-stamp from now
    countdownFiredRef.current = segmentDurRef.current <= 4 // don't re-fire if already past countdown
    setIsRunning(true)
  }

  const reset = () => {
    clearTick()
    segmentIndexRef.current = 0
    segmentDurRef.current = segments[0]?.duration ?? 0
    segmentStartRef.current = null
    countdownFiredRef.current = false
    setIsRunning(false)
    setIsFinished(false)
    setSegmentIndex(0)
    setTimeLeft(segments[0]?.duration ?? 0)
  }

  const skipNext = () => {
    clearTick()
    const nextIndex = segmentIndexRef.current + 1
    goToSegment(nextIndex, isRunningRef.current)
    if (isRunningRef.current) setIsRunning(r => r) // re-trigger interval effect
  }

  const skipPrev = () => {
    clearTick()
    const prevIndex = Math.max(0, segmentIndexRef.current - 1)
    goToSegment(prevIndex, isRunningRef.current)
    if (isRunningRef.current) setIsRunning(r => r)
  }

  const totalDuration = segments.reduce((a, s) => a + s.duration, 0)
  const elapsed =
    segments.slice(0, segmentIndex).reduce((a, s) => a + s.duration, 0) +
    ((segments[segmentIndex]?.duration ?? 0) - timeLeft)
  const progress = totalDuration > 0 ? elapsed / totalDuration : 0

  return {
    currentSegment: segments[segmentIndex],
    segmentIndex,
    timeLeft,
    isRunning,
    isFinished,
    progress,
    start,
    pause,
    resume,
    reset,
    skipNext,
    skipPrev,
  }
}