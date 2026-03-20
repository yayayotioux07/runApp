export function useAudio() {
  const beep = (frequency = 880, duration = 200) => {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = frequency
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + duration / 1000)
    } catch (e) {
      console.warn('Audio not available', e)
    }
  }

  const speak = (text: string) => {
    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.95
      utterance.pitch = 1
      utterance.volume = 1
      window.speechSynthesis.speak(utterance)
    } catch (e) {
      console.warn('Speech not available', e)
    }
  }

  // Fires at the END of a segment — two descending beeps
  const announceSegmentEnd = (type: string) => {
    const messages: Record<string, string> = {
      warmup:   'Warm up done.',
      run:      'Run complete.',
      walk:     'Walk done.',
      cooldown: 'Cool down complete.',
    }
    beep(880, 150)
    setTimeout(() => beep(660, 250), 180)
    setTimeout(() => speak(messages[type] ?? 'Segment done.'), 500)
  }

  // Fires at the START of a segment — single beep + voice
  const announceSegment = (type: string, duration: number) => {
    const mins = Math.floor(duration / 60)
    const secs = duration % 60
    const timeStr = mins > 0
      ? `${mins} minute${mins > 1 ? 's' : ''}${secs > 0 ? ` ${secs} seconds` : ''}`
      : `${secs} seconds`

    const messages: Record<string, string> = {
      warmup:   `Starting warm up. ${timeStr}.`,
      run:      `Time to run! ${timeStr}.`,
      walk:     `Walk now. ${timeStr} to recover.`,
      cooldown: `Almost done. Cool down for ${timeStr}.`,
    }

    beep(type === 'run' ? 1046 : 523, 300)
    setTimeout(() => speak(messages[type] ?? `Next up: ${type}`), 400)
  }

  const announceCountdown = () => {
    beep(660, 150)
    speak('Get ready')
  }

  const announceFinish = () => {
    beep(1046, 200)
    setTimeout(() => beep(1318, 200), 250)
    setTimeout(() => beep(1568, 400), 500)
    setTimeout(() => speak('Workout complete! Great job!'), 800)
  }

  return { beep, speak, announceSegment, announceSegmentEnd, announceCountdown, announceFinish }
}