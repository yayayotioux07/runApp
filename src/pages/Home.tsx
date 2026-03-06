import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { goalMeta, GoalKey } from '../data/index'
import { useProgress } from '../hooks/useProgress'

const goals: GoalKey[] = ['5k', '10k', '21k']

export default function Home() {
  const navigate = useNavigate()
  const { profileName, setProfileName, setActiveGoal } = useProgress()
  const [nameInput, setNameInput] = useState(profileName)
  const [saved, setSaved] = useState(!!profileName)

  const handleSaveName = () => {
    if (nameInput.trim()) {
      setProfileName(nameInput.trim())
      setSaved(true)
    }
  }

  const handleGoalSelect = (goal: GoalKey) => {
    setActiveGoal(goal)
    navigate(`/program/${goal}`)
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>🏃 RunUp</div>
        <p style={styles.tagline}>From couch to finish line</p>
      </div>

      {/* Profile Name */}
      <div style={styles.profileSection}>
        {!saved ? (
          <div style={styles.nameForm}>
            <p style={styles.namePrompt}>What should we call you?</p>
            <div style={styles.nameInputRow}>
              <input
                style={styles.nameInput}
                type="text"
                placeholder="Your name..."
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                autoFocus
              />
              <button style={styles.saveBtn} onClick={handleSaveName}>
                Let's Go →
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.greeting}>
            <span style={styles.greetingText}>Hey, {profileName}! 👋</span>
            <button style={styles.editBtn} onClick={() => setSaved(false)}>Edit</button>
          </div>
        )}
      </div>

      {/* Goal Cards */}
      <div style={styles.goalsSection}>
        <p style={styles.goalsTitle}>Choose your goal</p>
        <div style={styles.goalCards}>
          {goals.map(goal => {
            const meta = goalMeta[goal]
            return (
              <button
                key={goal}
                style={{ ...styles.goalCard, borderColor: meta.color }}
                onClick={() => handleGoalSelect(goal)}
              >
                <div style={styles.goalEmoji}>{meta.emoji}</div>
                <div style={{ ...styles.goalLabel, color: meta.color }}>{meta.label}</div>
                <div style={styles.goalWeeks}>{meta.weeks} weeks</div>
                <div style={styles.goalDesc}>{meta.description}</div>
                <div style={{ ...styles.goalArrow, background: meta.color }}>→</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100dvh',
    background: 'linear-gradient(160deg, #0f0c29, #302b63, #24243e)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 20px 40px',
    fontFamily: "'DM Sans', sans-serif",
  },
  header: {
    textAlign: 'center',
    padding: '50px 0 20px',
  },
  logo: {
    fontSize: '42px',
    fontWeight: '700',
    letterSpacing: '2px',
    color: '#fff',
  },
  tagline: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
    marginTop: '6px',
    letterSpacing: '1px',
  },
  profileSection: {
    width: '100%',
    maxWidth: '420px',
    marginBottom: '32px',
  },
  nameForm: {
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  namePrompt: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: '14px',
    textAlign: 'center',
  },
  nameInputRow: {
    display: 'flex',
    gap: '10px',
  },
  nameInput: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    fontSize: '16px',
    outline: 'none',
  },
  saveBtn: {
    padding: '12px 20px',
    borderRadius: '10px',
    background: '#2ECC71',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  greeting: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '16px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  greetingText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#fff',
  },
  editBtn: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.4)',
    background: 'transparent',
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.15)',
  },
  goalsSection: {
    width: '100%',
    maxWidth: '420px',
  },
  goalsTitle: {
    fontSize: '13px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: '16px',
    textAlign: 'center',
  },
  goalCards: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  goalCard: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto auto',
    gridTemplateRows: 'auto auto',
    alignItems: 'center',
    gap: '4px 14px',
    padding: '18px 20px',
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1.5px solid',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.2s, transform 0.15s',
  },
  goalEmoji: {
    fontSize: '28px',
    gridRow: '1 / 3',
  },
  goalLabel: {
    fontSize: '22px',
    fontWeight: '700',
    lineHeight: 1,
  },
  goalWeeks: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.4)',
    gridColumn: '4',
    gridRow: '1',
    textAlign: 'right',
  },
  goalDesc: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.5)',
    gridColumn: '2',
    gridRow: '2',
  },
  goalArrow: {
    gridColumn: '4',
    gridRow: '2',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    color: '#fff',
    fontWeight: '700',
  },
}
