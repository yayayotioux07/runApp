import { useState, useEffect, useRef, useCallback } from 'react'
import { Segment } from '../data/index'
import { useAudio } from './useAudio'

export function useTimer(segments: Segment[], onComplete: () => void) {
  const [segmentIndex, setSegmentIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(segments[0]?.duration ?? 0)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const { announceSegment, announceCountdown, announceFinish } = useAudio()
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const segmentIndexRef = useRef(segmentIndex)
  segmentIndexRef.current = segmentIndex

  const clearTick = () => {
    if (tickRef.current) clearInterval(tickRef.current)
  }

  const goToSegment = useCallback((index: number, running: boolean) => {
    const next = segments[index]
    if (!next) {
      setIsFinished(true)
      setIsRunning(false)
      announceFinish()
      onComplete()
      return
    }
    setSegmentIndex(index)
    setTimeLeft(next.duration)
    if (running) announceSegment(next.type, next.duration)
  }, [segments, announceSegment, announceFinish, onComplete])

  useEffect(() => {
    if (!isRunning) { clearTick(); return }
    tickRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 4 && prev > 1) announceCountdown()
        if (prev <= 1) {
          goToSegment(segmentIndexRef.current + 1, true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return clearTick
  }, [isRunning, goToSegment, announceCountdown])

  const start = () => {
    announceSegment(segments[0].type, segments[0].duration)
    setIsRunning(true)
  }

  const pause  = () => setIsRunning(false)
  const resume = () => setIsRunning(true)

  const reset = () => {
    clearTick()
    setIsRunning(false)
    setIsFinished(false)
    setSegmentIndex(0)
    setTimeLeft(segments[0]?.duration ?? 0)
  }

  const skipNext = () => {
    clearTick()
    const nextIndex = segmentIndexRef.current + 1
    goToSegment(nextIndex, isRunning)
    if (isRunning) {
      // restart tick after state update
      setTimeout(() => setIsRunning(r => r), 0)
    }
  }

  const skipPrev = () => {
    clearTick()
    const prevIndex = Math.max(0, segmentIndexRef.current - 1)
    goToSegment(prevIndex, isRunning)
    if (isRunning) {
      setTimeout(() => setIsRunning(r => r), 0)
    }
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