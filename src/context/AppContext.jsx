import { createContext, useContext, useReducer, useCallback } from 'react'
import * as gh from '../utils/github'
import {
  toDateKey, toMonthKey, nowISO, uid,
  monthPath, SETTINGS_PATH, TODOS_PATH, HEALTH_PATH, SHOPPING_PATH,
  DEFAULT_SETTINGS, photoPath,
} from '../utils/helpers'

// ── State shape ──────────────────────────────────────────────────────────────

const INIT = {
  config: null,
  settings: null,
  monthLog: {},         // { [dateKey]: { food:[], water:[], activity:[], tasks:{} } }
  todos: [],
  health: [],
  shopping: [],
  shaCache: {},
  view: 'dashboard',
  selectedDate: toDateKey(),
  loading: true,
  syncing: false,
  error: null,
  setupDone: false,
}

// ── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case 'BOOT':
      return { ...state, config: action.config, setupDone: true, loading: true }
    case 'LOADED':
      return { ...state, ...action.payload, loading: false }
    case 'SET_VIEW':
      return { ...state, view: action.view }
    case 'SET_DATE':
      return { ...state, selectedDate: action.date }
    case 'SYNCING':
      return { ...state, syncing: action.val }
    case 'ERROR':
      return { ...state, error: action.msg, syncing: false }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    case 'SET_SHA':
      return { ...state, shaCache: { ...state.shaCache, [action.path]: action.sha } }
    case 'SET_MONTH_LOG':
      return { ...state, monthLog: { ...state.monthLog, ...action.log } }
    case 'SET_TODOS':
      return { ...state, todos: action.todos }
    case 'SET_HEALTH':
      return { ...state, health: action.health }
    case 'SET_SHOPPING':
      return { ...state, shopping: action.shopping }
    case 'SET_SETTINGS':
      return { ...state, settings: action.settings }
    default:
      return state
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)

// ── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INIT)

  // ── Helpers ──

  const cfg = useCallback(() => {
    const raw = localStorage.getItem('bheem_cfg')
    return raw ? JSON.parse(raw) : null
  }, [])

  const getSha = useCallback((path) => state.shaCache[path] || null, [state.shaCache])

  const syncFile = useCallback(async (path, content, message) => {
    const { token, owner, dataRepo } = cfg()
    const sha = state.shaCache[path] || null
    const newSha = await gh.putFile(token, owner, dataRepo, path, content, sha, message)
    dispatch({ type: 'SET_SHA', path, sha: newSha })
    return newSha
  }, [cfg, state.shaCache])

  // ── Bootstrap ────────────────────────────────────────────────────────────

  const boot = useCallback(async (config) => {
    localStorage.setItem('bheem_cfg', JSON.stringify(config))
    dispatch({ type: 'BOOT', config })

    const { token, owner, dataRepo } = config
    const today = toDateKey()
    const month = toMonthKey()

    try {
      // Load all base files in parallel
      const [settingsRes, todosRes, healthRes, shoppingRes, monthRes] = await Promise.all([
        gh.getFile(token, owner, dataRepo, SETTINGS_PATH),
        gh.getFile(token, owner, dataRepo, TODOS_PATH),
        gh.getFile(token, owner, dataRepo, HEALTH_PATH),
        gh.getFile(token, owner, dataRepo, SHOPPING_PATH),
        gh.getFile(token, owner, dataRepo, monthPath(month)),
      ])

      const settings  = settingsRes.content  || DEFAULT_SETTINGS
      const todos     = todosRes.content     || []
      const health    = healthRes.content    || []
      const shopping  = shoppingRes.content  || []
      const monthData = monthRes.content     || {}

      // Seed missing files
      const seeds = []
      if (!settingsRes.sha) seeds.push(gh.putFile(token, owner, dataRepo, SETTINGS_PATH, settings, null, '🐾 init: settings'))
      if (!todosRes.sha)    seeds.push(gh.putFile(token, owner, dataRepo, TODOS_PATH,    todos,    null, '🐾 init: todos'))
      if (!healthRes.sha)   seeds.push(gh.putFile(token, owner, dataRepo, HEALTH_PATH,   health,   null, '🐾 init: health'))
      if (!shoppingRes.sha) seeds.push(gh.putFile(token, owner, dataRepo, SHOPPING_PATH, shopping, null, '🐾 init: shopping'))
      if (!monthRes.sha)    seeds.push(gh.putFile(token, owner, dataRepo, monthPath(month), monthData, null, `🐾 init: ${month} log`))
      await Promise.allSettled(seeds)

      // Re-fetch SHAs after seeding
      const [s2, t2, h2, sh2, m2] = await Promise.all([
        gh.getFile(token, owner, dataRepo, SETTINGS_PATH),
        gh.getFile(token, owner, dataRepo, TODOS_PATH),
        gh.getFile(token, owner, dataRepo, HEALTH_PATH),
        gh.getFile(token, owner, dataRepo, SHOPPING_PATH),
        gh.getFile(token, owner, dataRepo, monthPath(month)),
      ])

      const shaCache = {
        [SETTINGS_PATH]:   s2.sha,
        [TODOS_PATH]:      t2.sha,
        [HEALTH_PATH]:     h2.sha,
        [SHOPPING_PATH]:   sh2.sha,
        [monthPath(month)]: m2.sha,
      }

      dispatch({
        type: 'LOADED',
        payload: { settings, todos, health, shopping, monthLog: m2.content || {}, shaCache, selectedDate: today },
      })
    } catch (e) {
      dispatch({ type: 'ERROR', msg: e.message })
    }
  }, [])

  // ── Load month ────────────────────────────────────────────────────────────

  const loadMonth = useCallback(async (monthKey) => {
    const { token, owner, dataRepo } = cfg()
    const path = monthPath(monthKey)
    if (state.shaCache[path]) return // already loaded
    try {
      const { content, sha } = await gh.getFile(token, owner, dataRepo, path)
      const data = content || {}
      dispatch({ type: 'SET_MONTH_LOG', log: data })
      if (sha) dispatch({ type: 'SET_SHA', path, sha })
    } catch (e) { /* ignore */ }
  }, [cfg, state.shaCache])

  // ── Day log ops ───────────────────────────────────────────────────────────

  const getDayLog = useCallback((dateKey = state.selectedDate) => {
    return state.monthLog[dateKey] || { food: [], water: [], activity: [] }
  }, [state.monthLog, state.selectedDate])

  const saveDayLog = useCallback(async (dateKey, dayData) => {
    const month = dateKey.slice(0, 7)
    const path = monthPath(month)
    const updated = { ...state.monthLog, [dateKey]: dayData }
    dispatch({ type: 'SET_MONTH_LOG', log: updated })
    dispatch({ type: 'SYNCING', val: true })
    try {
      await syncFile(path, updated, `🐾 log ${dateKey}`)
    } catch (e) {
      dispatch({ type: 'ERROR', msg: e.message })
    } finally {
      dispatch({ type: 'SYNCING', val: false })
    }
  }, [state.monthLog, syncFile])

  // ── Food ──────────────────────────────────────────────────────────────────

  const addFood = useCallback(async (entry) => {
    const dateKey = state.selectedDate
    const day = getDayLog(dateKey)
    const updated = { ...day, food: [...(day.food || []), { id: uid(), ts: nowISO(), ...entry }] }
    await saveDayLog(dateKey, updated)
  }, [state.selectedDate, getDayLog, saveDayLog])

  const deleteFood = useCallback(async (entryId) => {
    const dateKey = state.selectedDate
    const day = getDayLog(dateKey)
    const updated = { ...day, food: (day.food || []).filter(e => e.id !== entryId) }
    await saveDayLog(dateKey, updated)
  }, [state.selectedDate, getDayLog, saveDayLog])

  // ── Water ─────────────────────────────────────────────────────────────────

  const addWater = useCallback(async (entry) => {
    const dateKey = state.selectedDate
    const day = getDayLog(dateKey)
    const updated = { ...day, water: [...(day.water || []), { id: uid(), ts: nowISO(), ...entry }] }
    await saveDayLog(dateKey, updated)
  }, [state.selectedDate, getDayLog, saveDayLog])

  // ── Activity ──────────────────────────────────────────────────────────────

  const addActivity = useCallback(async (entry) => {
    const dateKey = state.selectedDate
    const day = getDayLog(dateKey)
    const updated = { ...day, activity: [...(day.activity || []), { id: uid(), ts: nowISO(), ...entry }] }
    await saveDayLog(dateKey, updated)
  }, [state.selectedDate, getDayLog, saveDayLog])

  const deleteActivity = useCallback(async (entryId) => {
    const dateKey = state.selectedDate
    const day = getDayLog(dateKey)
    const updated = { ...day, activity: (day.activity || []).filter(e => e.id !== entryId) }
    await saveDayLog(dateKey, updated)
  }, [state.selectedDate, getDayLog, saveDayLog])

  // ── Tasks — stored inside monthLog[dateKey].tasks, not a separate state ────

  const toggleTask = useCallback(async (taskId) => {
    const dateKey = state.selectedDate
    const day     = getDayLog(dateKey)
    const current = day.tasks?.[taskId]
    const newTasks = {
      ...(day.tasks || {}),
      [taskId]: current?.done
        ? { done: false, ts: null }
        : { done: true,  ts: nowISO() },
    }
    const updatedDay = { ...day, tasks: newTasks }
    await saveDayLog(dateKey, updatedDay)
  }, [state.selectedDate, getDayLog, saveDayLog])

  // ── Todos ─────────────────────────────────────────────────────────────────

  const addTodo = useCallback(async (text, category = 'general') => {
    const updated = [...state.todos, { id: uid(), text, category, done: false, createdAt: nowISO(), doneAt: null }]
    dispatch({ type: 'SET_TODOS', todos: updated })
    dispatch({ type: 'SYNCING', val: true })
    try { await syncFile(TODOS_PATH, updated, `📝 todo: ${text.slice(0, 40)}`) }
    catch (e) { dispatch({ type: 'ERROR', msg: e.message }) }
    finally   { dispatch({ type: 'SYNCING', val: false }) }
  }, [state.todos, syncFile])

  const toggleTodo = useCallback(async (id) => {
    const updated = state.todos.map(t => t.id === id
      ? { ...t, done: !t.done, doneAt: !t.done ? nowISO() : null }
      : t)
    dispatch({ type: 'SET_TODOS', todos: updated })
    dispatch({ type: 'SYNCING', val: true })
    try { await syncFile(TODOS_PATH, updated, `✅ todo toggle ${id}`) }
    catch (e) { dispatch({ type: 'ERROR', msg: e.message }) }
    finally   { dispatch({ type: 'SYNCING', val: false }) }
  }, [state.todos, syncFile])

  const deleteTodo = useCallback(async (id) => {
    const updated = state.todos.filter(t => t.id !== id)
    dispatch({ type: 'SET_TODOS', todos: updated })
    dispatch({ type: 'SYNCING', val: true })
    try { await syncFile(TODOS_PATH, updated, `🗑️ todo delete ${id}`) }
    catch (e) { dispatch({ type: 'ERROR', msg: e.message }) }
    finally   { dispatch({ type: 'SYNCING', val: false }) }
  }, [state.todos, syncFile])

  // ── Health ────────────────────────────────────────────────────────────────

  const addHealth = useCallback(async (entry) => {
    const updated = [...state.health, { id: uid(), createdAt: nowISO(), ...entry }]
    dispatch({ type: 'SET_HEALTH', health: updated })
    dispatch({ type: 'SYNCING', val: true })
    try { await syncFile(HEALTH_PATH, updated, `💉 health: ${entry.type}`) }
    catch (e) { dispatch({ type: 'ERROR', msg: e.message }) }
    finally   { dispatch({ type: 'SYNCING', val: false }) }
  }, [state.health, syncFile])

  // ── Shopping ──────────────────────────────────────────────────────────────

  const addShoppingItem = useCallback(async (text) => {
    const updated = [...state.shopping, { id: uid(), text, done: false, addedAt: nowISO() }]
    dispatch({ type: 'SET_SHOPPING', shopping: updated })
    dispatch({ type: 'SYNCING', val: true })
    try { await syncFile(SHOPPING_PATH, updated, `🛒 shopping: ${text.slice(0, 40)}`) }
    catch (e) { dispatch({ type: 'ERROR', msg: e.message }) }
    finally   { dispatch({ type: 'SYNCING', val: false }) }
  }, [state.shopping, syncFile])

  const toggleShoppingItem = useCallback(async (id) => {
    const updated = state.shopping.map(s => s.id === id ? { ...s, done: !s.done } : s)
    dispatch({ type: 'SET_SHOPPING', shopping: updated })
    dispatch({ type: 'SYNCING', val: true })
    try { await syncFile(SHOPPING_PATH, updated, `🛒 toggle ${id}`) }
    catch (e) { dispatch({ type: 'ERROR', msg: e.message }) }
    finally   { dispatch({ type: 'SYNCING', val: false }) }
  }, [state.shopping, syncFile])

  const deleteShoppingItem = useCallback(async (id) => {
    const updated = state.shopping.filter(s => s.id !== id)
    dispatch({ type: 'SET_SHOPPING', shopping: updated })
    dispatch({ type: 'SYNCING', val: true })
    try { await syncFile(SHOPPING_PATH, updated, `🗑️ shopping delete ${id}`) }
    catch (e) { dispatch({ type: 'ERROR', msg: e.message }) }
    finally   { dispatch({ type: 'SYNCING', val: false }) }
  }, [state.shopping, syncFile])

  // ── Photo upload ──────────────────────────────────────────────────────────

  const uploadPhoto = useCallback(async (dateKey, base64Data) => {
    const { token, owner, dataRepo } = cfg()
    const path = photoPath(dateKey)
    dispatch({ type: 'SYNCING', val: true })
    try {
      const sha = state.shaCache[path] || null
      const { sha: newSha } = await gh.putImage(token, owner, dataRepo, path, base64Data, sha, `📸 photo ${dateKey}`)
      dispatch({ type: 'SET_SHA', path, sha: newSha })
      // store URL in day log
      const day = getDayLog(dateKey)
      const month = dateKey.slice(0, 7)
      const monthData = { ...state.monthLog, [dateKey]: { ...day, photoPath: path } }
      dispatch({ type: 'SET_MONTH_LOG', log: monthData })
      await syncFile(monthPath(month), monthData, `📸 photo ref ${dateKey}`)
    } catch (e) {
      dispatch({ type: 'ERROR', msg: e.message })
    } finally {
      dispatch({ type: 'SYNCING', val: false })
    }
  }, [cfg, state.shaCache, state.monthLog, getDayLog, syncFile])

  const getPhotoUrl = useCallback(async (dateKey) => {
    const { token, owner, dataRepo } = cfg()
    return gh.getImageUrl(token, owner, dataRepo, photoPath(dateKey))
  }, [cfg])

  // ── Settings ──────────────────────────────────────────────────────────────

  const saveSettings = useCallback(async (newSettings) => {
    dispatch({ type: 'SET_SETTINGS', settings: newSettings })
    dispatch({ type: 'SYNCING', val: true })
    try { await syncFile(SETTINGS_PATH, newSettings, '⚙️ update settings') }
    catch (e) { dispatch({ type: 'ERROR', msg: e.message }) }
    finally   { dispatch({ type: 'SYNCING', val: false }) }
  }, [syncFile])

  const setView  = useCallback((v) => dispatch({ type: 'SET_VIEW', view: v }), [])
  const setDate  = useCallback((d) => dispatch({ type: 'SET_DATE', date: d }), [])
  const clearErr = useCallback(()  => dispatch({ type: 'CLEAR_ERROR' }), [])

  const value = {
    ...state, boot, setView, setDate, clearErr, loadMonth,
    getDayLog, addFood, deleteFood, addWater, addActivity, deleteActivity,
    toggleTask, addTodo, toggleTodo, deleteTodo,
    addHealth, addShoppingItem, toggleShoppingItem, deleteShoppingItem,
    uploadPhoto, getPhotoUrl, saveSettings,
  }

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}
