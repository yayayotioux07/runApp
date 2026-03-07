import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import ProgramOverview from './pages/ProgramOverview'
import WorkoutPreview from './pages/WorkoutPreview'
import ActiveWorkout from './pages/ActiveWorkout'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/program/:goal" element={<ProgramOverview />} />
      <Route path="/workout/:goal/:week/:day" element={<WorkoutPreview />} />
      <Route path="/active/:goal/:week/:day" element={<ActiveWorkout />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}