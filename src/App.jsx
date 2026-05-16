import { useEffect } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Setup    from './components/Setup'
import Nav      from './components/Nav'
import Dashboard  from './components/Dashboard'
import FoodLog    from './components/FoodLog'
import ActivityLog from './components/ActivityLog'
import PhotoLog   from './components/PhotoLog'
import Tasks      from './components/Tasks'
import Health     from './components/Health'
import Shopping   from './components/Shopping'
import Reports    from './components/Reports'
import Settings   from './components/Settings'
import WeeklyFood from './components/WeeklyFood'

const VIEWS = {
  dashboard:  <Dashboard />,
  food:       <FoodLog />,
  activity:   <ActivityLog />,
  photos:     <PhotoLog />,
  tasks:      <Tasks />,
  health:     <Health />,
  shopping:   <Shopping />,
  reports:    <Reports />,
  settings:   <Settings />,
  weeklyFood: <WeeklyFood />,
}

function Inner() {
  const { setupDone, loading, error, clearErr, boot, view } = useApp()

  // Auto-boot if config already stored
  useEffect(() => {
    const raw = localStorage.getItem('bheem_cfg')
    if (raw) boot(JSON.parse(raw))
  }, [boot])

  if (!setupDone) return <Setup />

  return (
    <div className="flex flex-col h-screen bg-gray-10 overflow-hidden">
      {/* Top safe area */}
      <div className="bg-blue-100 safe-top" />

      {/* Error toast */}
      {error && (
        <div
          className="fixed top-0 left-0 right-0 z-50 bg-red-100 text-white text-sm px-4 py-3 flex justify-between items-center"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
        >
          <span>⚠️ {error}</span>
          <button onClick={clearErr} className="ml-4 font-bold">✕</button>
        </div>
      )}

      {/* Main scroll area */}
      <main className="flex-1 overflow-y-auto pb-nav no-scrollbar">
        {loading
          ? <div className="flex items-center justify-center h-full text-5xl animate-bounce">🐾</div>
          : (VIEWS[view] || <Dashboard />)
        }
      </main>

      {/* Bottom nav */}
      {!loading && <Nav />}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Inner />
    </AppProvider>
  )
}
