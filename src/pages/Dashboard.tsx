import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgress, WorkoutRecord } from '../hooks/useProgress'
import { GoalKey, goalMeta } from '../data/index'

// ─── Helpers ────────────────────────────────────────────────────────
function fmt(n: number, dec = 1) { return n.toFixed(dec) }
function fmtMins(m: number) {
  if (m < 60) return `${Math.round(m)}m`
  return `${Math.floor(m / 60)}h ${Math.round(m % 60)}m`
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function dayName(daysAgo: number) {
  const d = new Date(); d.setDate(d.getDate() - daysAgo)
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

const goalColors: Record<GoalKey, string> = {
  '5k': '#2ECC71', '10k': '#3498DB', '21k': '#9B59B6'
}
const sourceColors = { app: '#2ECC71', apple: '#FF6B6B' }

// ─── Apple Import Form ───────────────────────────────────────────────
// ─── Apple XML Parser ────────────────────────────────────────────────
interface ParsedAppleWorkout {
  date: string
  totalMinutes: number
  totalSeconds: number
  distanceKm?: number
  calories?: number
  heartRateAvg?: number
  heartRateMax?: number
  pace?: string
  workoutType: string
}

// ─── Streaming Apple Health XML Parser ──────────────────────────────
// Reads the file in 1MB chunks, never loads the whole thing into memory.
// Extracts only <Workout> blocks and nearby <Record type="HeartRate"> nodes.

function parseWorkoutBlock(block: string): ParsedAppleWorkout | null {
  const attr = (name: string) => {
    const m = block.match(new RegExp(`${name}="([^"]*)"`, 'i'))
    return m ? m[1] : null
  }

  const type = attr('workoutActivityType') ?? ''
  const isRunning = type.includes('Running')
  const isWalking = type.includes('Walking')
  if (!isRunning && !isWalking) return null

  const startRaw  = attr('startDate')
  const endRaw    = attr('endDate')
  const durRaw    = parseFloat(attr('duration') ?? '0')
  const durUnit   = (attr('durationUnit') ?? 'min').toLowerCase()
  const totalMins = durUnit.startsWith('s') ? durRaw / 60
    : durUnit.startsWith('h') ? durRaw * 60
    : durRaw

  if (totalMins < 4) return null

  // Distance
  let distanceKm: number | undefined
  const distMatch = block.match(
    /WorkoutStatistics[^>]*type="HKQuantityTypeIdentifier(?:DistanceWalkingRunning|DistanceRunning)"[^>]*/i
  )
  if (distMatch) {
    const sumM = distMatch[0].match(/sum="([^"]+)"/)
    const unitM = distMatch[0].match(/unit="([^"]+)"/)
    if (sumM) {
      const val = parseFloat(sumM[1])
      const unit = (unitM?.[1] ?? 'km').toLowerCase()
      distanceKm = unit.includes('mi') ? val * 1.60934 : val
      if (distanceKm) distanceKm = Math.round(distanceKm * 100) / 100
    }
  }

  // Calories
  let calories: number | undefined
  const calMatch = block.match(
    /WorkoutStatistics[^>]*type="HKQuantityTypeIdentifierActiveEnergyBurned"[^>]*/i
  )
  if (calMatch) {
    const sumM = calMatch[0].match(/sum="([^"]+)"/)
    if (sumM) calories = Math.round(parseFloat(sumM[1]))
  }

  // Heart rate from WorkoutStatistics
  let heartRateAvg: number | undefined
  let heartRateMax: number | undefined
  const hrMatch = block.match(
    /WorkoutStatistics[^>]*type="HKQuantityTypeIdentifierHeartRate"[^>]*/i
  )
  if (hrMatch) {
    const avgM = hrMatch[0].match(/average="([^"]+)"/)
    const maxM = hrMatch[0].match(/maximum="([^"]+)"/)
    if (avgM && parseFloat(avgM[1]) > 0) heartRateAvg = Math.round(parseFloat(avgM[1]))
    if (maxM && parseFloat(maxM[1]) > 0) heartRateMax = Math.round(parseFloat(maxM[1]))
  }

  // Pace
  let pace: string | undefined
  if (distanceKm && distanceKm > 0.1) {
    const secsPerKm = (totalMins * 60) / distanceKm
    const pMin = Math.floor(secsPerKm / 60)
    const pSec = Math.round(secsPerKm % 60)
    if (pMin < 30) pace = `${pMin}:${String(pSec).padStart(2, '0')}/km`
  }

  return {
    date: startRaw ? new Date(startRaw).toISOString() : new Date().toISOString(),
    totalMinutes: Math.round(totalMins),
    totalSeconds: Math.round(totalMins * 60),
    distanceKm,
    calories,
    heartRateAvg,
    heartRateMax,
    pace,
    workoutType: isRunning ? 'Running' : 'Walking',
  }
}

