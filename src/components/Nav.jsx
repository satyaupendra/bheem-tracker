import { useApp } from '../context/AppContext'

const NAV = [
  { view: 'dashboard', emoji: '🏠', label: 'Home' },
  { view: 'food',      emoji: '🍖', label: 'Food' },
  { view: 'activity',  emoji: '🏃', label: 'Walk' },
  { view: 'photos',    emoji: '📸', label: 'Photos' },
  { view: 'tasks',     emoji: '✅', label: 'Tasks' },
]

const MORE = [
  { view: 'health',   emoji: '💉', label: 'Health' },
  { view: 'shopping', emoji: '🛒', label: 'Shop' },
  { view: 'reports',  emoji: '📊', label: 'Reports' },
  { view: 'settings', emoji: '⚙️',  label: 'Settings' },
]

export default function Nav() {
  const { view, setView, syncing } = useApp()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-50 h-nav flex items-start pt-2">
      {NAV.map(({ view: v, emoji, label }) => (
        <NavBtn key={v} emoji={emoji} label={label} active={view === v} onClick={() => setView(v)} />
      ))}
      <MoreMenu currentView={view} setView={setView} />
      {syncing && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-100 animate-pulse" />
      )}
    </nav>
  )
}

function NavBtn({ emoji, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-0.5 py-1 transition-colors
        ${active ? 'text-blue-100' : 'text-gray-100'}`}
    >
      <span className="text-xl leading-none">{emoji}</span>
      <span className={`text-xs font-medium ${active ? 'text-blue-100' : 'text-gray-100'}`}>{label}</span>
    </button>
  )
}

function MoreMenu({ currentView, setView }) {
  const isMore = MORE.some(m => m.view === currentView)
  return (
    <div className="flex-1 relative group">
      <button className={`w-full flex flex-col items-center gap-0.5 py-1 ${isMore ? 'text-blue-100' : 'text-gray-100'}`}>
        <span className="text-xl leading-none">⋯</span>
        <span className="text-xs font-medium">More</span>
      </button>
      {/* Dropdown — visible on hover/focus-within */}
      <div className="absolute bottom-full right-0 mb-1 bg-white border border-gray-50 rounded-2xl shadow-lg p-2 min-w-[9rem]
                      opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
                      translate-y-2 group-hover:translate-y-0 group-focus-within:translate-y-0
                      transition-all pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto">
        {MORE.map(({ view, emoji, label }) => (
          <button
            key={view}
            onClick={() => setView(view)}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium
              ${currentView === view ? 'bg-blue-10 text-blue-100' : 'text-gray-160 hover:bg-gray-10'}`}
          >
            <span>{emoji}</span>{label}
          </button>
        ))}
      </div>
    </div>
  )
}
