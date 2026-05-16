import { useApp } from '../context/AppContext'
import { toDisplayDate } from '../utils/helpers'

// Shared page header with date navigator
export default function PageHeader({ title }) {
  const { selectedDate, setDate } = useApp()

  const changeDay = (delta) => {
    const d = new Date(selectedDate + 'T12:00:00')
    d.setDate(d.getDate() + delta)
    const next = d.toISOString().slice(0, 10)
    if (next <= new Date().toISOString().slice(0, 10)) setDate(next)
  }

  const isToday = selectedDate === new Date().toISOString().slice(0, 10)

  return (
    <div className="bg-blue-100 px-4 pb-4 pt-3 mb-4">
      <h1 className="text-white font-bold text-lg">{title}</h1>
      <div className="flex items-center gap-2 mt-1">
        <button onClick={() => changeDay(-1)} className="text-blue-50 text-xl px-1">‹</button>
        <span className="text-blue-50 text-sm flex-1 text-center">{toDisplayDate(selectedDate)}</span>
        <button onClick={() => changeDay(1)} disabled={isToday}
          className="text-blue-50 text-xl px-1 disabled:opacity-30">›</button>
      </div>
    </div>
  )
}