// Stream file in 2MB chunks, stitch across boundaries, extract Workout blocks
async function streamParseAppleHealthXML(
  file: File,
  onProgress: (pct: number) => void
): Promise<ParsedAppleWorkout[]> {
  const CHUNK = 2 * 1024 * 1024 // 2MB
  const results: ParsedAppleWorkout[] = []
  let buffer = ''
  let offset = 0

  while (offset < file.size) {
    const blob = file.slice(offset, offset + CHUNK)
    const text = await blob.text()
    buffer += text
    offset += CHUNK
    onProgress(Math.min(Math.round((offset / file.size) * 100), 99))

    // Extract complete <Workout ...> blocks (self-closing or with children)
    // We look for <Workout until </Workout> or />
    let searchFrom = 0
    while (true) {
      const start = buffer.indexOf('<Workout ', searchFrom)
      if (start === -1) {
        // Keep last 4KB in case a workout block straddles chunks
        buffer = buffer.slice(Math.max(0, buffer.length - 4096))
        break
      }

      // Find end of this workout block
      const selfClose = buffer.indexOf('/>', start)
      const closeTag  = buffer.indexOf('</Workout>', start)

      let blockEnd: number
      let blockText: string

      if (selfClose !== -1 && (closeTag === -1 || selfClose < closeTag)) {
        blockEnd  = selfClose + 2
        blockText = buffer.slice(start, blockEnd)
      } else if (closeTag !== -1) {
        blockEnd  = closeTag + 10
        blockText = buffer.slice(start, blockEnd)
      } else {
        // Block not complete yet — keep from start and wait for next chunk
        buffer = buffer.slice(start)
        break
      }

      const workout = parseWorkoutBlock(blockText)
      if (workout) results.push(workout)
      searchFrom = blockEnd
    }

    // Yield to UI thread so progress bar can update
    await new Promise(r => setTimeout(r, 0))
  }

  onProgress(100)
  return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// ─── Import Panel ────────────────────────────────────────────────────
function AppleImportPanel({ onAdd, onClose }: { onAdd: (r: Omit<WorkoutRecord, 'id' | 'source'>) => void; onClose: () => void }) {
  const [tab, setTab] = useState<'xml' | 'manual'>('xml')

  // XML tab state
  const [xmlState, setXmlState] = useState<'idle' | 'parsing' | 'done' | 'error'>('idle')
  const [parsedWorkouts, setParsedWorkouts] = useState<ParsedAppleWorkout[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [xmlGoal, setXmlGoal] = useState<GoalKey>('10k')
  const [errorMsg, setErrorMsg] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [parseProgress, setParseProgress] = useState(0)

  const handleFile = async (file: File) => {
    if (file.name.endsWith('.zip')) {
      setXmlState('error')
      setErrorMsg('Please unzip the file first and select export.xml inside the apple_health_export folder.')
      return
    }
    if (!file.name.endsWith('.xml')) {
      setXmlState('error')
      setErrorMsg('Please select the export.xml file from Apple Health.')
      return
    }
    setXmlState('parsing')
    setParseProgress(0)
    setErrorMsg('')
    try {
      const results = await streamParseAppleHealthXML(file, setParseProgress)
      if (results.length === 0) {
        setXmlState('error')
        setErrorMsg('No running or walking workouts found. Make sure you selected export.xml (inside the apple_health_export folder after unzipping).')
        return
      }
      setParsedWorkouts(results)
      setSelectedIds(new Set(results.map((_, i) => i)))
      setXmlState('done')
    } catch {
      setXmlState('error')
      setErrorMsg('Could not parse the file. Please make sure it\'s the export.xml from Apple Health.')
    }
  }


  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const toggleSelect = (i: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const importSelected = () => {
    let weekCounter = 1; let dayCounter = 1
    parsedWorkouts.forEach((w, i) => {
      if (!selectedIds.has(i)) return
      onAdd({
        goal: xmlGoal,
        week: weekCounter,
        day: dayCounter,
        date: w.date,
        totalSeconds: w.totalSeconds,
        totalMinutes: w.totalMinutes,
        runMinutes: w.workoutType === 'Running' ? w.totalMinutes : 0,
        walkMinutes: w.workoutType === 'Walking' ? w.totalMinutes : 0,
        segments: 3,
        distanceKm: w.distanceKm,
        heartRateAvg: w.heartRateAvg,
        heartRateMax: w.heartRateMax,
        calories: w.calories,
        pace: w.pace,
      })
      dayCounter++
      if (dayCounter > 3) { dayCounter = 1; weekCounter++ }
    })
    onClose()
  }

  const submitManual = () => {
    if (!form.totalMinutes) return
    onAdd({
      goal: form.goal,
      week: parseInt(form.week),
      day: parseInt(form.day),
      date: new Date(form.date).toISOString(),
      totalSeconds: parseFloat(form.totalMinutes) * 60,
      totalMinutes: parseFloat(form.totalMinutes),
      runMinutes: parseFloat(form.runMinutes || form.totalMinutes),
      walkMinutes: parseFloat(form.walkMinutes || '0'),
      segments: 3,
      distanceKm: form.distanceKm ? parseFloat(form.distanceKm) : undefined,
      heartRateAvg: form.heartRateAvg ? parseInt(form.heartRateAvg) : undefined,
      heartRateMax: form.heartRateMax ? parseInt(form.heartRateMax) : undefined,
      calories: form.calories ? parseInt(form.calories) : undefined,
      pace: form.pace || undefined,
    })
    onClose()
  }

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.panel, maxWidth: 620 }}>
        {/* Header */}
        <div style={styles.panelHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🍎</span>
            <span style={{ fontWeight: 800, fontSize: 17, color: '#fff' }}>Apple Health Import</span>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid #222' }}>
          {([['xml', '📁 Export File'], ['manual', '✏️ Manual Entry']] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 13, fontWeight: 700, padding: '8px 18px',
              color: tab === t ? '#fff' : '#555',
              borderBottom: tab === t ? '2px solid #FF6B6B' : '2px solid transparent',
              marginBottom: -1,
            }}>{label}</button>
          ))}
        </div>

        {/* ── XML Tab ── */}
        {tab === 'xml' && (
          <div>
            {/* Instructions */}
            <div style={{ background: '#0D0D0D', border: '1px solid #1f1f1f', borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <p style={{ color: '#888', fontSize: 13, margin: '0 0 10px', fontWeight: 700 }}>How to export from Apple Health:</p>
              <ol style={{ color: '#666', fontSize: 12, lineHeight: 1.8, margin: 0, paddingLeft: 18 }}>
                <li>Open the <strong style={{ color: '#ccc' }}>Health</strong> app on your iPhone</li>
                <li>Tap your <strong style={{ color: '#ccc' }}>profile photo</strong> (top right)</li>
                <li>Scroll down → tap <strong style={{ color: '#ccc' }}>"Export All Health Data"</strong></li>
                <li>Share the ZIP to your computer, then <strong style={{ color: '#ccc' }}>unzip it</strong></li>
                <li>Upload the <strong style={{ color: '#FF6B6B' }}>export.xml</strong> file below</li>
              </ol>
            </div>

            {/* Drop zone */}
            {xmlState === 'idle' || xmlState === 'error' ? (
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                style={{
                  border: `2px dashed ${dragOver ? '#FF6B6B' : '#2a2a2a'}`,
                  borderRadius: 14, padding: '32px 20px', textAlign: 'center',
                  background: dragOver ? '#FF6B6B08' : '#0D0D0D',
                  transition: 'all 0.2s', cursor: 'pointer',
                }}
                onClick={() => document.getElementById('xml-file-input')?.click()}
              >
                <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                  Drop export.xml here
                </div>
                <div style={{ color: '#555', fontSize: 12, marginBottom: 16 }}>
                  or click to browse files
                </div>
                <input
                  id="xml-file-input"
                  type="file"
                  accept=".xml"
                  style={{ display: 'none' }}
                  onChange={handleFileInput}
                />
                <div style={{ ...styles.btn, display: 'inline-block', background: '#FF6B6B', fontSize: 13, padding: '8px 20px' }}>
                  Choose File
                </div>
                {xmlState === 'error' && (
                  <div style={{ color: '#FF6B6B', fontSize: 12, marginTop: 14, lineHeight: 1.5 }}>{errorMsg}</div>
                )}
              </div>
            ) : xmlState === 'parsing' ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>⚙️</div>
                <div style={{ color: '#ccc', fontWeight: 700, marginBottom: 6 }}>Scanning your health data...</div>
                <div style={{ color: '#555', fontSize: 12, marginBottom: 20 }}>
                  Reading file in chunks — large exports may take 10–30 seconds
                </div>
                <div style={{ height: 6, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden', margin: '0 auto', maxWidth: 320 }}>
                  <div style={{
                    height: '100%',
                    width: `${parseProgress}%`,
                    background: 'linear-gradient(90deg, #FF6B6B, #FF9A9A)',
                    borderRadius: 3,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
                <div style={{ color: '#444', fontSize: 11, marginTop: 8 }}>{parseProgress}%</div>
              </div>
            ) : (
              // Results
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ color: '#ccc', fontSize: 13 }}>
                    Found <strong style={{ color: '#FF6B6B' }}>{parsedWorkouts.length}</strong> running/walking workouts
                  </span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#555' }}>Assign to:</span>
                    <select value={xmlGoal} onChange={e => setXmlGoal(e.target.value as GoalKey)}
                      style={{ ...styles.input, padding: '4px 8px', fontSize: 12, width: 'auto' }}>
                      <option value="5k">5K</option>
                      <option value="10k">10K</option>
                      <option value="21k">Half Marathon</option>
                    </select>
                  </div>
                </div>

                {/* Select all / none */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <button onClick={() => setSelectedIds(new Set(parsedWorkouts.map((_, i) => i)))}
                    style={{ fontSize: 11, color: '#2ECC71', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Select all
                  </button>
                  <button onClick={() => setSelectedIds(new Set())}
                    style={{ fontSize: 11, color: '#555', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Deselect all
                  </button>
                </div>

                {/* Workout list */}
                <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                  {parsedWorkouts.map((w, i) => (
                    <div key={i}
                      onClick={() => toggleSelect(i)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                        background: selectedIds.has(i) ? '#FF6B6B0D' : '#0D0D0D',
                        border: `1px solid ${selectedIds.has(i) ? '#FF6B6B33' : '#1a1a1a'}`,
                        borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                      }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                        background: selectedIds.has(i) ? '#FF6B6B' : '#1a1a1a',
                        border: `1.5px solid ${selectedIds.has(i) ? '#FF6B6B' : '#333'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, color: '#000', fontWeight: 900,
                      }}>{selectedIds.has(i) ? '✓' : ''}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#fff', fontSize: 13 }}>
                            {w.workoutType} · {w.totalMinutes} min
                          </span>
                          <span style={{ fontSize: 11, color: '#555' }}>
                            {new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
                          {w.distanceKm && <span style={styles.metaChip}>📍 {w.distanceKm}km</span>}
                          {w.heartRateAvg && <span style={styles.metaChip}>❤️ {w.heartRateAvg}bpm</span>}
                          {w.calories && <span style={styles.metaChip}>🔥 {w.calories}cal</span>}
                          {w.pace && <span style={styles.metaChip}>⚡ {w.pace}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => { setXmlState('idle'); setParsedWorkouts([]) }}
                    style={{ ...styles.btn, background: '#222', flex: 1 }}>← Back</button>
                  <button onClick={importSelected}
                    disabled={selectedIds.size === 0}
                    style={{ ...styles.btn, background: selectedIds.size > 0 ? '#FF6B6B' : '#2a2a2a', flex: 2, opacity: selectedIds.size === 0 ? 0.5 : 1 }}>
                    Import {selectedIds.size} Workout{selectedIds.size !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Manual Tab ── */}
        {tab === 'manual' && (
          <div>
            <p style={{ color: '#666', fontSize: 12, marginBottom: 16 }}>
              Manually enter a single workout from your Apple Health or any other source.
            </p>
            <div style={styles.formGrid}>
              <label style={styles.label}>Program
                <select value={form.goal} onChange={setField('goal')} style={styles.input}>
                  <option value="5k">5K</option>
                  <option value="10k">10K</option>
                  <option value="21k">Half Marathon</option>
                </select>
              </label>
              <label style={styles.label}>Date
                <input type="date" value={form.date} onChange={setField('date')} style={styles.input} />
              </label>
              <label style={styles.label}>Week #
                <input type="number" placeholder="e.g. 6" value={form.week} onChange={setField('week')} style={styles.input} min="1" max="20" />
              </label>
              <label style={styles.label}>Day #
                <input type="number" placeholder="1–3" value={form.day} onChange={setField('day')} style={styles.input} min="1" max="3" />
              </label>
              <label style={styles.label}>Total Duration (min) *
                <input type="number" placeholder="e.g. 35" value={form.totalMinutes} onChange={setField('totalMinutes')} style={styles.input} />
              </label>
              <label style={styles.label}>Run Time (min)
                <input type="number" placeholder="e.g. 25" value={form.runMinutes} onChange={setField('runMinutes')} style={styles.input} />
              </label>
              <label style={styles.label}>Distance (km)
                <input type="number" placeholder="e.g. 4.2" value={form.distanceKm} onChange={setField('distanceKm')} style={styles.input} step="0.1" />
              </label>
              <label style={styles.label}>Avg Heart Rate
                <input type="number" placeholder="e.g. 148" value={form.heartRateAvg} onChange={setField('heartRateAvg')} style={styles.input} />
              </label>
              <label style={styles.label}>Max Heart Rate
                <input type="number" placeholder="e.g. 172" value={form.heartRateMax} onChange={setField('heartRateMax')} style={styles.input} />
              </label>
              <label style={styles.label}>Calories
                <input type="number" placeholder="e.g. 320" value={form.calories} onChange={setField('calories')} style={styles.input} />
              </label>
              <label style={styles.label}>Avg Pace (min/km)
                <input type="text" placeholder="e.g. 5:30" value={form.pace} onChange={setField('pace')} style={styles.input} />
              </label>
              <label style={styles.label}>Walk Time (min)
                <input type="number" placeholder="e.g. 5" value={form.walkMinutes} onChange={setField('walkMinutes')} style={styles.input} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={onClose} style={{ ...styles.btn, background: '#222', flex: 1 }}>Cancel</button>
              <button onClick={submitManual} style={{ ...styles.btn, background: '#FF6B6B', flex: 2 }}>
                + Add Workout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, icon }: { label: string; value: string; sub?: string; accent: string; icon: string }) {
  return (
    <div style={{ ...styles.statCard, borderTop: `3px solid ${accent}` }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: accent, fontWeight: 600, marginTop: 3 }}>{sub}</div>}
      <div style={{ fontSize: 11, color: '#666', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    </div>
  )
}

// ─── Weekly Chart ────────────────────────────────────────────────────
function WeeklyChart({ data }: { data: WorkoutRecord[][] }) {
  const maxMins = Math.max(...data.map(d => d.reduce((a, w) => a + w.totalMinutes, 0)), 20)
  return (
    <div style={styles.chartWrap}>
      {data.map((day, i) => {
        const totalMins = day.reduce((a, w) => a + w.totalMinutes, 0)
        const heightPct = totalMins > 0 ? Math.max((totalMins / maxMins) * 100, 8) : 0
        const daysAgo = 6 - i
        const isToday = daysAgo === 0
        const hasApple = day.some(w => w.source === 'apple')
        const hasApp = day.some(w => w.source === 'app')
        return (
          <div key={i} style={styles.chartCol}>
            <div style={styles.chartBarWrap}>
              {totalMins > 0 && (
                <div style={{
                  ...styles.chartBar,
                  height: `${heightPct}%`,
                  background: hasApple && hasApp
                    ? 'linear-gradient(180deg, #FF6B6B, #2ECC71)'
                    : hasApple ? '#FF6B6B' : '#2ECC71',
                  boxShadow: `0 0 12px ${hasApple ? '#FF6B6B55' : '#2ECC7155'}`,
                }}>
                  <span style={styles.chartVal}>{Math.round(totalMins)}m</span>
                </div>
              )}
            </div>
            <div style={{ ...styles.chartDay, color: isToday ? '#2ECC71' : '#555' }}>
              {dayName(daysAgo)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Recent Workouts List ────────────────────────────────────────────
function RecentList({ workouts, onRemove }: { workouts: WorkoutRecord[]; onRemove: (id: string) => void }) {
  if (!workouts.length) return (
    <div style={{ color: '#444', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>
      No workouts yet. Complete a workout or upload your Apple Health XML to get started.
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {workouts.map(w => {
        const color = goalColors[w.goal]
        return (
          <div key={w.id} style={styles.workoutRow}>
            <div style={{ ...styles.goalDot, background: color }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>
                  {goalMeta[w.goal].label} · W{w.week}/D{w.day}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: w.source === 'apple' ? '#FF6B6B' : '#2ECC71',
                  background: w.source === 'apple' ? '#FF6B6B18' : '#2ECC7118',
                  padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase'
                }}>
                  {w.source === 'apple' ? '🍎 Apple' : '▶ RunUp'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <span style={styles.metaChip}>⏱ {fmtMins(w.totalMinutes)}</span>
                {w.distanceKm && <span style={styles.metaChip}>📍 {fmt(w.distanceKm)}km</span>}
                {w.heartRateAvg && <span style={styles.metaChip}>❤️ {w.heartRateAvg}bpm</span>}
                {w.calories && <span style={styles.metaChip}>🔥 {w.calories}cal</span>}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#555' }}>{fmtDate(w.date)}</span>
              <button
                onClick={() => onRemove(w.id)}
                style={{ fontSize: 10, color: '#444', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
              >✕</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Training Zones (from heart rate data) ───────────────────────────
function TrainingZones({ workouts }: { workouts: WorkoutRecord[] }) {
  const withHR = workouts.filter(w => w.heartRateAvg)
  if (!withHR.length) return (
    <div style={{ color: '#444', fontSize: 13, padding: '16px 0' }}>
      No heart rate data. Import Apple Health XML workouts with HR data to see training zones.
    </div>
  )
  const zones = [
    { name: 'VO2 Max', range: '180–200 bpm', color: '#E74C3C', min: 180 },
    { name: 'Anaerobic', range: '160–180 bpm', color: '#E67E22', min: 160 },
    { name: 'Aerobic', range: '140–160 bpm', color: '#2ECC71', min: 140 },
    { name: 'Fat Burn', range: '120–140 bpm', color: '#3498DB', min: 120 },
    { name: 'Recovery', range: '< 120 bpm', color: '#9B59B6', min: 0 },
  ]
  const total = withHR.length
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {zones.map((z, i) => {
        const max = zones[i - 1]?.min ?? 999
        const count = withHR.filter(w => (w.heartRateAvg ?? 0) >= z.min && (w.heartRateAvg ?? 0) < max).length
        const pct = Math.round((count / total) * 100)
        return (
          <div key={z.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: z.color + '22', border: `1px solid ${z.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: z.color, fontWeight: 700 }}>{5 - i}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: '#ccc', fontWeight: 600 }}>{z.name}</span>
                <span style={{ fontSize: 11, color: '#555' }}>{z.range}</span>
              </div>
              <div style={{ height: 4, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: z.color, borderRadius: 2, transition: 'width 0.6s ease' }} />
              </div>
            </div>
            <span style={{ fontSize: 12, color: z.color, fontWeight: 700, width: 32, textAlign: 'right' }}>{pct}%</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Dashboard ──────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const { profileName, workouts, getTotalStats, getRecentWorkouts, getWeeklyWorkouts, removeWorkout, addAppleWorkout } = useProgress()
  const [showImport, setShowImport] = useState(false)
  const [tab, setTab] = useState<'recent' | 'zones'>('recent')

  const stats = useMemo(() => getTotalStats(), [workouts])
  const recent = useMemo(() => getRecentWorkouts(12), [workouts])
  const weekly = useMemo(() => getWeeklyWorkouts(), [workouts])

  const totalWorkoutsThisWeek = weekly.reduce((a, d) => a + d.length, 0)

  return (
    <div style={styles.page}>
      {/* Top nav */}
      <div style={styles.topNav}>
        <button onClick={() => navigate('/')} style={styles.backBtn}>← Home</button>
        <span style={styles.navTitle}>
          {profileName ? `${profileName}'s Dashboard` : 'Dashboard'}
        </span>
        <button onClick={() => setShowImport(true)} style={styles.importBtn}>
          🍎 Import Apple Health XML
        </button>
      </div>

      <div style={styles.content}>
        {/* ── Stat Cards ───────────────────── */}
        <div style={styles.statsRow}>
          <StatCard label="Total Workouts" value={String(stats.totalWorkouts)} sub={`${totalWorkoutsThisWeek} this week`} accent="#2ECC71" icon="🏃" />
          <StatCard label="Total Run Time" value={fmtMins(stats.totalRunMins)} accent="#3498DB" icon="⏱" />
          <StatCard label="Distance" value={`${fmt(stats.totalDistKm)}km`} accent="#9B59B6" icon="📍" />
          <StatCard label="Streak" value={`${stats.currentStreak}d`} sub="consecutive days" accent="#F39C12" icon="🔥" />
          {stats.avgHeartRate && <StatCard label="Avg Heart Rate" value={`${stats.avgHeartRate}`} sub="bpm" accent="#E74C3C" icon="❤️" />}
          {stats.totalCalories > 0 && <StatCard label="Calories Burned" value={String(Math.round(stats.totalCalories))} sub="kcal total" accent="#E67E22" icon="⚡" />}
        </div>

        {/* ── Main 2-col layout ─────────────── */}
        <div style={styles.mainGrid}>
          {/* Left column */}
          <div style={styles.leftCol}>
            {/* Weekly chart */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>Activity This Week</span>
                <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                  <span style={{ color: '#2ECC71' }}>● RunUp</span>
                  <span style={{ color: '#FF6B6B' }}>● Apple</span>
                </div>
              </div>
              <WeeklyChart data={weekly} />
            </div>

            {/* Recent workouts */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={{ display: 'flex', gap: 16 }}>
                  {(['recent', 'zones'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} style={{
                      ...styles.tabBtn,
                      color: tab === t ? '#fff' : '#555',
                      borderBottom: tab === t ? '2px solid #2ECC71' : '2px solid transparent',
                    }}>
                      {t === 'recent' ? 'Recent Workouts' : 'Heart Rate Zones'}
                    </button>
                  ))}
                </div>
                {tab === 'recent' && (
                  <button onClick={() => setShowImport(true)} style={{ ...styles.btn, fontSize: 11, padding: '5px 12px' }}>
                    + Add
                  </button>
                )}
              </div>
              <div style={{ marginTop: 16 }}>
                {tab === 'recent'
                  ? <RecentList workouts={recent} onRemove={removeWorkout} />
                  : <TrainingZones workouts={workouts} />
                }
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={styles.rightCol}>
            {/* Goal progress */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>My Goals</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
                {(['5k', '10k', '21k'] as GoalKey[]).map(goal => {
                  const meta = goalMeta[goal]
                  const done = workouts.filter(w => w.goal === goal).length
                  const total = meta.weeks * 3
                  const pct = Math.min((done / total) * 100, 100)
                  return (
                    <div key={goal} onClick={() => navigate(`/program/${goal}`)} style={{ cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{meta.label}</span>
                        <span style={{ fontSize: 12, color: '#555' }}>{done}/{total} workouts</span>
                      </div>
                      <div style={{ height: 8, background: '#1a1a1a', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background: `linear-gradient(90deg, ${meta.color}99, ${meta.color})`,
                          borderRadius: 4,
                          transition: 'width 0.6s ease',
                          boxShadow: pct > 0 ? `0 0 8px ${meta.color}66` : 'none',
                        }} />
                      </div>
                      <div style={{ fontSize: 11, color: meta.color, marginTop: 4, textAlign: 'right' }}>
                        {Math.round(pct)}% complete
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tips card */}
            <div style={{ ...styles.card, background: 'linear-gradient(135deg, #0f2027, #1a3a4a)', borderColor: '#3498DB33' }}>
              <div style={{ fontSize: 11, color: '#3498DB', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>
                Training Tip
              </div>
              <p style={{ fontSize: 14, color: '#ccc', lineHeight: 1.6, margin: 0 }}>
                {stats.currentStreak >= 7
                  ? '🔥 You\'re on a 7+ day streak! Remember recovery is part of training — rest days make you stronger.'
                  : stats.totalWorkouts === 0
                  ? '👟 Start your first workout today! Consistency beats intensity — even 20 minutes 3× a week transforms your fitness.'
                  : stats.totalWorkouts < 5
                  ? '💪 Great start! The first 2 weeks are the hardest. Your body is adapting — keep showing up.'
                  : '🏅 World-class athletes rest 80% of their training time. Aerobic base building at easy pace is the secret.'
                }
              </p>
            </div>

            {/* Apple import shortcut */}
            <div style={{ ...styles.card, cursor: 'pointer', border: '1px dashed #333' }} onClick={() => setShowImport(true)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 28 }}>🍎</div>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>Import Apple Health XML</div>
                  <div style={{ fontSize: 12, color: '#555', marginTop: 3 }}>
                    Upload your Apple Health export.xml to import all runs
                  </div>
                </div>
                <span style={{ marginLeft: 'auto', color: '#333', fontSize: 18 }}>→</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showImport && (
        <AppleImportPanel
          onAdd={addAppleWorkout}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  )
}

// ─── Styles ─────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0D0D0D',
    fontFamily: "'DM Sans', sans-serif",
    color: '#fff',
  },
  topNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderBottom: '1px solid #1a1a1a',
    background: '#0D0D0D',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  navTitle: {
    fontWeight: 800,
    fontSize: 16,
    color: '#fff',
    letterSpacing: '-0.3px',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#555',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  importBtn: {
    background: '#FF6B6B18',
    border: '1px solid #FF6B6B44',
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: 700,
    padding: '7px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  content: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '24px 24px 60px',
  },
  statsRow: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  statCard: {
    background: '#111',
    border: '1px solid #1f1f1f',
    borderRadius: 12,
    padding: '16px 20px',
    flex: '1 1 140px',
    minWidth: 120,
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 360px',
    gap: 20,
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    minWidth: 0,
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  card: {
    background: '#111',
    border: '1px solid #1f1f1f',
    borderRadius: 16,
    padding: '20px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontWeight: 700,
    fontSize: 15,
    color: '#fff',
  },
  // Chart
  chartWrap: {
    display: 'flex',
    gap: 8,
    height: 160,
    alignItems: 'flex-end',
    marginTop: 16,
  },
  chartCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
  },
  chartBarWrap: {
    flex: 1,
    width: '100%',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  chartBar: {
    width: '70%',
    borderRadius: '6px 6px 3px 3px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: 6,
    transition: 'height 0.6s ease',
  },
  chartVal: {
    fontSize: 10,
    fontWeight: 700,
    color: '#000',
  },
  chartDay: {
    fontSize: 11,
    marginTop: 6,
    fontWeight: 600,
  },
  // Workout row
  workoutRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '12px',
    background: '#0D0D0D',
    borderRadius: 10,
    border: '1px solid #1a1a1a',
  },
  goalDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
    marginTop: 5,
  },
  metaChip: {
    fontSize: 11,
    color: '#666',
  },
  // Tabs
  tabBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 14,
    fontWeight: 600,
    paddingBottom: 6,
  },
  // Import panel
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  panel: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 560,
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeBtn: {
    background: '#1a1a1a',
    border: 'none',
    color: '#666',
    width: 30,
    height: 30,
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: 14,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 14,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 12,
    color: '#777',
    fontWeight: 600,
  },
  input: {
    background: '#0D0D0D',
    border: '1px solid #2a2a2a',
    borderRadius: 8,
    color: '#fff',
    padding: '9px 12px',
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  btn: {
    background: '#2ECC71',
    border: 'none',
    borderRadius: 10,
    color: '#000',
    fontWeight: 700,
    fontSize: 14,
    padding: '10px 20px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
}