import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { toDisplayDate } from '../utils/helpers'
import PageHeader from './PageHeader'

const TODO_CATS = [
  { value: 'vet',      label: '🏥 Vet visit' },
  { value: 'vaccine',  label: '💉 Vaccination' },
  { value: 'grooming', label: '✂️ Grooming' },
  { value: 'food',     label: '🛒 Buy food' },
  { value: 'medicine', label: '💊 Medicine' },
  { value: 'general',  label: '📝 General' },
]

export default function Tasks() {
  const { settings, getDayLog, selectedDate, toggleTask, todos, addTodo, toggleTodo, deleteTodo, syncing } = useApp()
  const dailyTasks = settings?.tasks?.daily || []
  const dayTasks   = getDayLog(selectedDate).tasks || {}
  const [tab, setTab]    = useState('daily')
  const [newTodo, setNewTodo] = useState('')
  const [cat, setCat]    = useState('general')

  const doneCnt = dailyTasks.filter(t => dayTasks[t.id]?.done).length

  const addTodoItem = async () => {
    if (!newTodo.trim()) return
    await addTodo(newTodo.trim(), cat)
    setNewTodo('')
  }

  return (
    <div>
      <PageHeader title="Tasks & Todos ✅" />

      {/* Tab bar */}
      <div className="flex mx-4 bg-gray-10 rounded-xl p-1 mb-4">
        <button onClick={() => setTab('daily')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold ${tab === 'daily' ? 'bg-white text-blue-100 shadow-sm' : 'text-gray-100'}`}>
          📅 Daily ({doneCnt}/{dailyTasks.length})
        </button>
        <button onClick={() => setTab('todos')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold ${tab === 'todos' ? 'bg-white text-blue-100 shadow-sm' : 'text-gray-100'}`}>
          📝 Todos ({todos.filter(t => !t.done).length})
        </button>
      </div>

      {tab === 'daily' && (
        <div className="mx-4 space-y-2">
          <p className="text-xs text-gray-100 mb-3 text-center">{toDisplayDate(selectedDate)}</p>
          {dailyTasks.map(task => {
            const done = dayTasks[task.id]?.done || false
            const ts   = dayTasks[task.id]?.ts
            return (
              <button key={task.id} onClick={() => toggleTask(task.id)} disabled={syncing}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl shadow-sm text-left transition-all active:scale-98
                  ${done ? 'bg-green-10 border border-green-100' : 'bg-white'}`}>
                <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-sm font-bold
                  ${done ? 'bg-green-100 border-green-100 text-white' : 'border-gray-50 text-gray-50'}`}>
                  {done ? '✓' : ''}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${done ? 'line-through text-gray-100' : 'text-gray-160'}`}>
                    {task.emoji} {task.label}
                  </p>
                  {ts && (
                    <p className="text-xs text-green-100 mt-0.5">
                      ✓ {new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
          {doneCnt === dailyTasks.length && dailyTasks.length > 0 && (
            <div className="text-center py-4 text-2xl">🎉 All done! Good boy!</div>
          )}
        </div>
      )}

      {tab === 'todos' && (
        <div className="mx-4 space-y-3">
          {/* Add todo */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <select className="input" value={cat} onChange={e => setCat(e.target.value)}>
              {TODO_CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Add a todo…" value={newTodo}
                onChange={e => setNewTodo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTodoItem()} />
              <button onClick={addTodoItem} disabled={!newTodo.trim() || syncing}
                className="btn-primary px-4 disabled:opacity-50">+</button>
            </div>
          </div>

          {/* Todo list by category */}
          {TODO_CATS.map(c => {
            const items = todos.filter(t => t.category === c.value)
            if (!items.length) return null
            return (
              <div key={c.value} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-2 bg-gray-10 border-b border-gray-50">
                  <span className="text-sm font-semibold text-gray-160">{c.label}</span>
                </div>
                {items.map(todo => (
                  <div key={todo.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-10 last:border-0">
                    <button onClick={() => toggleTodo(todo.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs
                        ${todo.done ? 'bg-green-100 border-green-100 text-white' : 'border-gray-50'}`}>
                      {todo.done ? '✓' : ''}
                    </button>
                    <span className={`flex-1 text-sm ${todo.done ? 'line-through text-gray-100' : 'text-gray-160'}`}>
                      {todo.text}
                    </span>
                    {todo.doneAt && (
                      <span className="text-xs text-gray-100">{new Date(todo.doneAt).toLocaleDateString()}</span>
                    )}
                    <button onClick={() => deleteTodo(todo.id)} className="text-gray-50 hover:text-red-100 transition-colors">×</button>
                  </div>
                ))}
              </div>
            )
          })}

          {todos.length === 0 && (
            <div className="text-center text-gray-100 py-8">
              <p className="text-3xl mb-2">📝</p>
              <p className="text-sm">No todos yet! Add vet visits, vaccinations, shopping reminders…</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
