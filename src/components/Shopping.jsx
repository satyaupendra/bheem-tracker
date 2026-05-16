import { useState } from 'react'
import { useApp } from '../context/AppContext'
import PageHeader from './PageHeader'

const QUICK = ['Dog food 🐶', 'Dog treats 🦴', 'Poop bags 💩', 'Shampoo 🛁', 'Flea medicine 💊', 'Water bowl 💧']

export default function Shopping() {
  const { shopping, addShoppingItem, toggleShoppingItem, deleteShoppingItem, syncing } = useApp()
  const [text, setText] = useState('')

  const add = async (item) => {
    const val = item || text.trim()
    if (!val) return
    await addShoppingItem(val)
    setText('')
  }

  const pending = shopping.filter(s => !s.done)
  const done    = shopping.filter(s => s.done)

  return (
    <div>
      <PageHeader title="Shopping List 🛒" />

      <div className="mx-4 space-y-4">
        {/* Quick add */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Add item…" value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && add()} />
            <button onClick={() => add()} disabled={!text.trim() || syncing}
              className="btn-primary px-4 disabled:opacity-50">+</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK.filter(q => !shopping.some(s => s.text === q)).map(q => (
              <button key={q} onClick={() => add(q)}
                className="bg-gray-10 text-gray-160 text-xs px-3 py-1.5 rounded-full active:bg-gray-50">
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Pending items */}
        {pending.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {pending.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-10 last:border-0">
                <button onClick={() => toggleShoppingItem(item.id)}
                  className="w-6 h-6 rounded-full border-2 border-gray-50 flex items-center justify-center flex-shrink-0" />
                <span className="flex-1 text-gray-160">{item.text}</span>
                <button onClick={() => deleteShoppingItem(item.id)} className="text-gray-50 hover:text-red-100">×</button>
              </div>
            ))}
          </div>
        )}

        {/* Done items */}
        {done.length > 0 && (
          <div>
            <p className="text-xs text-gray-100 font-semibold px-1 mb-2">✅ Completed</p>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden opacity-60">
              {done.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-10 last:border-0">
                  <button onClick={() => toggleShoppingItem(item.id)}
                    className="w-6 h-6 rounded-full bg-green-100 border-2 border-green-100 flex items-center justify-center text-white text-xs flex-shrink-0">✓</button>
                  <span className="flex-1 text-gray-100 line-through text-sm">{item.text}</span>
                  <button onClick={() => deleteShoppingItem(item.id)} className="text-gray-50 hover:text-red-100">×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {shopping.length === 0 && (
          <div className="text-center text-gray-100 py-8">
            <p className="text-3xl mb-2">🛒</p>
            <p className="text-sm">Shopping list is empty! Add food, treats, supplies…</p>
          </div>
        )}
      </div>
    </div>
  )
}
