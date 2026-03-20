// iOS requires audio to be unlocked by a direct user gesture.
// We pre-unlock both AudioContext and HTMLAudio on the first tap.

let audioCtx: AudioContext | null = null
let iosUnlocked = false

function getAudioContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

// Call this once on the START button tap — unlocks all audio on iOS
export function unlockAudio() {
  if (iosUnlocked) return
  try {
    // Unlock AudioContext
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()

    // Unlock HTMLAudio by playing a silent buffer
    const silent = new Audio('/Alarm06.wav')
    silent.volume = 0
    silent.play().then(() => { silent.pause(); silent.currentTime = 0 }).catch(() => {})

    iosUnlocked = true
  } catch (e) {
    console.warn('Audio unlock failed', e)
  }
}

export function useAudio() {
  const beep = (frequency = 880, duration = 200) => {
    try {
      const ctx = getAudioContext()
      if (ctx.state === 'suspended') ctx.resume()
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

  const playWav = (src: string, onEnded?: () => void) => {
    try {
      const audio = new Audio(src)
      audio.volume = 1
      if (onEnded) audio.addEventListener('ended', onEnded)
      const ctx = getAudioContext()
      if (ctx.state === 'suspended') ctx.resume()
      audio.play().catch(e => {
        console.warn('WAV play failed', e)
        // Fallback: still call onEnded so voice fires
        if (onEnded) setTimeout(onEnded, 500)
      })
    } catch (e) {
      console.warn('WAV not available', e)
      if (onEnded) setTimeout(onEnded, 500)
    }
  }

  // Fires at the END of a segment — WAV then voice
  const announceSegmentEnd = (type: string) => {
    const messages: Record<string, string> = {
      warmup:   'Warm up done.',
      run:      'Run complete.',
      walk:     'Walk done.',
      cooldown: 'Cool down complete.',
    }
    playWav('/Alarm06.wav', () => speak(messages[type] ?? 'Segment done.'))
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