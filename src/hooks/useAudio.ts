// Single shared AudioContext for all sounds — avoids iOS session conflicts
let audioCtx: AudioContext | null = null
let wavBuffer: AudioBuffer | null = null
let iosUnlocked = false

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

// Pre-load the WAV into an AudioBuffer so it plays through AudioContext
async function loadWav(src: string) {
  if (wavBuffer) return
  try {
    const ctx = getCtx()
    const res = await fetch(src)
    const arrayBuffer = await res.arrayBuffer()
    wavBuffer = await ctx.decodeAudioData(arrayBuffer)
  } catch (e) {
    console.warn('WAV preload failed', e)
  }
}

function playBuffer(buffer: AudioBuffer, onEnded?: () => void) {
  try {
    const ctx = getCtx()
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    if (onEnded) source.addEventListener('ended', onEnded)
    source.start(0)
  } catch (e) {
    console.warn('Buffer play failed', e)
    if (onEnded) setTimeout(onEnded, 500)
  }
}

// Call on START button tap — unlocks AudioContext on iOS
export function unlockAudio() {
  if (iosUnlocked) return
  try {
    const ctx = getCtx()
    // Resume suspended context
    if (ctx.state === 'suspended') ctx.resume()
    // Play a silent buffer — this is the iOS unlock gesture trick
    const buf = ctx.createBuffer(1, 1, 22050)
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(ctx.destination)
    src.start(0)
    // Preload WAV now while we have the user gesture
    loadWav('/Alarm06.wav')
    iosUnlocked = true
  } catch (e) {
    console.warn('Audio unlock failed', e)
  }
}

export function useAudio() {
  const beep = (frequency = 880, duration = 200) => {
    try {
      const ctx = getCtx()
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
      console.warn('Beep failed', e)
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
      console.warn('Speech failed', e)
    }
  }

  // Fires at END of segment — WAV (via AudioContext) then voice
  const announceSegmentEnd = (type: string) => {
    const messages: Record<string, string> = {
      warmup:   'Warm up done.',
      run:      'Run complete.',
      walk:     'Walk done.',
      cooldown: 'Cool down complete.',
    }
    const announce = () => speak(messages[type] ?? 'Segment done.')
    if (wavBuffer) {
      playBuffer(wavBuffer, announce)
    } else {
      // WAV not loaded yet — fallback to beeps
      beep(880, 150)
      setTimeout(() => beep(660, 250), 180)
      setTimeout(announce, 600)
    }
  }

  // Fires at START of segment — beep + voice
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