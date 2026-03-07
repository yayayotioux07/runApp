import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { goalMeta, GoalKey } from '../data/index'
import { useProgress } from '../hooks/useProgress'

const goals: GoalKey[] = ['5k', '10k', '21k']

export default function Home() {
  const navigate = useNavigate()
  const { profileName, setProfileName, setActiveGoal, getNextWorkout } = useProgress()
  const [nameInput, setNameInput] = useState(profileName)
  const [saved, setSaved]         = useState(!!profileName)

  const handleSaveName = () => {
    if (nameInput.trim()) { setProfileName(nameInput.trim()); setSaved(true) }
  }

  const handleGoalSelect = (goal: GoalKey) => {
    setActiveGoal(goal)
    navigate(`/program/${goal}`)
  }

  return (
    <div style={styles.page}>
      {/* Logo */}
      <div style={styles.logoWrap}>
        <div style={styles.logoIcon}>▶</div>
        <div style={styles.logoText}>RunUp</div>
        <div style={styles.logoSub}>Your running journey starts here</div>
      </div>

      {/* Name */}
      <div style={styles.section}>
        {!saved ? (
          <div style={styles.nameCard}>
            <p style={styles.namePrompt}>What's your name?</p>
            <div style={styles.nameRow}>
              <input
                style={styles.nameInput}
                type="text"
                placeholder="Enter your name..."
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                autoFocus
              />
              <button style={styles.saveBtn} onClick={handleSaveName}>→</button>
            </div>
          </div>
        ) : (
          <div style={styles.greetingRow}>
            <div>
              <div style={styles.greetingName}>Hey, {profileName}</div>
              <div style={styles.greetingText}>Choose a goal to continue</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={styles.dashBtn} onClick={() => navigate('/dashboard')}>📊 Dashboard</button>
              <button style={styles.editBtn} onClick={() => setSaved(false)}>Edit</button>
            </div>
          </div>
        )}
      </div>

      {/* Goal cards */}
      <div style={styles.section}>
        <div style={styles.sectionLabel}>SELECT YOUR GOAL</div>
        <div style={styles.goalList}>
          {goals.map(goal => {
            const meta = goalMeta[goal]
            const next = getNextWorkout(goal, meta.weeks)
            return (
              <button
                key={goal}
                style={styles.goalCard}
                onClick={() => handleGoalSelect(goal)}
              >
                <div style={{ ...styles.goalAccent, background: meta.color }} />
                <div style={styles.goalBody}>
                  <div style={styles.goalTop}>
                    <span style={{ ...styles.goalLabel, color: meta.color }}>{meta.label}</span>
                    <span style={styles.goalWeeks}>{meta.weeks} weeks</span>
                  </div>
                  <div style={styles.goalDesc}>{meta.description}</div>
                  {next && (
                    <div style={styles.goalNext}>
                      Next: W{next.week}/D{next.day}
                    </div>
                  )}
                </div>
                <div style={styles.goalArrow}>›</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh',
    background: '#0D0D0D',
    color: '#fff',
    fontFamily: "'DM Sans', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    padding: '0 20px 40px',
    maxWidth: '480px',
    margin: '0 auto',
  },
  logoWrap: {
    paddingTop: '60px',
    paddingBottom: '40px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  logoIcon: {
    fontSize: '28px',
    color: '#fff',
    lineHeight: 1,
  },
  logoText: {
    fontSize: '42px',
    fontWeight: '800',
    letterSpacing: '-1px',
    lineHeight: 1,
  },
  logoSub: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.35)',
    marginTop: '4px',
  },
  section: {
    marginBottom: '32px',
  },
  sectionLabel: {
    fontSize: '10px',
    letterSpacing: '3px',
    color: 'rgba(255,255,255,0.25)',
    fontWeight: '600',
    marginBottom: '12px',
  },
  nameCard: {
    background: '#161616',
    border: '1px solid #222',
    borderRadius: '14px',
    padding: '20px',
  },
  namePrompt: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: '12px',
  },
  nameRow: {
    display: 'flex',
    gap: '8px',
  },
  nameInput: {
    flex: 1,
    padding: '12px 14px',
    background: '#0D0D0D',
    border: '1px solid #2a2a2a',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
  },
  saveBtn: {
    width: '44px',
    borderRadius: '10px',
    background: '#fff',
    color: '#000',
    fontSize: '20px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#161616',
    border: '1px solid #222',
    borderRadius: '14px',
    padding: '18px 20px',
  },
  greetingName: {
    fontSize: '20px',
    fontWeight: '700',
  },
  greetingText: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.35)',
    marginTop: '2px',
  },
  editBtn: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.3)',
    background: 'transparent',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  dashBtn: {
    fontSize: '12px',
    color: '#2ECC71',
    background: '#2ECC7115',
    border: '1px solid #2ECC7133',
    borderRadius: '8px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontWeight: 700,
    fontFamily: 'inherit',
  },
  goalList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  goalCard: {
    display: 'flex',
    alignItems: 'center',
    background: '#161616',
    border: '1px solid #222',
    borderRadius: '14px',
    overflow: 'hidden',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'border-color 0.2s',
  },
  goalAccent: {
    width: '4px',
    alignSelf: 'stretch',
    flexShrink: 0,
  },
  goalBody: {
    flex: 1,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  goalTop: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '10px',
  },
  goalLabel: {
    fontSize: '22px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
  },
  goalWeeks: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.3)',
  },
  goalDesc: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.45)',
  },
  goalNext: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.25)',
    marginTop: '2px',
  },
  goalArrow: {
    fontSize: '24px',
    color: 'rgba(255,255,255,0.2)',
    paddingRight: '16px',
  },
}