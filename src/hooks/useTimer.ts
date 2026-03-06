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

  const currentSegment = segments[segmentIndex]

  const clearTick = () => {
    if (tickRef.current) clearInterval(tickRef.current)
  }

  const advanceSegment = useCallback((index: number) => {
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
    announceSegment(next.type, next.duration)
  }, [segments, announceSegment, announceFinish, onComplete])

  useEffect(() => {
    if (!isRunning) { clearTick(); return }

    tickRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 4 && prev > 1) announceCountdown()
        if (prev <= 1) {
          advanceSegment(segmentIndexRef.current + 1)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return clearTick
  }, [isRunning, advanceSegment, announceCountdown])

  const start = () => {
    announceSegment(currentSegment.type, currentSegment.duration)
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

  const totalDuration = segments.reduce((a, s) => a + s.duration, 0)
  const elapsed =
    segments.slice(0, segmentIndex).reduce((a, s) => a + s.duration, 0) +
    (currentSegment ? currentSegment.duration - timeLeft : 0)
  const progress = totalDuration > 0 ? elapsed / totalDuration : 0

  return {
    currentSegment,
    segmentIndex,
    timeLeft,
    isRunning,
    isFinished,
    progress,
    start,
    pause,
    resume,
    reset,
  }
}
